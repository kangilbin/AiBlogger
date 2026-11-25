import { cleanThemeName, themeLabel, allThemeLabels, applyThemeLabel, hasName } from '@/utils/theme';

const themes = [
  { id: 't1', name: '여행', subs: [{ id: 's1', name: '국내' }] },
  { id: 't2', name: '맛집', subs: [] },
];

describe('theme utils', () => {
  it('이름에서 / 를 제거하고 공백을 정리한다', () => {
    expect(cleanThemeName('  여행/ 국내  ')).toBe('여행 국내');
  });
  it('라벨 문자열을 만든다', () => {
    expect(themeLabel('여행')).toBe('여행');
    expect(themeLabel('여행', '국내')).toBe('여행/국내');
  });
  it('모든 테마 라벨을 모은다', () => {
    expect(allThemeLabels(themes)).toEqual(['여행', '여행/국내', '맛집']);
  });
  it('기존 테마 라벨을 교체하고 일반 라벨은 유지한다', () => {
    const known = allThemeLabels(themes);
    expect(applyThemeLabel(['여행', '제주'], '맛집', known)).toEqual(['맛집', '제주']);
    expect(applyThemeLabel(['여행/국내', '제주'], null, known)).toEqual(['제주']);
  });
  it('중복 이름을 찾는다', () => {
    expect(hasName(['여행', '맛집'], '여행')).toBe(true);
    expect(hasName(['여행', '맛집'], '여행', 0)).toBe(false);
  });
});
