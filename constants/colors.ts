/** 팔레트: 연보라 브랜드 컬러 하나 + 보라 기운 도는 뉴트럴 + 의미색(성공/경고/오류) */
export const Colors = {
  // Brand
  primary: '#7C5CFA',
  primaryPressed: '#6746E6',
  primaryLight: '#F0ECFF',

  // Surface — 화면은 흰색, 카드·입력창은 회색 채움(테두리 없음)
  bg: '#FFFFFF',
  fill: '#F4F3F8',
  fillStrong: '#E6E3F0',
  border: '#E6E3F0',
  overlay: 'rgba(0,0,0,0.5)',

  // Text
  textPrimary: '#1F1B2E',
  textSecondary: '#6C6880',
  textTertiary: '#908CA4',
  textDisabled: '#BAB7CA',
  textInverse: '#FFFFFF',

  // Semantic
  success: '#03B26C',
  successLight: '#E6F8F0',
  warning: '#F59E0B',
  warningLight: '#FFF5E0',
  error: '#F04452',
  errorLight: '#FFEBEE',

  star: '#FFB800',

  // 토스트/다크 요소
  toast: '#2E2A40',

  // Google 로그인 버튼 (브랜드 가이드라인 색)
  googleText: '#3C4043',
  googleBorder: '#DADCE0',
} as const;
