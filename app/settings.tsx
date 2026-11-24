import React from 'react';
import {
  View, Text,
  ScrollView, StyleSheet, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/stores/authStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { Colors } from '@/constants/colors';
import { Touchable } from '@/components/ui/Touchable';

function SettingRow({
  icon, label, value, onPress, danger,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  value?: string;
  onPress?: () => void;
  danger?: boolean;
}) {
  return (
    <Touchable style={styles.row} onPress={onPress} activeOpacity={0.6} disabled={!onPress}>
      <View style={styles.rowLeft}>
        <View style={[styles.rowIcon, danger && styles.rowIconDanger]}>
          <Ionicons name={icon} size={18} color={danger ? Colors.error : Colors.primary} />
        </View>
        <Text style={[styles.rowLabel, danger && styles.rowLabelDanger]}>{label}</Text>
      </View>
      <View style={styles.rowRight}>
        {value ? <Text style={styles.rowValue} numberOfLines={1}>{value}</Text> : null}
        {onPress && <Ionicons name="chevron-forward" size={16} color={Colors.textDisabled} />}
      </View>
    </Touchable>
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

  const handleChangeBlog = () => {
    router.push('/(auth)/blog-select');
  };

  const handleLogout = () => {
    Alert.alert('로그아웃', '정말 로그아웃 하시겠어요?', [
      { text: '취소', style: 'cancel' },
      { text: '로그아웃', style: 'destructive', onPress: () => logout() },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Touchable
          onPress={() => router.back()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </Touchable>
        <Text style={styles.title}>설정</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* 프로필 */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={28} color={Colors.primary} />
          </View>
          <View>
            <Text style={styles.profileName}>{user?.name}</Text>
            <Text style={styles.profileEmail}>{user?.email}</Text>
          </View>
        </View>

        {/* Gemini API */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>AI 설정</Text>
          <View style={styles.card}>
            <SettingRow
              icon="key-outline"
              label="Gemini API 키"
              value={hasGeminiKey ? '등록됨' : '등록하기'}
              onPress={handleKeyPress}
            />
          </View>
        </View>

        {/* 글쓰기 스타일 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>글쓰기</Text>
          <View style={styles.card}>
            <SettingRow icon="color-wand-outline" label="글쓰기 스타일 편집" onPress={() => router.push('/prompts')} />
          </View>
        </View>

        {/* 블로그 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>연동 블로그</Text>
          <View style={styles.card}>
            <SettingRow icon="logo-google" label="Blogger" value={blog?.name ?? '미선택'} onPress={handleChangeBlog} />
          </View>
        </View>

        {/* 계정 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>계정</Text>
          <View style={styles.card}>
            <SettingRow
              icon="log-out-outline"
              label="로그아웃"
              onPress={handleLogout}
              danger
            />
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
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
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: Colors.white,
    padding: 20,
    marginBottom: 8,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileName: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary },
  profileEmail: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  section: { marginBottom: 8 },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  card: { backgroundColor: Colors.white },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  rowIcon: {
    width: 32,
    height: 32,
    borderRadius: 9,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowIconDanger: { backgroundColor: '#FFF0F0' },
  rowLabel: { fontSize: 15, fontWeight: '500', color: Colors.textPrimary },
  rowLabelDanger: { color: Colors.error },
  rowRight: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  rowValue: { fontSize: 14, color: Colors.textSecondary, maxWidth: 120 },
});