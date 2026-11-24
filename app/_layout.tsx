import { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Colors } from '@/constants/colors';
import { Stack, useRouter, useSegments, useRootNavigationState } from 'expo-router';
import { useShallow } from 'zustand/react/shallow';
import { onNotificationTap } from '@/services/notificationService';
import { GenerationBanner } from '@/components/ui/GenerationBanner';
import { usePostStore } from '@/stores/postStore';
import { useAuthStore } from '@/stores/authStore';

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();
  const navReady = !!useRootNavigationState()?.key;
  const { isLoggedIn, blog, isInitialized, init } = useAuthStore(
    useShallow((s) => ({ isLoggedIn: s.isLoggedIn, blog: s.blog, isInitialized: s.isInitialized, init: s.init }))
  );

  useEffect(() => {
    init();
  }, []);

  // 완료 알림을 누르면 미리보기로 이동
  useEffect(() => {
    return onNotificationTap(() => {
      const { genStatus, dismissGeneration } = usePostStore.getState();
      if (genStatus === 'done') {
        dismissGeneration();
        router.push('/(main)/preview');
      }
    });
  }, []);

  // 로그인 상태에 맞는 이동 경로. 이미 알맞은 화면이면 null
  const redirect = (() => {
    if (!isInitialized) return null;
    const inAuth = segments[0] === '(auth)';
    if (!isLoggedIn) return !inAuth || segments[1] !== 'login' ? '/(auth)/login' : null;
    if (!blog) return segments[1] !== 'blog-select' ? '/(auth)/blog-select' : null;
    return inAuth && segments[1] !== 'blog-select' ? '/(main)' : null;
  })();

  useEffect(() => {
    // 네비게이터가 마운트되기 전에 이동하면 오류가 나므로 준비될 때까지 대기
    if (redirect && navReady) router.replace(redirect as never);
  }, [redirect, navReady]);

  // 초기화 중이거나 올바른 화면으로 이동하는 중에는 잘못된 화면(글쓰기 등)이 잠깐 보이지 않도록 가린다
  const showSplash = !isInitialized || !!redirect;

  return (
    <View style={{ flex: 1 }}>
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(main)" />
      <Stack.Screen name="settings" />
      <Stack.Screen name="prompts" />
      <Stack.Screen name="gemini-guide" />
    </Stack>
    <GenerationBanner />
    {showSplash && (
      <View style={styles.splash}>
        <ActivityIndicator color={Colors.primary} />
      </View>
    )}
    </View>
  );
}

const styles = StyleSheet.create({
  splash: { ...StyleSheet.absoluteFillObject, backgroundColor: Colors.white, alignItems: 'center', justifyContent: 'center' },
});
