import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet, Modal } from 'react-native';
import { Colors } from '@/constants/colors';
import { Radius } from '@/constants/styles';

interface LoadingOverlayProps {
  visible: boolean;
  message?: string;
}

export function LoadingOverlay({ visible, message = 'AI가 글을 작성하고 있습니다' }: LoadingOverlayProps) {
  return (
    <Modal transparent visible={visible} animationType="fade" statusBarTranslucent>
      <View style={styles.backdrop}>
        <View style={styles.box}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.message}>{message}</Text>
          <Text style={styles.sub}>잠시만 기다려 주세요</Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: Colors.overlay,
    alignItems: 'center',
    justifyContent: 'center',
  },
  box: {
    backgroundColor: Colors.bg,
    borderRadius: Radius.lg,
    paddingVertical: 36,
    paddingHorizontal: 40,
    alignItems: 'center',
    gap: 12,
    minWidth: 220,
  },
  message: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  sub: {
    fontSize: 14,
    color: Colors.textTertiary,
  },
});