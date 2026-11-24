import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { Typo } from '@/constants/styles';
import { Touchable } from '@/components/ui/Touchable';

interface Props {
  title: string;
  subtitle?: React.ReactNode;
  /** 왼쪽 요소 (아이콘, 썸네일) */
  left?: React.ReactNode;
  /** 오른쪽 값/요소 */
  right?: React.ReactNode;
  onPress?: () => void;
  onLongPress?: () => void;
  /** 오른쪽 > 화살표 (기본: onPress가 있으면 표시) */
  chevron?: boolean;
  danger?: boolean;
  titleLines?: number;
}

/** 토스식 리스트 한 줄: [left] 제목/부제목 ........ [right] > */
export function ListRow({ title, subtitle, left, right, onPress, onLongPress, chevron, danger, titleLines = 1 }: Props) {
  const showChevron = chevron ?? !!onPress;
  return (
    <Touchable style={styles.row} onPress={onPress} onLongPress={onLongPress} disabled={!onPress && !onLongPress} pressScale={1} activeOpacity={0.5}>
      {left}
      <View style={styles.body}>
        <Text style={[styles.title, danger && styles.danger]} numberOfLines={titleLines}>{title}</Text>
        {typeof subtitle === 'string' ? <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text> : subtitle}
      </View>
      {typeof right === 'string' ? <Text style={styles.value} numberOfLines={1}>{right}</Text> : right}
      {showChevron && <Ionicons name="chevron-forward" size={18} color={Colors.textDisabled} />}
    </Touchable>
  );
}

/** 리스트 아이콘 (회색 채움 원형 배경) */
export function RowIcon({ name, danger }: { name: React.ComponentProps<typeof Ionicons>['name']; danger?: boolean }) {
  return (
    <View style={[styles.icon, danger && styles.iconDanger]}>
      <Ionicons name={name} size={20} color={danger ? Colors.error : Colors.textSecondary} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14, minHeight: 64 },
  body: { flex: 1, gap: 2 },
  title: { ...Typo.body, fontSize: 16, fontWeight: '600' },
  subtitle: Typo.caption,
  danger: { color: Colors.error },
  value: { ...Typo.body, color: Colors.textTertiary, maxWidth: 140 },
  icon: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.fill, alignItems: 'center', justifyContent: 'center' },
  iconDanger: { backgroundColor: Colors.errorLight },
});
