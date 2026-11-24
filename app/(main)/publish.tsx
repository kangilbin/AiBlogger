import React, { useState } from 'react';
import {
  View, Text, StyleSheet, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { usePostStore } from '@/stores/postStore';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/Button';
import { LoadingOverlay } from '@/components/ui/LoadingOverlay';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { Colors } from '@/constants/colors';
import { useShallow } from 'zustand/react/shallow';
import { Touchable } from '@/components/ui/Touchable';

export default function PublishScreen() {
  const router = useRouter();
  const { publishProgress, publish, resetForm } = usePostStore(
    useShallow((s) => ({ publishProgress: s.publishProgress, publish: s.publish, resetForm: s.resetForm }))
  );
  const blog = useAuthStore((s) => s.blog);
  const [isDraft, setIsDraft] = useState(false);
  const [resultUrl, setResultUrl] = useState<string | null>(null);

  const handlePublish = async () => {
    const res = await publish(isDraft);
    if (res.ok) {
      setResultUrl(res.url);
    } else if (res.code === 'SESSION_EXPIRED') {
      Alert.alert('로그인 필요', res.error); // 루트 레이아웃이 로그인 화면으로 이동시킴 (작성 중인 글은 유지됨)
    } else if (res.code === 'BLOG_NOT_SELECTED') {
      Alert.alert('블로그 선택 필요', res.error, [
        { text: '선택하기', onPress: () => router.push('/(auth)/blog-select') },
      ]);
    } else {
      Alert.alert('발행 실패', res.error);
    }
  };

  if (resultUrl) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.successContainer}>
          <View style={styles.successIconBox}>
            <Ionicons name="checkmark" size={40} color={Colors.white} />
          </View>
          <Text style={styles.successTitle}>발행 완료!</Text>
          <Text style={styles.successDesc}>블로그에 글이 등록되었어요</Text>
          <View style={styles.successActions}>
            <Button
              label="링크 복사"
              variant="secondary"
              onPress={() => { Clipboard.setStringAsync(resultUrl); Alert.alert('복사됨', '클립보드에 복사되었습니다.'); }}
              fullWidth
            />
            <Button
              label="블로그에서 보기"
              onPress={() => router.push({
                pathname: '/(main)/browser',
                params: { url: resultUrl, title: '발행된 글' },
              })}
              fullWidth
            />
            <Button
              label="홈으로"
              variant="ghost"
              onPress={() => { resetForm(); router.replace('/(main)'); }}
              fullWidth
            />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader title="Blogger 발행" onBack={() => router.back()} />

      <View style={styles.content}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>발행 블로그</Text>
          <Text style={styles.blogName}>{blog?.name ?? '선택 안 됨'}</Text>
          <Text style={[styles.cardTitle, { marginTop: 12 }]}>발행 방식</Text>
          {[
            { label: '즉시 발행', desc: '바로 블로그에 공개됩니다', val: false },
            { label: '임시 저장', desc: 'Blogger 초안으로 저장돼요 (Blogger에서 확인 후 발행)', val: true },
          ].map(({ label, desc, val }) => (
            <Touchable
              key={String(val)}
              style={styles.radioRow}
              onPress={() => setIsDraft(val)}
              activeOpacity={0.7}
            >
              <View style={[styles.radio, isDraft === val && styles.radioActive]}>
                {isDraft === val && <View style={styles.radioDot} />}
              </View>
              <View style={styles.radioText}>
                <Text style={styles.radioLabel}>{label}</Text>
                <Text style={styles.radioDesc}>{desc}</Text>
              </View>
            </Touchable>
          ))}
        </View>

        <View style={{ flex: 1 }} />
        <Button label="발행하기" onPress={handlePublish} fullWidth />
      </View>

      <LoadingOverlay visible={!!publishProgress} message={publishProgress ?? ""} />

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: { fontSize: 17, fontWeight: '600', color: Colors.textPrimary },
  content: { flex: 1, padding: 20, gap: 16 },
  card: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    gap: 4,
  },
  cardTitle: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary, marginBottom: 8, letterSpacing: 0.3 },
  blogName: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary },
  radioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioActive: { borderColor: Colors.primary },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.primary },
  radioText: { gap: 2 },
  radioLabel: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary },
  radioDesc: { fontSize: 13, color: Colors.textSecondary },
  successContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 10,
  },
  successIconBox: {
    width: 80,
    height: 80,
    borderRadius: 28,
    backgroundColor: Colors.success,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  successTitle: { fontSize: 22, fontWeight: '700', color: Colors.textPrimary, letterSpacing: -0.3 },
  successDesc: { fontSize: 15, color: Colors.textSecondary },
  successActions: { width: '100%', marginTop: 28, gap: 10 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  modalBox: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 24,
    width: '100%',
    gap: 12,
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
  modalDesc: { fontSize: 14, color: Colors.textSecondary, lineHeight: 22, marginBottom: 4 },
});