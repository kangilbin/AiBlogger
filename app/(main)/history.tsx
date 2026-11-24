import React, { useCallback } from 'react';
import { View, Text, FlatList, Image, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useHistoryStore } from '@/stores/historyStore';
import { usePostStore } from '@/stores/postStore';
import { Colors } from '@/constants/colors';
import { Radius, Typo, SCREEN_PADDING } from '@/constants/styles';
import type { PostHistory } from '@/types';
import { ListRow } from '@/components/ui/ListRow';
import { Badge } from '@/components/ui/Badge';
import { RatingValue } from '@/components/ui/StarRating';

const STATUS: Record<PostHistory['publishStatus'], { label: string; tone: 'success' | 'warning' }> = {
  published: { label: '발행완료', tone: 'success' },
  draft: { label: '임시저장', tone: 'warning' },
  generated: { label: '발행 전', tone: 'warning' },
};

export default function HistoryScreen() {
  const router = useRouter();
  const history = useHistoryStore((s) => s.history);
  const remove = useHistoryStore((s) => s.remove);
  const loadFromHistory = usePostStore((s) => s.loadFromHistory);

  const renderItem = useCallback(({ item }: { item: PostHistory }) => {
    const status = STATUS[item.publishStatus];
    const dateStr = new Date(item.createdAt).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' });
    return (
      <ListRow
        left={
          item.thumbnailUri ? (
            <Image source={{ uri: item.thumbnailUri }} style={styles.thumb} />
          ) : (
            <View style={[styles.thumb, styles.thumbEmpty]}>
              <Ionicons name="image-outline" size={22} color={Colors.textDisabled} />
            </View>
          )
        }
        title={item.placeName}
        subtitle={
          <View style={styles.meta}>
            <RatingValue value={item.rating} />
            <Text style={styles.date}>{dateStr}</Text>
          </View>
        }
        right={<Badge label={status.label} tone={status.tone} />}
        chevron
        onPress={() => {
          if (item.publishStatus === 'generated') {
            if (!loadFromHistory(item)) {
              Alert.alert('글 작성 중', '다른 글을 AI가 작성하고 있어요. 완료된 뒤에 열어주세요.');
              return;
            }
            router.push('/(main)/preview');
          } else if (item.postUrl) {
            router.push({ pathname: '/(main)/browser', params: { url: item.postUrl, title: item.placeName } });
          }
        }}
        onLongPress={() =>
          Alert.alert('이력 삭제', `'${item.placeName}' 기록을 삭제할까요?`, [
            { text: '취소', style: 'cancel' },
            { text: '삭제', style: 'destructive', onPress: () => remove(item.id) },
          ])
        }
      />
    );
  }, [router, loadFromHistory, remove]);

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>작성 이력</Text>

      {history.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="time-outline" size={40} color={Colors.textDisabled} />
          <Text style={styles.emptyTitle}>작성 이력이 없어요</Text>
          <Text style={styles.emptyDesc}>글을 작성하면 여기에 표시돼요</Text>
        </View>
      ) : (
        <FlatList
          data={history}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  title: { ...Typo.display, paddingHorizontal: SCREEN_PADDING, paddingTop: 20, paddingBottom: 12 },
  list: { paddingHorizontal: SCREEN_PADDING, paddingBottom: 32 },
  thumb: { width: 52, height: 52, borderRadius: Radius.sm },
  thumbEmpty: { backgroundColor: Colors.fill, alignItems: 'center', justifyContent: 'center' },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  date: Typo.caption,
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8, paddingBottom: 80 },
  emptyTitle: { ...Typo.heading, marginTop: 8 },
  emptyDesc: { ...Typo.body, color: Colors.textSecondary },
});
