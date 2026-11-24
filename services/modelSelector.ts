export interface ApiModel {
  name: string; // "models/gemini-3.8-flash"
  displayName?: string; // "Gemini 3.8 Flash"
  supportedGenerationMethods?: string[];
}

/** 좋은 모델 → 한도 넉넉한 모델 순. 표시 이름 기준 (정확한 API ID는 ListModels로 찾음) */
export const MODEL_PREFERENCE = [
  'Gemini 3.8 Flash',
  'Gemini 3.6 Flash',
  'Gemini 3.5 Flash Lite',
  'Gemini 3.1 Flash Lite',
  // 최후 보루: 이전 세대 (모델별로 한도가 따로 계산되므로 하루 사용량이 늘어남)
  'Gemini 3 Flash',
  'Gemini 2.5 Flash',
  'Gemini 2.5 Flash Lite',
];

const norm = (s: string) => s.toLowerCase().replace(/^models\//, '').replace(/[-_]+/g, ' ').trim();

/** 선호 순서대로, generateContent를 지원하는 실제 모델 ID(models/ 제외) 목록 */
export function pickModels(available: ApiModel[], preference = MODEL_PREFERENCE): string[] {
  const usable = available.filter((m) => m.supportedGenerationMethods?.includes('generateContent'));
  const picked: string[] = [];
  for (const pref of preference) {
    const target = norm(pref);
    // ID 정확 일치 > 표시 이름 일치 (preview/latest 같은 변형은 제외)
    const hit =
      usable.find((m) => norm(m.name) === target) ??
      usable.find((m) => m.displayName && norm(m.displayName) === target);
    if (hit) picked.push(hit.name.replace(/^models\//, ''));
  }
  return picked;
}
