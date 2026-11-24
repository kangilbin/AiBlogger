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
import { Radius, Typo, SCREEN_PADDING } from '@/constants/styles';
import { BottomBar } from '@/components/ui/BottomBar';
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
        <View style={styles.success}>
          <View style={styles.successIcon}>
            <Ionicons name="checkmark" size={44} color={Colors.textInverse} />
          </View>
          <Text style={Typo.display}>발행 완료!</Text>
          <Text style={styles.successDesc}>블로그에 글이 등록되었어요</Text>
        </View>
        <BottomBar>
          <Button
            label="블로그에서 보기"
            onPress={() => router.push({
              pathname: '/(main)/browser',
              params: { url: resultUrl, title: '발행된 글' },
            })}
            fullWidth
          />
          <Button
            label="링크 복사"
            variant="secondary"
            onPress={() => { Clipboard.setStringAsync(resultUrl); Alert.alert('복사됨', '클립보드에 복사되었어요.'); }}
            fullWidth
          />
          <Button
            label="홈으로"
            variant="ghost"
            onPress={() => { resetForm(); router.replace('/(main)'); }}
            fullWidth
          />
        </BottomBar>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader title="발행" onBack={() => router.back()} />

      <View style={styles.content}>
        <Text style={Typo.display}>어떻게{'\n'}발행할까요?</Text>

        <View style={styles.blogCard}>
          <Text style={styles.blogLabel}>발행할 블로그</Text>
          <Text style={styles.blogName}>{blog?.name ?? '선택 안 됨'}</Text>
        </View>

        <View style={{ gap: 10 }}>
          {[
            { label: '즉시 발행', desc: '바로 블로그에 공개돼요', val: false },
            { label: '임시 저장', desc: 'Blogger 초안으로 저장돼요. Blogger에서 확인 후 발행하세요', val: true },
          ].map(({ label, desc, val }) => {
            const on = isDraft === val;
            return (
              <Touchable
                key={String(val)}
                style={[styles.option, on && styles.optionOn]}
                onPress={() => setIsDraft(val)}
                pressScale={0.98}
              >
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={styles.optionLabel}>{label}</Text>
                  <Text style={styles.optionDesc}>{desc}</Text>
                </View>
                <View style={[styles.radio, on && styles.radioOn]}>
                  {on && <Ionicons name="checkmark" size={14} color={Colors.textInverse} />}
                </View>
              </Touchable>
            );
          })}
        </View>
      </View>

      <BottomBar>
        <Button label={isDraft ? '임시 저장하기' : '발행하기'} onPress={handlePublish} fullWidth />
      </BottomBar>

      <LoadingOverlay visible={!!publishProgress} message={publishProgress ?? ""} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  content: { flex: 1, paddingHorizontal: SCREEN_PADDING, paddingTop: 8, gap: 24 },
  blogCard: { backgroundColor: Colors.fill, borderRadius: Radius.md, padding: 16, gap: 4 },
  blogLabel: Typo.caption,
  blogName: { ...Typo.heading },
  option: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: Colors.fill, borderRadius: Radius.md, padding: 18, borderWidth: 1.5, borderColor: 'transparent' },
  optionOn: { backgroundColor: Colors.primaryLight, borderColor: Colors.primary },
  optionLabel: { ...Typo.heading },
  optionDesc: Typo.caption,
  radio: { width: 24, height: 24, borderRadius: 12, backgroundColor: Colors.fillStrong, alignItems: 'center', justifyContent: 'center' },
  radioOn: { backgroundColor: Colors.primary },
  success: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 12 },
  successIcon: { width: 88, height: 88, borderRadius: 44, backgroundColor: Colors.success, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  successDesc: { ...Typo.body, fontSize: 16, color: Colors.textSecondary },
});
