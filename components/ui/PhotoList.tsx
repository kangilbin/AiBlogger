import React from 'react';
import { View, Image, Text, TextInput, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import type { PhotoEntry } from '@/types';
import { Touchable } from '@/components/ui/Touchable';

interface Props {
  photos: PhotoEntry[];
  maxCount: number;
  onAdd: () => void;
  onRemove: (i: number) => void;
  onMove: (i: number, dir: -1 | 1) => void;
  onNote: (i: number, note: string) => void;
  onJoin: (i: number, join: boolean) => void;
}

/** 사진을 촬영 순서대로 나열하고 사진별 메모를 입력 */
export function PhotoList({ photos, maxCount, onAdd, onRemove, onMove, onNote, onJoin }: Props) {
  return (
    <View style={styles.wrap}>
      {photos.map((p, i) => (
        <View key={p.uri + i} style={[styles.card, i > 0 && p.joinPrev && styles.cardJoined]}>
          <View style={styles.top}>
            <View>
              <Image source={{ uri: p.uri }} style={styles.thumb} />
              <View style={styles.badge}><Text style={styles.badgeText}>{i + 1}</Text></View>
            </View>
            <TextInput
              style={styles.note}
              placeholder="이 사진 메모 (예: 테이블이 끈적했음)"
              placeholderTextColor={Colors.textDisabled}
              value={p.note}
              onChangeText={(t) => onNote(i, t)}
              multiline
              maxLength={120}
            />
          </View>
          <View style={styles.actions}>
            <Touchable disabled={i === 0} onPress={() => onMove(i, -1)} style={styles.iconBtn}>
              <Ionicons name="arrow-up" size={18} color={i === 0 ? Colors.textDisabled : Colors.textPrimary} />
            </Touchable>
            <Touchable disabled={i === photos.length - 1} onPress={() => onMove(i, 1)} style={styles.iconBtn}>
              <Ionicons name="arrow-down" size={18} color={i === photos.length - 1 ? Colors.textDisabled : Colors.textPrimary} />
            </Touchable>
            {i > 0 && (
              <Touchable
                onPress={() => onJoin(i, !p.joinPrev)}
                style={[styles.joinChip, p.joinPrev && styles.joinChipOn]}
                accessibilityLabel="이전 사진과 한 묶음으로 올리기"
              >
                <Ionicons name={p.joinPrev ? 'link' : 'link-outline'} size={15} color={p.joinPrev ? Colors.white : Colors.textSecondary} />
                <Text style={[styles.joinText, p.joinPrev && { color: Colors.white }]}>
                  {p.joinPrev ? '이전 사진과 묶음' : '이전 사진과 묶기'}
                </Text>
              </Touchable>
            )}
            <View style={{ flex: 1 }} />
            <Touchable onPress={() => onRemove(i)} style={styles.iconBtn}>
              <Ionicons name="trash-outline" size={18} color={Colors.error} />
            </Touchable>
          </View>
        </View>
      ))}
      {photos.length < maxCount && (
        <Touchable style={styles.add} onPress={onAdd} activeOpacity={0.7}>
          <Ionicons name="add" size={22} color={Colors.textSecondary} />
          <Text style={styles.addLabel}>사진 추가 ({photos.length}/{maxCount})</Text>
        </Touchable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 10 },
  card: { backgroundColor: Colors.white, borderRadius: 14, padding: 10, gap: 6, borderWidth: 1, borderColor: Colors.border },
  cardJoined: { borderLeftWidth: 4, borderLeftColor: Colors.primary },
  joinChip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 14, backgroundColor: Colors.background, marginLeft: 6 },
  joinChipOn: { backgroundColor: Colors.primary },
  joinText: { fontSize: 12, fontWeight: '600', color: Colors.textSecondary },
  top: { flexDirection: 'row', gap: 10 },
  thumb: { width: 84, height: 84, borderRadius: 10 },
  badge: { position: 'absolute', top: 4, left: 4, width: 20, height: 20, borderRadius: 10, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  badgeText: { color: Colors.white, fontSize: 11, fontWeight: '700' },
  note: { flex: 1, minHeight: 84, backgroundColor: Colors.background, borderRadius: 10, paddingHorizontal: 12, paddingTop: 10, fontSize: 14, color: Colors.textPrimary, textAlignVertical: 'top' },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  iconBtn: { padding: 6 },
  add: { height: 56, borderRadius: 14, borderWidth: 1.5, borderColor: Colors.border, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 6, backgroundColor: Colors.background },
  addLabel: { fontSize: 14, color: Colors.textSecondary },
});
