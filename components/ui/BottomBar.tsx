import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Colors } from '@/constants/colors';

/** 화면 하단에 고정되는 CTA 영역 (SafeAreaView 안쪽 맨 아래에 둔다) */
export function BottomBar({ children, row }: { children: React.ReactNode; row?: boolean }) {
  return <View style={[styles.bar, row && styles.row]}>{children}</View>;
}

const styles = StyleSheet.create({
  bar: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 12, backgroundColor: Colors.bg, gap: 8 },
  row: { flexDirection: 'row', gap: 8 },
});
