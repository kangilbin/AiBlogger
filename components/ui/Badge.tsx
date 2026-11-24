import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '@/constants/colors';
import { Radius } from '@/constants/styles';

type Tone = 'success' | 'warning' | 'neutral' | 'primary';

const TONES: Record<Tone, { bg: string; fg: string }> = {
  success: { bg: Colors.successLight, fg: Colors.success },
  warning: { bg: Colors.warningLight, fg: Colors.warning },
  primary: { bg: Colors.primaryLight, fg: Colors.primary },
  neutral: { bg: Colors.fill, fg: Colors.textSecondary },
};

/** 연한 배경 + 진한 글자의 상태 뱃지 */
export function Badge({ label, tone = 'neutral' }: { label: string; tone?: Tone }) {
  const t = TONES[tone];
  return (
    <View style={[styles.badge, { backgroundColor: t.bg }]}>
      <Text style={[styles.text, { color: t.fg }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: Radius.pill, alignSelf: 'flex-start' },
  text: { fontSize: 12, fontWeight: '600' },
});
