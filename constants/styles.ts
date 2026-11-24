import { StyleSheet, TextStyle } from 'react-native';
import { Colors } from './colors';

/** 모서리: 이 세 가지(+pill)만 쓴다 */
export const Radius = {
  sm: 12, // 입력창, 작은 버튼, 썸네일
  md: 16, // 카드, 큰 버튼
  lg: 24, // 바텀시트, 모달
  pill: 999,
} as const;

/** 간격: 4px 단위 */
export const Space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, xxxl: 32 } as const;

/** 화면 좌우 여백 */
export const SCREEN_PADDING = 20;

/** 타이포: 6단계. 굵기는 700(제목) / 600(강조) / 400~500(본문) */
export const Typo = {
  display: { fontSize: 26, fontWeight: '700', lineHeight: 36, letterSpacing: -0.6, color: Colors.textPrimary },
  title: { fontSize: 20, fontWeight: '700', lineHeight: 28, letterSpacing: -0.4, color: Colors.textPrimary },
  heading: { fontSize: 17, fontWeight: '700', lineHeight: 24, letterSpacing: -0.2, color: Colors.textPrimary },
  body: { fontSize: 15, fontWeight: '400', lineHeight: 22, color: Colors.textPrimary },
  caption: { fontSize: 13, fontWeight: '400', lineHeight: 18, color: Colors.textSecondary },
  micro: { fontSize: 11, fontWeight: '600', lineHeight: 14, color: Colors.textSecondary },
} satisfies Record<string, TextStyle>;

export const CommonStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  screenContent: { paddingHorizontal: SCREEN_PADDING, paddingTop: Space.sm, paddingBottom: Space.xxxl },
});
