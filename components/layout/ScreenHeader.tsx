import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { Typo } from '@/constants/styles';
import { Touchable } from '@/components/ui/Touchable';

interface Props {
  title?: string;
  onBack?: () => void;
  /** 뒤로가기 대신 닫기(X) 아이콘 */
  closeIcon?: boolean;
  right?: React.ReactNode;
}

/** 화면 상단 공통 헤더: 테두리 없는 흰 배경, 뒤로가기 · 가운데 제목 · 오른쪽 액션 */
export function ScreenHeader({ title, onBack, closeIcon, right }: Props) {
  return (
    <View style={styles.header}>
      <View style={styles.side}>
        {onBack && (
          <Touchable onPress={onBack} hitSlop={12} accessibilityLabel={closeIcon ? '닫기' : '뒤로가기'}>
            <Ionicons name={closeIcon ? 'close' : 'chevron-back'} size={26} color={Colors.textPrimary} />
          </Touchable>
        )}
      </View>
      <Text style={styles.title} numberOfLines={1}>{title}</Text>
      <View style={[styles.side, styles.right]}>{right}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    backgroundColor: Colors.bg,
  },
  side: { width: 56, justifyContent: 'center' },
  right: { alignItems: 'flex-end' },
  title: { ...Typo.heading, flex: 1, textAlign: 'center' },
});
