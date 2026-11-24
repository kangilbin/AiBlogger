import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/stores/authStore';
import { useHistoryStore } from '@/stores/historyStore';
import { usePostStore } from '@/stores/postStore';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ListRow, RowIcon } from '@/components/ui/ListRow';
import { RatingValue } from '@/components/ui/StarRating';
import { Colors } from '@/constants/colors';
import { Radius, Typo, SCREEN_PADDING } from '@/constants/styles';
import type { PostHistory } from '@/types';
import { Touchable } from '@/components/ui/Touchable';
import { BlogSwitcherTrigger, BlogDropdown } from '@/components/ui/BlogSwitcher';

const STATUS: Record<PostHistory['publishStatus'], { label: string; tone: 'success' | 'warning' }> = {
  published: { label: '발행', tone: 'success' },
  draft: { label: '임시저장', tone: 'warning' },
  generated: { label: '발행 전', tone: 'warning' },
};

/** 눌러서 이동하는 안내 카드 (작성 중인 글, 키 등록 등) */
function NoticeCard({ icon, title, desc, onPress }: {
  icon: React.ComponentProps<typeof Ionicons>['name']; title: string; desc: string; onPress: () => void;
}) {
  return (
    <Touchable style={styles.notice} onPress={onPress} pressScale={0.98}>
      <View style={styles.noticeIcon}>
        <Ionicons name={icon} size={20} color={Colors.primary} />
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={styles.noticeTitle}>{title}</Text>
        <Text style={styles.noticeDesc} numberOfLines={1}>{desc}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={Colors.textDisabled} />
    </Touchable>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const hasGeminiKey = useAuthStore((s) => s.hasGeminiKey);
  const hasDraft = usePostStore((s) => !!s.body && s.genStatus !== 'running');
  const openDraft = (item: PostHistory) => {
    if (!usePostStore.getState().loadFromHistory(item)) {
      Alert.alert('글 작성 중', '다른 글을 AI가 작성하고 있어요. 완료된 뒤에 열어주세요.');
      return;
    }
    router.push('/(main)/preview');
  };
  const resetForm = usePostStore((s) => s.resetForm);
  const draftPlace = usePostStore((s) => s.placeName);
  const history = useHistoryStore((s) => s.history);
  const [menuOpen, setMenuOpen] = useState(false);
  const [headerH, setHeaderH] = useState(0);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header} onLayout={(e) => setHeaderH(e.nativeEvent.layout.y + e.nativeEvent.layout.height)}>
        <BlogSwitcherTrigger open={menuOpen} onPress={() => setMenuOpen((v) => !v)} />
        <Touchable onPress={() => router.push('/settings')} hitSlop={12} accessibilityLabel="설정">
          <Ionicons name="settings-outline" size={24} color={Colors.textTertiary} />
        </Touchable>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.greeting}>
          <Text style={Typo.display}>안녕하세요,{'\n'}{user?.name ?? ''}님</Text>
          <Text style={styles.greetingSub}>오늘은 어디를 다녀오셨나요?</Text>
        </View>

        {hasDraft && (
          <NoticeCard
            icon="document-text-outline"
            title="작성 중인 글 이어서 보기"
            desc={draftPlace || '미리보기에서 수정하고 발행하세요'}
            onPress={() => router.push('/(main)/preview')}
          />
        )}
        {!hasGeminiKey && (
          <NoticeCard
            icon="key-outline"
            title="Gemini API 키를 등록해주세요"
            desc="글을 쓰는 AI를 쓰려면 필요해요"
            onPress={() => router.push('/gemini-guide')}
          />
        )}

        <Button label="새 글 작성하기" onPress={() => { if (usePostStore.getState().genStatus !== 'running') resetForm(); router.push('/(main)/create'); }} fullWidth />

        {history.length > 0 ? (
          <View style={styles.section}>
            <View style={styles.sectionHead}>
              <Text style={Typo.heading}>최근 작성</Text>
              <Touchable onPress={() => router.push('/(main)/history')} hitSlop={8}>
                <Text style={styles.more}>전체보기</Text>
              </Touchable>
            </View>
            {history.slice(0, 5).map((item) => (
              <ListRow
                key={item.id}
                left={<RowIcon name="document-text-outline" />}
                title={item.placeName}
                subtitle={<RatingValue value={item.rating} />}
                right={<Badge label={STATUS[item.publishStatus].label} tone={STATUS[item.publishStatus].tone} />}
                onPress={
                  item.publishStatus === 'generated'
                    ? () => openDraft(item)
                    : undefined
                }
              />
            ))}
          </View>
        ) : (
          <View style={styles.empty}>
            <Ionicons name="camera-outline" size={40} color={Colors.textDisabled} />
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
  container: { flex: 1, backgroundColor: Colors.bg },
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SCREEN_PADDING,
    backgroundColor: Colors.bg,
  },
  content: { paddingHorizontal: SCREEN_PADDING, paddingTop: 12, paddingBottom: 40, gap: 16 },
  greeting: { gap: 8, marginBottom: 8 },
  greetingSub: { ...Typo.body, fontSize: 16, color: Colors.textSecondary },
  notice: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: Colors.fill, borderRadius: Radius.md, padding: 16 },
  noticeIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.bg, alignItems: 'center', justifyContent: 'center' },
  noticeTitle: { ...Typo.body, fontWeight: '600' },
  noticeDesc: Typo.caption,
  section: { marginTop: 16 },
  sectionHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  more: { ...Typo.caption, fontSize: 14, color: Colors.textTertiary },
  empty: { alignItems: 'center', gap: 8, paddingVertical: 56 },
  emptyTitle: { ...Typo.heading, marginTop: 8 },
  emptyDesc: { ...Typo.body, color: Colors.textSecondary, textAlign: 'center' },
});
