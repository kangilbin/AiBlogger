import type { Theme } from '@/types';

/** 테마 이름 정리: '/'는 상위/하위 구분자라 제거하고 공백을 정돈 */
export function cleanThemeName(s: string): string {
  return s.replace(/\//g, ' ').replace(/\s+/g, ' ').trim();
}

/** Blogger 라벨 문자열. 하위가 있으면 '상위/하위' */
export function themeLabel(parent: string, sub?: string): string {
  return sub ? `${parent}/${sub}` : parent;
}

/** 등록된 모든 테마의 라벨(상위, 상위/하위) */
export function allThemeLabels(themes: Theme[]): string[] {
  return themes.flatMap((t) => [themeLabel(t.name), ...t.subs.map((s) => themeLabel(t.name, s.name))]);
}

/** 같은 이름이 이미 있는지(대소문자 무시) */
export function hasName(names: string[], name: string, exceptIndex = -1): boolean {
  const n = name.toLowerCase();
  return names.some((x, i) => i !== exceptIndex && x.toLowerCase() === n);
}

/** labels에서 기존 테마 라벨을 걷어내고 선택한 테마 라벨을 맨 앞에 둠. next가 null이면 테마만 제거 */
export function applyThemeLabel(labels: string[], next: string | null, known: string[]): string[] {
  const set = new Set(known);
  const rest = labels.filter((l) => !set.has(l));
  return next ? [next, ...rest] : rest;
}
