import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { Touchable } from '@/components/ui/Touchable';

interface Props {
  title: string;
  onBack?: () => void;
  backIcon?: 'arrow-back';
  right?: React.ReactNode;
}

/** 화면 상단 공통 헤더 (뒤로가기 · 제목 · 오른쪽 액션) */
export function ScreenHeader({ title, onBack, backIcon = 'arrow-back', right }: Props) {
  return (
    <View style={styles.header}>
      <View style={styles.side}>
        {onBack && (
          <Touchable onPress={onBack} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name={backIcon} size={22} color={Colors.textPrimary} />
          </Touchable>
        )}
      </View>
      <Text style={styles.title}>{title}</Text>
      <View style={[styles.side, styles.right]}>{right}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  side: { width: 48 },
  right: { alignItems: 'flex-end' },
  title: { flex: 1, fontSize: 17, fontWeight: '600', color: Colors.textPrimary, textAlign: 'center' },
});
