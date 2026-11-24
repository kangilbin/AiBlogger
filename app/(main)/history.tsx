import React, { useCallback } from 'react';
import {
  View, Text, FlatList, Image,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useHistoryStore } from '@/stores/historyStore';
import { Colors } from '@/constants/colors';
import type { PostHistory } from '@/types';
import { Touchable } from '@/components/ui/Touchable';

const STATUS_MAP: Record<PostHistory['publishStatus'], { label: string; color: string }> = {
  published: { label: '발행완료', color: Colors.success },
    draft:     { label: '임시저장', color: Colors.warning },
};

export default function HistoryScreen() {
  const router = useRouter();
  const history = useHistoryStore((s) => s.history);


  const renderItem = useCallback(({ item, index }: { item: PostHistory; index: number }) => {
    const status = STATUS_MAP[item.publishStatus];
    const dateStr = new Date(item.createdAt).toLocaleDateString('ko-KR', {
      month: 'short', day: 'numeric',
    });
    const isLast = index === history.length - 1;

    return (
      <Touchable
        style={[styles.item, !isLast && styles.itemBorder]}
        onPress={() => {
          if (item.postUrl) {
            router.push({
              pathname: '/(main)/browser',
              params: { url: item.postUrl, title: item.placeName },
            });
          }
        }}
        activeOpacity={0.6}
      >
        {item.thumbnailUri ? (
          <Image source={{ uri: item.thumbnailUri }} style={styles.thumbnail} />
        ) : (
          <View style={[styles.thumbnail, styles.thumbnailPlaceholder]}>
            <Ionicons name="image-outline" size={22} color={Colors.textDisabled} />
          </View>
        )}
        <View style={styles.itemContent}>
          <View style={styles.itemTop}>
            <Text style={styles.placeName} numberOfLines={1}>{item.placeName}</Text>
            <Text style={styles.date}>{dateStr}</Text>
          </View>
          <View style={styles.itemBottom}>
            <Text style={styles.rating}>
              {'★'.repeat(Math.round(item.rating))}{'☆'.repeat(5 - Math.round(item.rating))}
            </Text>
            <View style={[styles.badge, { backgroundColor: status.color + '20' }]}>
              <Text style={[styles.badgeText, { color: status.color }]}>{status.label}</Text>
            </View>
          </View>
        </View>
        {item.postUrl && (
          <Ionicons name="chevron-forward" size={16} color={Colors.textDisabled} />
        )}
      </Touchable>
    );
  }, [history]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>작성 이력</Text>
      </View>

      {history.length === 0 ? (
        <View style={styles.centerBox}>
          <View style={styles.emptyIconBox}>
            <Ionicons name="time-outline" size={32} color={Colors.textDisabled} />
          </View>
          <Text style={styles.emptyTitle}>작성 이력이 없어요</Text>
          <Text style={styles.emptyDesc}>글을 작성하면 여기에 표시됩니다</Text>
        </View>
      ) : (
        <FlatList
          data={history}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            history.length > 0 ? (
              <View style={styles.listCard} />
            ) : null
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary, letterSpacing: -0.3 },
  listContent: { padding: 16 },
  listCard: { height: 0 },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
    borderRadius: 16,
    marginBottom: 8,
  },
  itemBorder: {},
  thumbnail: { width: 56, height: 56, borderRadius: 12 },
  thumbnailPlaceholder: {
    backgroundColor: Colors.divider,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemContent: { flex: 1, gap: 6 },
  itemTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  placeName: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary, flex: 1 },
  date: { fontSize: 12, color: Colors.textSecondary, marginLeft: 8 },
  itemBottom: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rating: { fontSize: 12, color: Colors.star, letterSpacing: 1 },
  badge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeText: { fontSize: 11, fontWeight: '600' },
  centerBox: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, padding: 24 },
  emptyIconBox: {
    width: 72,
    height: 72,
    borderRadius: 22,
    backgroundColor: Colors.divider,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: Colors.textPrimary },
  emptyDesc: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center' },
  errorText: { fontSize: 14, color: Colors.error, textAlign: 'center' },
  retryBtn: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    backgroundColor: Colors.primaryLight,
    borderRadius: 10,
    marginTop: 4,
  },
  retryText: { fontSize: 14, color: Colors.primary, fontWeight: '600' },
});