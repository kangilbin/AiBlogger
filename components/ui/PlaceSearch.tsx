import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TextInput, ActivityIndicator, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { searchPlaces, hasKakaoSearch } from '@/services/placeService';
import { errorMessage } from '@/services/errors';
import { Colors } from '@/constants/colors';
import { Radius } from '@/constants/styles';
import { Touchable } from '@/components/ui/Touchable';
import type { PlaceInfo } from '@/types';

interface Props {
  /** 선택된 장소 (없으면 검색 입력을 보여줌) */
  value: PlaceInfo | null;
  /** 검색창 초기 검색어로 쓸 장소명 */
  initialQuery?: string;
  onChange: (p: PlaceInfo | null) => void;
}

/** 장소 검색 → 후보 목록(인라인) → 선택하면 좌표가 확정됨. 입력은 0.5초 멈추면 검색 */
export function PlaceSearch({ value, initialQuery = '', onChange }: Props) {
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<PlaceInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (value) return;
    abortRef.current?.abort();
    if (query.trim().length < 2) {
      setLoading(false); // 진행 중이던 요청을 취소했으니 로딩 표시도 끈다
      setResults([]);
      setSearched(false);
      setError(null);
      return;
    }
    const t = setTimeout(async () => {
      const ctrl = new AbortController();
      abortRef.current = ctrl;
      setLoading(true);
      setError(null);
      try {
        const r = await searchPlaces(query, ctrl.signal);
        if (!ctrl.signal.aborted) {
          setResults(r);
          setSearched(true);
        }
      } catch (e) {
        if ((e as Error).name !== 'AbortError') setError(errorMessage(e, '장소 검색에 실패했습니다.'));
      } finally {
        if (!ctrl.signal.aborted) setLoading(false);
      }
    }, 500);
    return () => clearTimeout(t);
  }, [query, value]);

  if (value) {
    return (
      <View style={styles.selected}>
        <Ionicons name="location" size={20} color={Colors.primary} />
        <View style={{ flex: 1 }}>
          <Text style={styles.selName} numberOfLines={1}>{value.name}</Text>
          <Text style={styles.selAddr} numberOfLines={2}>{value.address}</Text>
        </View>
        <Touchable onPress={() => { onChange(null); setResults([]); }} accessibilityLabel="장소 다시 선택" hitSlop={8}>
          <Ionicons name="close-circle" size={22} color={Colors.textDisabled} />
        </Touchable>
      </View>
    );
  }

  return (
    <View style={{ gap: 8 }}>
      <View style={styles.inputWrap}>
        <Ionicons name="search" size={18} color={Colors.textTertiary} />
        <TextInput
          style={styles.input}
          value={query}
          onChangeText={setQuery}
          placeholder="가게·장소 이름으로 검색 (예: 성수 ○○카페)"
          placeholderTextColor={Colors.textDisabled}
          returnKeyType="search"
          autoCorrect={false}
        />
        {loading && <ActivityIndicator size="small" color={Colors.primary} />}
      </View>
      {error ? <Text style={styles.err}>{error}</Text> : null}
      {results.length > 0 && (
        <View style={styles.list}>
          {results.map((p, i) => (
            <Touchable key={`${p.lat},${p.lng},${i}`} style={styles.row} onPress={() => onChange(p)} activeOpacity={0.7}>
              <Ionicons name="location-outline" size={18} color={Colors.textSecondary} />
              <View style={{ flex: 1 }}>
                <Text style={styles.name} numberOfLines={1}>{p.name}</Text>
                <Text style={styles.addr} numberOfLines={2}>{p.address}</Text>
              </View>
            </Touchable>
          ))}
        </View>
      )}
      {searched && !loading && !error && results.length === 0 && (
        <Text style={styles.hint}>검색 결과가 없습니다. 이름을 변경하거나 지역을 함께 입력해 보세요. 찾지 못해도 이 단계는 건너뛸 수 있습니다(장소명으로 지도를 검색합니다).</Text>
      )}
      {!hasKakaoSearch && (
        <Text style={styles.hint}>무료 지도 검색을 사용하므로 일부 매장은 검색되지 않을 수 있습니다.</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  inputWrap: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: Colors.fill, borderRadius: Radius.sm, paddingHorizontal: 14 },
  input: { flex: 1, paddingVertical: 14, fontSize: 16, color: Colors.textPrimary },
  list: { backgroundColor: Colors.fill, borderRadius: Radius.sm, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingVertical: 12 },
  name: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary },
  addr: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  selected: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: Colors.primaryLight, borderRadius: Radius.sm, padding: 14 },
  selName: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary },
  selAddr: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  err: { fontSize: 13, color: Colors.error },
  hint: { fontSize: 13, color: Colors.textTertiary, lineHeight: 18 },
});
