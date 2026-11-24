import { GEMINI_API, GEMINI_MODEL } from '@/constants/api';
import { AppError } from './errors';
import { geminiKeyStorage } from './session';
import { prepareImage } from './imageUtils';
import { buildSystemPrompt, buildUserText, type PostInput } from './promptBuilder';
import { normalizeBody } from '@/utils/postFormat';
import { pickModels } from './modelSelector';
import { IS_MOCK } from '@/constants/config';
import { MOCK_GENERATED } from './mock/data';
import type { GeneratedPost } from '@/types';

const RESPONSE_SCHEMA = {
  type: 'OBJECT',
  properties: {
    title: { type: 'STRING' },
    body: { type: 'STRING' },
    labels: { type: 'ARRAY', items: { type: 'STRING' } },
    alts: { type: 'ARRAY', items: { type: 'STRING' } },
  },
  required: ['title', 'body', 'labels'],
};

// ── 모델 순차 시도 ─────────────────────────────────────────────
const MODEL_LIST_TTL = 60 * 60 * 1000;
const COOLDOWN_MS = 60 * 1000;
let modelCache: { key: string; at: number; models: string[] } | null = null;
const cooldown = new Map<string, number>(); // 한도에 걸린 모델은 잠시 건너뜀

async function resolveModels(key: string): Promise<string[]> {
  if (modelCache && modelCache.key === key && Date.now() - modelCache.at < MODEL_LIST_TTL) {
    return modelCache.models;
  }
  try {
    const res = await fetch(`${GEMINI_API}/models?pageSize=1000`, { headers: { 'x-goog-api-key': key } });
    if (res.ok) {
      const j = await res.json();
      const models = pickModels(j.models ?? []);
      if (models.length) {
        modelCache = { key, at: Date.now(), models };
        return models;
      }
    }
  } catch {}
  return [GEMINI_MODEL]; // 목록 조회 실패 시 기본 모델
}

const REQUEST_TIMEOUT_MS = 60_000;
/** 혼잡(503/시간초과) 시 라운드 사이 대기(ms). 지수적으로 늘려 서버가 풀릴 시간을 준다 */
const OVERLOAD_BACKOFF_MS = [2000, 4000, 8000, 12000];

type Attempt = { ok: true; text: string } | { ok: false; next: true; reason: string; detail?: string } | { ok: false; next: false; error: AppError };

async function callModel(model: string, key: string, body: object): Promise<Attempt> {
  const url = `${GEMINI_API}/models/${model}:generateContent`;
  // 앱이 백그라운드로 가면 연결이 끊긴 채 응답이 영영 안 올 수 있어, 시간 제한을 두고 끊는다
  const post = async (b: object) => {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), REQUEST_TIMEOUT_MS);
    try {
      return await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
        body: JSON.stringify(b),
        signal: ctrl.signal,
      });
    } finally {
      clearTimeout(timer);
    }
  };

  let res: Response;
  try {
    res = await post(body);
    // 일부 모델은 thinking 설정을 받지 않음 → 설정 없이 1회 재시도
    if (res.status === 400) {
      const msg = ((await res.clone().json().catch(() => null)) as { error?: { message?: string } } | null)?.error?.message ?? '';
      if (/thinking/i.test(msg)) {
        const gc = { ...(body as { generationConfig: object }).generationConfig } as Record<string, unknown>;
        delete gc.thinkingConfig;
        res = await post({ ...body, generationConfig: gc });
      }
    }
  } catch (e) {
    // 응답이 너무 늦으면 혼잡으로 보고 다른 모델/다음 라운드로 재시도
    if ((e as Error)?.name === 'AbortError') return { ok: false, next: true, reason: 'overloaded' };
    return { ok: false, next: false, error: new AppError('NETWORK', '네트워크 연결을 확인해주세요.') };
  }

  if (res.ok) {
    const j = await res.json();
    const text: string = (j?.candidates?.[0]?.content?.parts ?? [])
      .map((x: { text?: string }) => x.text ?? '')
      .join('');
    if (text) return { ok: true, text };
    return { ok: false, next: true, reason: 'blocked' }; // 안전 정책 등 → 다음 모델 시도
  }

  if (res.status === 429) {
    cooldown.set(model, Date.now() + COOLDOWN_MS);
    return { ok: false, next: true, reason: 'quota' };
  }
  // 서버 과부하/일시 오류 → 다음 모델 시도 (모두 실패하면 generatePost에서 재시도)
  if (res.status === 500 || res.status === 502 || res.status === 503 || res.status === 504) {
    return { ok: false, next: true, reason: 'overloaded' };
  }
  if (res.status === 404) return { ok: false, next: true, reason: 'missing', detail: `모델 ${model}을(를) 찾을 수 없어요.` };

  const j = await res.json().catch(() => null);
  const msg: string = j?.error?.message ?? '';
  if (res.status === 403 || (res.status === 400 && /API key/i.test(msg))) {
    return {
      ok: false,
      next: false,
      error: new AppError('GEMINI_KEY_INVALID', 'Gemini API 키가 올바르지 않아요. 설정에서 다시 등록해주세요.'),
    };
  }
  if (res.status === 400) return { ok: false, next: true, reason: 'bad-request', detail: msg || '요청이 거부되었어요.' }; // 이미지 미지원 등 → 다음 모델
  return { ok: false, next: false, error: new AppError('UNKNOWN', `글 생성 실패 (${res.status})`) };
}

