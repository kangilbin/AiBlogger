import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet, Modal } from 'react-native';
import { Colors } from '@/constants/colors';

interface LoadingOverlayProps {
  visible: boolean;
  message?: string;
}

export function LoadingOverlay({ visible, message = 'AI가 글을 작성하고 있어요' }: LoadingOverlayProps) {
  return (
    <Modal transparent visible={visible} animationType="fade" statusBarTranslucent>
      <View style={styles.backdrop}>
        <View style={styles.box}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.message}>{message}</Text>
          <Text style={styles.sub}>잠시만 기다려주세요</Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  box: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    paddingVertical: 36,
    paddingHorizontal: 40,
    alignItems: 'center',
    gap: 12,
    minWidth: 220,
  },
  message: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  sub: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
});