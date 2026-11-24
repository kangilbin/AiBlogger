const KEY = 'AIza' + 'x'.repeat(35);

const res = (status: number, body: unknown) => {
  const r = { ok: status >= 200 && status < 300, status, json: async () => body, clone: () => r };
  return r;
};

const modelList = res(200, {
  models: [
    { name: 'models/gemini-3.8-flash', supportedGenerationMethods: ['generateContent'] },
    { name: 'models/gemini-3.5-flash-lite', supportedGenerationMethods: ['generateContent'] },
  ],
});

const okBody = (text: string) =>
  res(200, { candidates: [{ content: { parts: [{ text }] } }] });

const input = {
  photos: [{ uri: 'a', note: '' }, { uri: 'b', note: '' }],
  placeName: '카페',
  rating: 3,
  summary: '',
  notes: '',
  extraPrompt: '',
  preset: { id: 'x', name: 'x', description: '', builtin: false, prompt: 'p' },
};

// 모델별 응답을 지정: { 'gemini-3.8-flash': [응답...] }
function mockFetch(byModel: Record<string, ReturnType<typeof res>[]>) {
  const calls: string[] = [];
  (global as unknown as { fetch: jest.Mock }).fetch = jest.fn(async (url: string) => {
    if (url.includes('/models?pageSize')) return modelList;
    const model = /models\/([^:]+):generateContent/.exec(url)![1];
    calls.push(model);
    const queue = byModel[model] ?? [res(404, {})];
    return queue.length > 1 ? queue.shift()! : queue[0];
  });
  return calls;
}

function load() {
  jest.resetModules();
  jest.doMock('@/services/session', () => ({
    geminiKeyStorage: { get: async () => KEY },
  }));
  jest.doMock('@/services/imageUtils', () => ({
    prepareImage: async () => ({ uri: 'u', base64: 'b64' }),
  }));
  return require('@/services/geminiService') as typeof import('@/services/geminiService');
}

const goodPost = JSON.stringify({ title: '제목', body: '본문\n\n[[사진1]]', labels: ['#a', 'b'] });

describe('generatePost 모델 순차 시도', () => {
  it('첫 모델이 한도(429)면 다음 모델로 넘어가 결과를 반환한다', async () => {
    const calls = mockFetch({
      'gemini-3.8-flash': [res(429, {})],
      'gemini-3.5-flash-lite': [okBody(goodPost)],
    });
    const { generatePost } = load();
    const post = await generatePost(input);
    expect(calls).toEqual(['gemini-3.8-flash', 'gemini-3.5-flash-lite']);
    expect(post.title).toBe('제목');
    expect(post.labels).toEqual(['a', 'b']); // # 제거
    expect(post.body).toContain('[[사진2]]'); // 빠진 사진 보정
  });

  it('키 오류(403)는 다른 모델을 시도하지 않고 바로 실패한다', async () => {
    const calls = mockFetch({ 'gemini-3.8-flash': [res(403, { error: { message: 'denied' } })] });
    const { generatePost } = load();
    await expect(generatePost(input)).rejects.toMatchObject({ code: 'GEMINI_KEY_INVALID' });
    expect(calls).toEqual(['gemini-3.8-flash']);
  });

  it('모든 모델이 한도면 GEMINI_QUOTA', async () => {
    mockFetch({
      'gemini-3.8-flash': [res(429, {})],
      'gemini-3.5-flash-lite': [res(429, {})],
    });
    const { generatePost } = load();
    await expect(generatePost(input)).rejects.toMatchObject({ code: 'GEMINI_QUOTA' });
  });

  it('모든 모델이 400이면 실제 거부 사유를 메시지에 포함한다', async () => {
    mockFetch({
      'gemini-3.8-flash': [res(400, { error: { message: 'Image input is not supported' } })],
      'gemini-3.5-flash-lite': [res(400, { error: { message: 'Image input is not supported' } })],
    });
    const { generatePost } = load();
    await expect(generatePost(input)).rejects.toThrow(/Image input is not supported/);
  });

  it('thinking 설정을 거부하면 설정 없이 재시도한다', async () => {
    const bodies: string[] = [];
    (global as unknown as { fetch: jest.Mock }).fetch = jest.fn(async (url: string, init?: { body?: string }) => {
      if (url.includes('/models?pageSize')) return modelList;
      bodies.push(init?.body ?? '');
      return bodies.length === 1
        ? res(400, { error: { message: 'thinking_budget is not supported' } })
        : okBody(goodPost);
    });
    const { generatePost } = load();
    await generatePost(input);
    expect(bodies[0]).toContain('thinkingConfig');
    expect(bodies[1]).not.toContain('thinkingConfig');
  });
});

describe('키 입력 정리/검사', () => {
  const { cleanGeminiKey, looksLikeGeminiKey } = require('@/services/geminiService');
  it('공백·줄바꿈·보이지 않는 문자·따옴표를 제거한다', () => {
    expect(cleanGeminiKey('  "AIzaSyABCDEFGHIJKLMNOPQRSTUVWXYZ012345"\n')).toBe('AIzaSyABCDEFGHIJKLMNOPQRSTUVWXYZ012345');
    expect(cleanGeminiKey('AIza​Sy ABC')).toBe('AIzaSyABC');
  });
  it('형식은 느슨하게 허용하고 너무 짧거나 이상한 값만 거른다', () => {
    expect(looksLikeGeminiKey('AIzaSyABCDEFGHIJKLMNOPQRSTUVWXYZ012345')).toBe(true);
    expect(looksLikeGeminiKey('AQ.Ab8RN6KabcdefghijklmnopqrstUVWXYZ')).toBe(true); // 다른 형식도 통과
    expect(looksLikeGeminiKey('short')).toBe(false);
    expect(looksLikeGeminiKey('한글이 섞인 키 입니다 입니다 입니다')).toBe(false);
  });
});