export async function generatePost(input: PostInput): Promise<GeneratedPost> {
  if (IS_MOCK) {
    await new Promise((r) => setTimeout(r, 2000));
    return { ...MOCK_GENERATED, body: normalizeBody(MOCK_GENERATED.body, input.photos.length) };
  }

  const key = await geminiKeyStorage.get();
  if (!key) throw new AppError('GEMINI_KEY_MISSING', 'Gemini API 키를 먼저 등록해주세요.');

  // 병렬 인코딩하되 Promise.all이 순서를 보장하므로 사진 순서는 유지됨
  const encoded = await Promise.all(input.photos.map((p) => prepareImage(p.uri, 896, 0.7)));
  const parts: object[] = [{ text: buildUserText(input) }];
  input.photos.forEach((p, i) => {
    parts.push({ text: `사진${i + 1}${p.note.trim() ? ` (사용자 메모: ${p.note.trim()})` : ''}` });
    parts.push({ inlineData: { mimeType: 'image/jpeg', data: encoded[i].base64 } });
  });
  const body = {
    systemInstruction: { parts: [{ text: buildSystemPrompt(input) }] },
    contents: [{ role: 'user', parts }],
    generationConfig: {
      temperature: 0.9,
      maxOutputTokens: 8192,
      thinkingConfig: { thinkingBudget: 0 }, // 후기 작성에 추론이 불필요 — 속도·무료 한도 절약
      responseMimeType: 'application/json',
      responseSchema: RESPONSE_SCHEMA,
    },
  };

  // 좋은 모델부터 순서대로. 한도·미존재·미지원이면 다음 모델로
  const all = await resolveModels(key);
  const now = Date.now();
  const ready = all.filter((m) => (cooldown.get(m) ?? 0) <= now);
  const queue = ready.length ? ready : all; // 모두 쿨다운이면 그래도 시도

  let sawQuota = false;
  let sawOverload = false;
  let lastDetail: string | null = null;
  let text: string | null = null;
  // 과부하(503)는 잠깐 뒤 풀리는 경우가 많아 대기 시간을 늘려가며 최대 5라운드(모든 모델 순회)까지 재시도
  for (let round = 0; round <= OVERLOAD_BACKOFF_MS.length && text === null; round++) {
    if (round > 0) {
      const wait = OVERLOAD_BACKOFF_MS[round - 1];
      await new Promise((r) => setTimeout(r, wait + Math.random() * 1000));
    }
    sawOverload = false;
    for (const model of queue) {
      const r = await callModel(model, key, body);
      if (r.ok) { text = r.text; break; }
      if (!r.next) throw r.error;
      if (r.reason === 'quota') sawQuota = true;
      if (r.reason === 'overloaded') sawOverload = true;
      if (r.detail) lastDetail = r.detail;
    }
    if (!sawOverload) break; // 과부하가 아니면 재시도해도 소용없음
  }

  if (text === null) {
    if (sawOverload && !sawQuota)
      throw new AppError('UNKNOWN', 'Gemini 서버가 혼잡해 여러 번 재시도했지만 실패했어요(503). 1~2분 뒤 다시 시도해주세요.');
    if (sawQuota)
      throw new AppError('GEMINI_QUOTA', '무료 사용량 한도에 도달했어요. 잠시 후 다시 시도해주세요.');
    // 요청 자체가 거부된 경우(모든 모델이 400/404)는 실제 사유를 보여줘서 원인을 알 수 있게 함
    if (lastDetail)
      throw new AppError('UNKNOWN', `글 생성 요청이 거부되었어요: ${lastDetail.slice(0, 160)}`);
    throw new AppError('GEMINI_BLOCKED', '안전 정책 등으로 글을 생성하지 못했어요. 사진이나 메모를 바꿔 다시 시도해주세요.');
  }

  let parsed: GeneratedPost;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new AppError('UNKNOWN', 'AI 응답을 해석하지 못했어요. 다시 생성해주세요.');
  }
  return {
    title: parsed.title?.trim() || input.placeName,
    body: normalizeBody(parsed.body ?? '', input.photos.length),
    labels: (parsed.labels ?? []).map((l) => l.replace(/^#/, '').trim()).filter(Boolean).slice(0, 6),
    // 사진 수에 맞춰 정렬 (부족하면 빈 문자열 → 발행 시 메모/장소명으로 대체)
    alts: input.photos.map((_, i) => (parsed.alts?.[i] ?? '').trim().slice(0, 120)),
  };
}

/** 키 형식 사전 검사 (구글 API 키는 "AIza"로 시작, 39자) */
/** 붙여넣기 때 따라오는 공백·줄바꿈·보이지 않는 문자·따옴표 제거 */
export function cleanGeminiKey(raw: string): string {
  return raw.replace(/[\s\u200B-\u200D\uFEFF]/g, '').replace(/^["'`]+|["'`]+$/g, '');
}

/**
 * 최소한의 모양만 검사한다. 키 형식은 구글이 바꿀 수 있어서(예전 "AIza…", 새 형식 등) 엄격하게 막지 않고,
 * 실제 유효 여부는 validateGeminiKey(서버 확인)로 판단한다.
 */
export function looksLikeGeminiKey(key: string): boolean {
  return /^[\w.\-]{20,}$/.test(cleanGeminiKey(key));
}

/** 실제로 호출해 키가 유효한지 확인. 유효하면 true, 거부되면 false, 네트워크 오류는 throw */
export async function validateGeminiKey(key: string): Promise<boolean> {
  if (IS_MOCK) return true;
  let res: Response;
  try {
    res = await fetch(`${GEMINI_API}/models?pageSize=1`, {
      headers: { 'x-goog-api-key': cleanGeminiKey(key) },
    });
  } catch {
    throw new AppError('NETWORK', '네트워크 연결을 확인해주세요.');
  }
  if (res.ok) return true;
  if (res.status === 400 || res.status === 401 || res.status === 403) return false;
  throw new AppError('UNKNOWN', `키 확인에 실패했어요 (${res.status}). 잠시 후 다시 시도해주세요.`);
}
