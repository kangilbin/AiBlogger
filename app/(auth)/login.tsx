import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, Image, Pressable, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { signInWithGoogle } from '@/services/authService';
import { IS_MOCK } from '@/constants/config';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/Button';
import { Colors } from '@/constants/colors';
import { Radius, Typo } from '@/constants/styles';
import { MOCK_USER } from '@/services/mock/data';

export default function LoginScreen() {
  const login = useAuthStore((s) => s.login);
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const result = await signInWithGoogle();
      if (result) await login(result.user, result.accessToken, 3600);
    } catch (e: unknown) {
      Alert.alert('로그인 오류', e instanceof Error ? e.message : '로그인 처리 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleMockLogin = () => login(MOCK_USER, 'mock_token', 3600);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.hero}>
          <Text style={styles.brand}>AI Bloger</Text>
          <Text style={Typo.display}>사진만 올리면{'\n'}블로그 글이 완성돼요</Text>
          <Text style={styles.sub}>방문한 곳의 사진과 별점만 남기세요.{'\n'}글쓰기는 AI가 대신합니다.</Text>
        </View>

        <View style={styles.actions}>
          <Pressable
            onPress={handleGoogleLogin}
            disabled={IS_MOCK || loading}
            style={({ pressed }) => [
              styles.googleBtn,
              IS_MOCK && { opacity: 0.5 },
              pressed && { opacity: 0.7, transform: [{ scale: 0.98 }] },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Google 계정으로 로그인"
          >
            {loading ? (
              <ActivityIndicator color={Colors.googleText} />
            ) : (
              <>
                <Image source={require('@/assets/google-g.png')} style={styles.googleIcon} />
                <Text style={styles.googleText}>Google 계정으로 시작하기</Text>
              </>
            )}
          </Pressable>
          {IS_MOCK && (
            <Button label="개발 모드 로그인" variant="secondary" onPress={handleMockLogin} fullWidth />
          )}
          <Text style={styles.legal}>
            Blogger 글 발행과 사진 저장(Google Drive) 권한을 요청해요.{'\n'}앱이 만든 파일 외에는 접근하지 않아요.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  content: { flex: 1, paddingHorizontal: 20, paddingBottom: 12 },
  hero: { flex: 1, justifyContent: 'center', gap: 12, paddingBottom: 40 },
  brand: { ...Typo.heading, color: Colors.primary },
  sub: { ...Typo.body, fontSize: 16, color: Colors.textSecondary, marginTop: 4 },
  actions: { gap: 10 },
  googleBtn: {
    height: 56,
    borderRadius: Radius.md,
    backgroundColor: Colors.bg,
    borderWidth: 1,
    borderColor: Colors.googleBorder,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  googleIcon: { width: 22, height: 22 },
  googleText: { fontSize: 17, fontWeight: '600', color: Colors.googleText },
  legal: { ...Typo.caption, color: Colors.textTertiary, textAlign: 'center', marginTop: 6 },
});
