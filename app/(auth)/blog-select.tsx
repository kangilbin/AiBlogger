import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Linking, AppState } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { listBlogs } from '@/services/bloggerService';
import { errorMessage } from '@/services/errors';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/Button';
import { Colors } from '@/constants/colors';
import { Radius, Typo } from '@/constants/styles';
import { ListRow } from '@/components/ui/ListRow';
import { BottomBar } from '@/components/ui/BottomBar';
import type { BlogInfo } from '@/types';
import { ScreenHeader } from '@/components/layout/ScreenHeader';

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
      {blog && router.canGoBack() ? (
        <ScreenHeader onBack={() => router.back()} />
      ) : (
        <View style={{ height: 56 }} />
      )}
      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <Text style={Typo.display}>글을 올릴 블로그를{'\n'}선택해주세요</Text>
        {loading ? (
          <ActivityIndicator color={Colors.primary} style={{ marginTop: 48 }} />
        ) : error ? (
          <View style={styles.box}>
            <Text style={styles.err}>{error}</Text>
            <Button label="다시 시도" variant="secondary" onPress={() => load()} fullWidth />
          </View>
        ) : blogs.length === 0 ? (
          <View style={styles.box}>
            <Text style={Typo.heading}>아직 Blogger 블로그가 없어요</Text>
            <Text style={styles.desc}>
              블로그는 Blogger에서만 만들 수 있어요. 1분이면 끝나요.
            </Text>
            <View style={styles.steps}>
              <Text style={styles.step}>1. 아래 버튼으로 Blogger를 열고 같은 구글 계정으로 로그인</Text>
              <Text style={styles.step}>2. "블로그 만들기"에서 제목과 주소(영문)를 정하고 완료</Text>
              <Text style={styles.step}>3. 이 앱으로 돌아오면 자동으로 불러와요</Text>
            </View>
            <Button label="새로고침" variant="secondary" onPress={() => load()} fullWidth />
          </View>
        ) : (
          <View style={{ marginTop: 20 }}>
            {blogs.map((b) => (
              <ListRow
                key={b.id}
                title={b.name}
                subtitle={b.url.replace(/^https?:\/\//, '')}
                right={blog?.id === b.id ? <Ionicons name="checkmark-circle" size={24} color={Colors.primary} /> : undefined}
                chevron={false}
                onPress={() => pick(b)}
              />
            ))}
            <Text style={styles.hint}>새 블로그를 만든 뒤 앱으로 돌아오면 목록에 자동으로 나타나요.</Text>
          </View>
        )}
      </ScrollView>
      <BottomBar>
        <Button
          label={blogs.length === 0 && !loading && !error ? 'Blogger에서 블로그 만들기' : 'Blogger에서 새 블로그 만들기'}
          variant={blogs.length === 0 && !loading && !error ? 'primary' : 'secondary'}
          onPress={() => Linking.openURL('https://www.blogger.com')}
          fullWidth
        />
        <Button label="다른 계정으로 로그인" variant="ghost" onPress={logout} fullWidth />
      </BottomBar>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  body: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 24 },
  box: { gap: 14, marginTop: 28 },
  steps: { gap: 8, backgroundColor: Colors.fill, borderRadius: Radius.md, padding: 16 },
  step: { ...Typo.body, lineHeight: 22 },
  hint: { ...Typo.caption, color: Colors.textTertiary, marginTop: 12 },
  desc: { ...Typo.body, color: Colors.textSecondary },
  err: { ...Typo.body, color: Colors.error },
});
