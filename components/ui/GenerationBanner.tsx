import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useSegments } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { usePostStore } from '@/stores/postStore';
import { Colors } from '@/constants/colors';
import { Touchable } from '@/components/ui/Touchable';

/** 어느 화면에서든 상단에 뜨는 글 작성 진행/완료 표시 */
export function GenerationBanner() {
  const router = useRouter();
  const segments = useSegments();
  const insets = useSafeAreaInsets();
  const status = usePostStore((s) => s.genStatus);
  const place = usePostStore((s) => s.genPlace);
  const error = usePostStore((s) => s.genError);
  const dismiss = usePostStore((s) => s.dismissGeneration);

  const last = segments[segments.length - 1] as string | undefined;
  if (status === 'idle' || last === 'preview' || segments[0] === '(auth)') return null;

  const onPress = () => {
    if (status === 'running') return;
    dismiss();
    if (status === 'done') router.push('/(main)/preview');
  };

  const tone =
    status === 'running' ? Colors.primary : status === 'done' ? Colors.success : Colors.error;
  const label =
    status === 'running'
      ? `'${place}' 글 작성 중…`
      : status === 'done'
      ? `'${place}' 작성 완료 · 눌러서 확인`
      : `작성 실패 · ${error ?? '다시 시도해주세요'}`;

  return (
    <View pointerEvents="box-none" style={[styles.wrap, { top: insets.top + 6 }]}>
      <Touchable style={[styles.pill, { backgroundColor: tone }]} onPress={onPress} activeOpacity={0.85}>
        {status === 'running' ? (
          <ActivityIndicator size="small" color={Colors.white} />
        ) : (
          <Ionicons name={status === 'done' ? 'checkmark-circle' : 'alert-circle'} size={18} color={Colors.white} />
        )}
        <Text style={styles.text} numberOfLines={1}>{label}</Text>
        {status === 'error' && <Ionicons name="close" size={16} color={Colors.white} />}
      </Touchable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 16, right: 16, zIndex: 100, alignItems: 'center' },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 20,
    maxWidth: '100%',
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 6,
  },
  text: { color: Colors.white, fontSize: 13, fontWeight: '600', flexShrink: 1 },
});
