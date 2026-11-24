import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Linking, AppState } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { listBlogs } from '@/services/bloggerService';
import { errorMessage } from '@/services/errors';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/Button';
import { Colors } from '@/constants/colors';
import type { BlogInfo } from '@/types';
import { Touchable } from '@/components/ui/Touchable';

export default function BlogSelectScreen() {
  const router = useRouter();
  const { blog, selectBlog, logout } = useAuthStore();
  const [blogs, setBlogs] = useState<BlogInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      setBlogs(await listBlogs());
    } catch (e) {
      setError(errorMessage(e, '블로그 목록을 불러오지 못했어요.'));
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  // Blogger에서 블로그를 만들고 앱으로 돌아오면 자동으로 목록을 다시 불러옴
  useEffect(() => {
    const sub = AppState.addEventListener('change', (st) => { if (st === 'active') load(true); });
    return () => sub.remove();
  }, []);

  const pick = async (b: BlogInfo) => {
    await selectBlog(b);
    // 설정에서 들어왔으면 돌아가고, 최초 선택이면 홈으로 (돌아갈 화면이 없음)
    if (router.canGoBack()) router.back();
    else router.replace('/(main)');
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* 설정에서 들어온 경우(돌아갈 화면이 있고 이미 블로그가 선택됨)에만 닫기 버튼 표시 */}
      {blog && router.canGoBack() && (
        <Touchable style={styles.back} onPress={() => router.back()} accessibilityLabel="닫기">
          <Ionicons name="chevron-back" size={26} color={Colors.textPrimary} />
        </Touchable>
      )}
      <View style={styles.body}>
        <Text style={styles.title}>글을 올릴 블로그를{'\n'}선택해주세요</Text>
        {loading ? (
          <ActivityIndicator color={Colors.primary} style={{ marginTop: 40 }} />
        ) : error ? (
          <View style={styles.box}>
            <Text style={styles.err}>{error}</Text>
            <Button label="다시 시도" variant="secondary" onPress={() => load()} fullWidth />
          </View>
        ) : blogs.length === 0 ? (
          <View style={styles.box}>
            <Text style={styles.emptyTitle}>아직 Blogger 블로그가 없어요</Text>
            <Text style={styles.desc}>
              블로그는 Blogger에서만 만들 수 있어요(앱에서는 만들 수 없어요). 1분이면 끝나요.
            </Text>
            <View style={styles.steps}>
              <Text style={styles.step}>1. 아래 버튼으로 Blogger를 열고 같은 구글 계정으로 로그인</Text>
              <Text style={styles.step}>2. "블로그 만들기"에서 제목과 주소(영문)를 정하고 완료</Text>
              <Text style={styles.step}>3. 이 앱으로 돌아오면 자동으로 불러와요</Text>
            </View>
            <Button label="Blogger에서 블로그 만들기" onPress={() => Linking.openURL('https://www.blogger.com')} fullWidth />
            <Button label="새로고침" variant="secondary" onPress={() => load()} fullWidth />
          </View>
        ) : (
          <View style={{ gap: 10, marginTop: 24 }}>
            {blogs.map((b) => (
              <Touchable key={b.id} style={[styles.item, blog?.id === b.id && styles.itemOn]} onPress={() => pick(b)} activeOpacity={0.7}>
                <Text style={styles.name}>{b.name}</Text>
                <Text style={styles.url} numberOfLines={1}>{b.url}</Text>
              </Touchable>
            ))}
            <Button
              label="+ Blogger에서 새 블로그 만들기"
              variant="secondary"
              onPress={() => Linking.openURL('https://www.blogger.com')}
              fullWidth
              style={{ marginTop: 6 }}
            />
            <Text style={styles.hint}>만든 뒤 앱으로 돌아오면 목록에 자동으로 나타나요.</Text>
          </View>
        )}
      </View>
      <View style={styles.footer}>
        <Button label="다른 계정으로 로그인" variant="ghost" onPress={logout} fullWidth />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  back: { paddingHorizontal: 16, paddingTop: 8, alignSelf: 'flex-start' },
  body: { flex: 1, padding: 24 },
  title: { fontSize: 24, fontWeight: '700', color: Colors.textPrimary, lineHeight: 34, marginTop: 24 },
  box: { gap: 12, marginTop: 32 },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: Colors.textPrimary },
  steps: { gap: 8, backgroundColor: Colors.background, borderRadius: 12, padding: 14 },
  step: { fontSize: 14, color: Colors.textPrimary, lineHeight: 21 },
  hint: { fontSize: 12, color: Colors.textDisabled, textAlign: 'center' },
  desc: { fontSize: 15, color: Colors.textSecondary, lineHeight: 24 },
  err: { fontSize: 14, color: Colors.error },
  item: { padding: 16, borderRadius: 14, borderWidth: 1.5, borderColor: Colors.border, gap: 4 },
  itemOn: { borderColor: Colors.primary, backgroundColor: Colors.primaryLight },
  name: { fontSize: 16, fontWeight: '600', color: Colors.textPrimary },
  url: { fontSize: 13, color: Colors.textSecondary },
  footer: { padding: 24 },
});
