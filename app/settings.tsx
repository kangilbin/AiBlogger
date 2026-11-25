import React from 'react';
import { View, Text, ScrollView, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/stores/authStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { Colors } from '@/constants/colors';
import { Typo, SCREEN_PADDING } from '@/constants/styles';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { ListRow, RowIcon } from '@/components/ui/ListRow';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

export default function SettingsScreen() {
  const router = useRouter();
  const { user, blog, hasGeminiKey, logout } = useAuthStore();
  const deleteGeminiKey = useSettingsStore((s) => s.deleteGeminiKey);

  const handleKeyPress = () => {
    if (!hasGeminiKey) {
      router.push('/gemini-guide');
      return;
    }
    Alert.alert('Gemini API 키', '등록된 키를 어떻게 할까요?', [
      { text: '취소', style: 'cancel' },
      { text: '새 키로 교체', onPress: () => router.push('/gemini-guide') },
      { text: '삭제', style: 'destructive', onPress: () => { deleteGeminiKey(); } },
    ]);
  };

  const handleLogout = () => {
    Alert.alert('로그아웃', '정말 로그아웃 하시겠어요?', [
      { text: '취소', style: 'cancel' },
      { text: '로그아웃', style: 'destructive', onPress: () => logout() },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader title="설정" onBack={() => router.back()} />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.profile}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={26} color={Colors.textInverse} />
          </View>
          <View style={{ gap: 2 }}>
            <Text style={Typo.title}>{user?.name}</Text>
            <Text style={Typo.caption}>{user?.email}</Text>
          </View>
        </View>

        <Section title="AI">
          <ListRow
            left={<RowIcon name="key-outline" />}
            title="Gemini API 키"
            right={hasGeminiKey ? '등록됨' : '등록하기'}
            onPress={handleKeyPress}
          />
          <ListRow
            left={<RowIcon name="color-wand-outline" />}
            title="글쓰기 스타일"
            onPress={() => router.push('/prompts')}
          />
        </Section>

        <Section title="블로그">
          <ListRow
            left={<RowIcon name="folder-open-outline" />}
            title="테마(카테고리) 관리"
            onPress={() => router.push('/themes')}
          />
          <ListRow
            left={<RowIcon name="logo-google" />}
            title="Blogger"
            right={blog?.name ?? '미선택'}
            onPress={() => router.push('/(auth)/blog-select')}
          />
        </Section>

        <Section title="계정">
          <ListRow left={<RowIcon name="log-out-outline" danger />} title="로그아웃" danger chevron={false} onPress={handleLogout} />
        </Section>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  content: { paddingHorizontal: SCREEN_PADDING, paddingBottom: 40 },
  profile: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingVertical: 20 },
  avatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  section: { marginTop: 16 },
  sectionTitle: { ...Typo.caption, fontSize: 14, fontWeight: '600', color: Colors.textTertiary, paddingVertical: 8 },
});
