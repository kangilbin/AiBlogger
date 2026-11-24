import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, Image, Pressable, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { signInWithGoogle } from '@/services/authService';
import { IS_MOCK } from '@/constants/config';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/Button';
import { Colors } from '@/constants/colors';
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
          <View style={styles.logoBox}>
            <Ionicons name="pencil" size={36} color={Colors.primary} />
          </View>
          <Text style={styles.appName}>AI Bloger</Text>
          <Text style={styles.tagline}>
            사진 찍고,{'\n'}블로그 글은 AI에게
          </Text>
        </View>

        <View style={styles.actions}>
          <Pressable
            onPress={handleGoogleLogin}
            disabled={IS_MOCK || loading}
            style={({ pressed }) => [
              styles.googleBtn,
              IS_MOCK && { opacity: 0.5 },
              pressed && { backgroundColor: '#F1F3F4', transform: [{ scale: 0.97 }] },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Google 계정으로 로그인"
          >
            {loading ? (
              <ActivityIndicator color="#3C4043" />
            ) : (
              <>
                <Image source={require('@/assets/google-g.png')} style={styles.googleIcon} />
                <Text style={styles.googleText}>Google 계정으로 로그인</Text>
              </>
            )}
          </Pressable>
          {IS_MOCK && (
            <Button
              label="개발 모드 로그인"
              variant="secondary"
              onPress={handleMockLogin}
              fullWidth
            />
          )}
          <Text style={styles.legal}>
            Blogger 글 발행과 사진 저장(Google Drive) 권한을 요청합니다.{'\n'}앱이 만든 파일 외에는 접근하지 않아요.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
    paddingBottom: 40,
  },
  hero: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  logoBox: {
    width: 76,
    height: 76,
    borderRadius: 22,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appName: {
    fontSize: 26,
    fontWeight: '700',
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 17,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 26,
  },
  actions: { gap: 10 },
  googleBtn: {
    height: 52,
    borderRadius: 26,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DADCE0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  googleIcon: { width: 22, height: 22 },
  googleText: { fontSize: 16, fontWeight: '600', color: '#3C4043' },
  legal: {
    fontSize: 12,
    color: Colors.textDisabled,
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 4,
  },
});