import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/stores/authStore';
import { useHistoryStore } from '@/stores/historyStore';
import { usePostStore } from '@/stores/postStore';
import { Button } from '@/components/ui/Button';
import { Colors } from '@/constants/colors';
import type { PostHistory } from '@/types';
import { Touchable } from '@/components/ui/Touchable';
import { BlogSwitcherTrigger, BlogDropdown } from '@/components/ui/BlogSwitcher';

const STATUS_COLORS: Record<PostHistory['publishStatus'], string> = {
  published: Colors.success,
  draft: Colors.warning,
};
const STATUS_LABELS: Record<PostHistory['publishStatus'], string> = {
  published: '발행',
  draft: '임시저장',
};

export default function HomeScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const hasGeminiKey = useAuthStore((s) => s.hasGeminiKey);
  const hasDraft = usePostStore((s) => !!s.body && s.genStatus !== 'running');
  const draftPlace = usePostStore((s) => s.placeName);
  const history = useHistoryStore((s) => s.history);
  const [menuOpen, setMenuOpen] = useState(false);
  const [headerH, setHeaderH] = useState(0);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header} onLayout={(e) => setHeaderH(e.nativeEvent.layout.y + e.nativeEvent.layout.height)}>
        <BlogSwitcherTrigger open={menuOpen} onPress={() => setMenuOpen((v) => !v)} />
        <Touchable
          onPress={() => router.push('/settings')}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="settings-outline" size={22} color={Colors.textSecondary} />
        </Touchable>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.greeting}>
          <Text style={styles.greetingText}>
            안녕하세요,{'\n'}{user?.name ?? ''}님
          </Text>
          <Text style={styles.greetingSubtext}>오늘은 어디를 방문하셨나요?</Text>
        </View>

        {hasDraft && (
          <Touchable style={styles.keyCard} onPress={() => router.push('/(main)/preview')} activeOpacity={0.8}>
            <Ionicons name="document-text-outline" size={20} color={Colors.primary} />
            <View style={{ flex: 1 }}>
              <Text style={styles.keyTitle}>작성 중인 글 이어서 보기</Text>
              <Text style={styles.keyDesc} numberOfLines={1}>{draftPlace || '미리보기에서 수정하고 발행하세요'}</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={Colors.textDisabled} />
          </Touchable>
        )}
        {!hasGeminiKey && (
          <Touchable style={styles.keyCard} onPress={() => router.push('/gemini-guide')} activeOpacity={0.8}>
            <Ionicons name="key-outline" size={20} color={Colors.primary} />
            <View style={{ flex: 1 }}>
              <Text style={styles.keyTitle}>Gemini API 키를 등록해주세요</Text>
              <Text style={styles.keyDesc}>글을 쓰는 AI(Gemini)를 쓰려면 필요해요. 발급 방법을 안내해 드려요</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={Colors.textDisabled} />
          </Touchable>
        )}
        <Button label="새 글 작성하기" onPress={() => router.push('/(main)/create')} fullWidth />

        {history.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>최근 작성</Text>
            <View style={styles.historyList}>
              {history.slice(0, 5).map((item) => (
                <View key={item.id} style={styles.historyItem}>
                  <View style={styles.historyLeft}>
                    <View style={styles.historyIcon}>
                      <Ionicons name="document-text-outline" size={18} color={Colors.primary} />
                    </View>
                    <View style={styles.historyText}>
                      <Text style={styles.historyPlace} numberOfLines={1}>{item.placeName}</Text>
                      <Text style={styles.historyMeta}>
                        {'★'.repeat(Math.round(item.rating))}
                        {'☆'.repeat(5 - Math.round(item.rating))}
                      </Text>
                    </View>
                  </View>
                  <View style={[styles.statusDot, { backgroundColor: STATUS_COLORS[item.publishStatus] }]}>
                    <Text style={styles.statusLabel}>{STATUS_LABELS[item.publishStatus]}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        ) : (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIconBox}>
              <Ionicons name="camera-outline" size={32} color={Colors.textDisabled} />
            </View>
            <Text style={styles.emptyTitle}>아직 작성된 글이 없어요</Text>
            <Text style={styles.emptyDesc}>사진과 별점만 입력하면{'\n'}AI가 블로그 글을 대신 써드려요</Text>
          </View>
        )}
      </ScrollView>
      <BlogDropdown open={menuOpen} top={headerH} onClose={() => setMenuOpen(false)} />
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
  appName: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary, letterSpacing: -0.3 },
  scroll: { flex: 1 },
  content: { padding: 20, gap: 20, paddingBottom: 40 },
  keyCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: Colors.primaryLight, borderRadius: 14, padding: 14 },
  keyTitle: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary },
  keyDesc: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  greeting: { gap: 6 },
  greetingText: { fontSize: 24, fontWeight: '700', color: Colors.textPrimary, lineHeight: 34, letterSpacing: -0.5 },
  greetingSubtext: { fontSize: 15, color: Colors.textSecondary },
  section: { gap: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary },
  historyList: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    overflow: 'hidden',
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  historyLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  historyIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  historyText: { flex: 1, gap: 2 },
  historyPlace: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  historyMeta: { fontSize: 12, color: Colors.star, letterSpacing: 1 },
  statusDot: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusLabel: { fontSize: 11, fontWeight: '600', color: Colors.white },
  emptyCard: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    paddingVertical: 40,
    paddingHorizontal: 24,
    alignItems: 'center',
    gap: 10,
  },
  emptyIconBox: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: Colors.textPrimary },
  emptyDesc: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22 },
});