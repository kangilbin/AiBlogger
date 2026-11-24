import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View, Image, Text, TextInput, StyleSheet, Animated, Dimensions,
  type GestureResponderEvent, type ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import type { PhotoEntry } from '@/types';
import { Touchable } from '@/components/ui/Touchable';
import { groupsOf } from '@/utils/photoGroup';

interface Props {
  photos: PhotoEntry[];
  maxCount: number;
  onAdd: () => void;
  onRemove: (i: number) => void;
  /** 사진이 속한 묶음(카드)을 위/아래로 이동 */
  onMove: (i: number, dir: -1 | 1) => void;
  onNote: (i: number, note: string) => void;
  /** 바로 앞 사진과 묶기/풀기 */
  onJoin: (i: number, join: boolean) => void;
  /** 드래그앤드랍: from 사진을 to 사진의 묶음으로 */
  onGroup: (from: number, to: number) => void;
  /** 드래그 중에는 부모 스크롤을 잠근다 */
  onDragChange?: (dragging: boolean) => void;
  /** 드래그 중 화면 끝에서 자동 스크롤하기 위한 부모 ScrollView 참조/현재 스크롤 위치 */
  scrollRef?: React.RefObject<ScrollView | null>;
  scrollYRef?: React.MutableRefObject<number>;
}

type Rect = { x: number; y: number; w: number; h: number };

const LONG_PRESS_MS = 350;
const MOVE_CANCEL_PX = 10;
const EDGE_PX = 110;
const TICK_MS = 60;
const THUMB = 84;

const measure = (v: View | null) =>
  new Promise<Rect | null>((resolve) => {
    if (!v) return resolve(null);
    v.measureInWindow((x, y, w, h) => resolve({ x, y, w, h }));
  });

/** 사진을 묶음 단위 카드로 나열. 사진을 길게 눌러 다른 사진 위로 끌어다 놓으면 한 줄로 묶인다 */
export function PhotoList({
  photos, maxCount, onAdd, onRemove, onMove, onNote, onJoin, onGroup, onDragChange, scrollRef, scrollYRef,
}: Props) {
  const groups = groupsOf(photos);
  const thumbRefs = useRef<(View | null)[]>([]);
  const pan = useRef(new Animated.ValueXY()).current;
  const [drag, setDrag] = useState<{ from: number; hover: number | null } | null>(null);

  // 드래그 중 최신 값은 ref로 들고 있어 이벤트/타이머에서 항상 최신을 읽는다
  const live = useRef({
    active: false,
    from: -1,
    hover: null as number | null,
    startPage: { x: 0, y: 0 },
    startCenter: { x: 0, y: 0 },
    startScrollY: 0,
    dx: 0,
    dy: 0,
    timer: null as ReturnType<typeof setTimeout> | null,
    tick: null as ReturnType<typeof setInterval> | null,
    rects: [] as (Rect | null)[],
    busy: false,
  }).current;
  const photosRef = useRef(photos);
  photosRef.current = photos;
  const cb = useRef({ onGroup, onDragChange });
  cb.current = { onGroup, onDragChange };

  const groupIdOf = (i: number) => groupsOf(photosRef.current).findIndex((g) => g.includes(i));

  /** 손가락 위치(창 좌표)가 올라가 있는 다른 묶음의 사진 */
  const hitTest = useCallback((): number | null => {
    const fx = live.startCenter.x + live.dx;
    const fy = live.startCenter.y + live.dy;
    const myGroup = groupIdOf(live.from);
    for (let i = 0; i < live.rects.length; i++) {
      const r = live.rects[i];
      if (!r || i === live.from || groupIdOf(i) === myGroup) continue;
      if (fx >= r.x && fx <= r.x + r.w && fy >= r.y && fy <= r.y + r.h) return i;
    }
    return null;
  }, [live]);

  const remeasure = useCallback(async () => {
    const n = photosRef.current.length;
    live.rects = await Promise.all(Array.from({ length: n }, (_, i) => measure(thumbRefs.current[i] ?? null)));
  }, [live]);

  const applyPan = useCallback(() => {
    const scrolled = (scrollYRef?.current ?? 0) - live.startScrollY;
    pan.setValue({ x: live.dx, y: live.dy + scrolled });
  }, [live, pan, scrollYRef]);

  const stopTimers = useCallback(() => {
    if (live.timer) clearTimeout(live.timer);
    if (live.tick) clearInterval(live.tick);
    live.timer = null;
    live.tick = null;
  }, [live]);

  const finish = useCallback(async (drop: boolean) => {
    if (!live.active) return;
    stopTimers();
    live.active = false;
    let target: number | null = null;
    if (drop) {
      await remeasure();
      target = hitTest();
    }
    const from = live.from;
    pan.setValue({ x: 0, y: 0 });
    setDrag(null);
    cb.current.onDragChange?.(false);
    if (target !== null) cb.current.onGroup(from, target);
  }, [hitTest, live, pan, remeasure, stopTimers]);

  const begin = useCallback(async (i: number) => {
    await remeasure();
    const r = live.rects[i];
    if (!r) return;
    live.active = true;
    live.from = i;
    live.hover = null;
    live.startCenter = { x: r.x + r.w / 2, y: r.y + r.h / 2 };
    live.startScrollY = scrollYRef?.current ?? 0;
    live.dx = 0;
    live.dy = 0;
    pan.setValue({ x: 0, y: 0 });
    setDrag({ from: i, hover: null });
    cb.current.onDragChange?.(true);

    live.tick = setInterval(async () => {
      if (!live.active || live.busy) return;
      live.busy = true;
      try {
        // 화면 위/아래 끝에 손가락이 가까우면 자동 스크롤
        const fy = live.startCenter.y + live.dy;
        const h = Dimensions.get('window').height;
        const cur = scrollYRef?.current ?? 0;
        if (fy < EDGE_PX + 60) scrollRef?.current?.scrollTo({ y: Math.max(0, cur - 22), animated: false });
        else if (fy > h - EDGE_PX) scrollRef?.current?.scrollTo({ y: cur + 22, animated: false });
        await remeasure();
        applyPan();
        const hover = hitTest();
        if (hover !== live.hover) {
          live.hover = hover;
          setDrag((d) => (d ? { ...d, hover } : d));
        }
      } finally {
        live.busy = false;
      }
    }, TICK_MS);
  }, [applyPan, hitTest, live, pan, remeasure, scrollRef, scrollYRef]);

  useEffect(() => () => {
    stopTimers();
    if (live.active) {
      live.active = false;
      cb.current.onDragChange?.(false);
    }
  }, [live, stopTimers]);

  const onTouchStart = (i: number) => (e: GestureResponderEvent) => {
    const { pageX, pageY } = e.nativeEvent;
    live.startPage = { x: pageX, y: pageY };
    if (live.timer) clearTimeout(live.timer);
    live.timer = setTimeout(() => { live.timer = null; void begin(i); }, LONG_PRESS_MS);
  };
  const onTouchMove = (e: GestureResponderEvent) => {
    const { pageX, pageY } = e.nativeEvent;
    const dx = pageX - live.startPage.x;
    const dy = pageY - live.startPage.y;
    if (!live.active) {
      // 길게 누르기 전에 움직이면 스크롤 의도로 보고 취소
      if (live.timer && Math.hypot(dx, dy) > MOVE_CANCEL_PX) { clearTimeout(live.timer); live.timer = null; }
      return;
    }
    live.dx = dx;
    live.dy = dy;
    applyPan();
  };
  const onTouchEnd = () => {
    if (live.timer) { clearTimeout(live.timer); live.timer = null; }
    void finish(true);
  };
  const onTouchCancel = () => {
    if (live.timer) { clearTimeout(live.timer); live.timer = null; }
    void finish(false);
  };

  const renderThumb = (i: number) => {
    const p = photos[i];
    const dragging = drag?.from === i;
    const hovered = drag?.hover === i;
    return (
      <Animated.View
        key={p.uri + i}
        style={[
          styles.thumbWrap,
          dragging && { transform: pan.getTranslateTransform(), zIndex: 30, elevation: 12, opacity: 0.85 },
        ]}
      >
        <View
          ref={(r) => { thumbRefs.current[i] = r; }}
          collapsable={false}
          style={[styles.thumbBox, hovered && styles.thumbHover]}
          onTouchStart={onTouchStart(i)}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          onTouchCancel={onTouchCancel}
        >
          <Image source={{ uri: p.uri }} style={styles.thumb} />
          <View style={styles.badge}><Text style={styles.badgeText}>{i + 1}</Text></View>
          <Touchable onPress={() => onRemove(i)} style={styles.removeBtn} hitSlop={6} accessibilityLabel="사진 삭제">
            <Ionicons name="close" size={14} color={Colors.white} />
          </Touchable>
        </View>
      </Animated.View>
    );
  };

  return (
    <View style={styles.wrap}>
      {groups.map((g, gi) => {
        const first = g[0];
        const multi = g.length > 1;
        const cardDragging = !!drag && g.includes(drag.from);
        return (
          <View
            key={g.map((i) => photos[i].uri + i).join('|')}
            style={[styles.card, multi && styles.cardJoined, cardDragging && styles.cardRaised]}
          >
            <View style={styles.thumbRow}>
              {g.map((i) => renderThumb(i))}
              {!multi && (
                <TextInput
                  style={styles.note}
                  placeholder="이 사진 메모 (예: 테이블이 끈적했음)"
                  placeholderTextColor={Colors.textDisabled}
                  value={photos[first].note}
                  onChangeText={(t) => onNote(first, t)}
                  multiline
                  maxLength={120}
                />
              )}
            </View>

            {multi && g.map((i) => (
              <View key={'n' + photos[i].uri + i} style={styles.noteRow}>
                <View style={styles.noteBadge}><Text style={styles.badgeText}>{i + 1}</Text></View>
                <TextInput
                  style={[styles.note, styles.noteSmall]}
                  placeholder="이 사진 메모"
                  placeholderTextColor={Colors.textDisabled}
                  value={photos[i].note}
                  onChangeText={(t) => onNote(i, t)}
                  multiline
                  maxLength={120}
                />
                {i !== first && (
                  <Touchable onPress={() => onJoin(i, false)} style={styles.iconBtn} accessibilityLabel="여기서 묶음 나누기">
                    <Ionicons name="cut-outline" size={18} color={Colors.textSecondary} />
                  </Touchable>
                )}
              </View>
            ))}

            <View style={styles.actions}>
              <Touchable disabled={gi === 0} onPress={() => onMove(first, -1)} style={styles.iconBtn}>
                <Ionicons name="arrow-up" size={18} color={gi === 0 ? Colors.textDisabled : Colors.textPrimary} />
              </Touchable>
              <Touchable disabled={gi === groups.length - 1} onPress={() => onMove(first, 1)} style={styles.iconBtn}>
                <Ionicons name="arrow-down" size={18} color={gi === groups.length - 1 ? Colors.textDisabled : Colors.textPrimary} />
              </Touchable>
              <View style={{ flex: 1 }} />
              {gi > 0 && (
                <Touchable onPress={() => onJoin(first, true)} style={styles.joinChip} accessibilityLabel="앞 카드와 한 묶음으로 올리기">
                  <Ionicons name="link-outline" size={15} color={Colors.textSecondary} />
                  <Text style={styles.joinText}>앞과 묶기</Text>
                </Touchable>
              )}
            </View>
          </View>
        );
      })}
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
  card: { backgroundColor: Colors.white, borderRadius: 14, padding: 10, gap: 8, borderWidth: 1, borderColor: Colors.border },
  cardJoined: { borderLeftWidth: 4, borderLeftColor: Colors.primary },
  cardRaised: { zIndex: 20, elevation: 8 },
  thumbRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  thumbWrap: { zIndex: 1 },
  thumbBox: { width: THUMB, height: THUMB, borderRadius: 10, borderWidth: 3, borderColor: 'transparent' },
  thumbHover: { borderColor: Colors.primary },
  thumb: { width: '100%', height: '100%', borderRadius: 7 },
  badge: { position: 'absolute', top: 2, left: 2, width: 20, height: 20, borderRadius: 10, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  badgeText: { color: Colors.white, fontSize: 11, fontWeight: '700' },
  removeBtn: { position: 'absolute', top: 2, right: 2, width: 20, height: 20, borderRadius: 10, backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center' },
  noteRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  noteBadge: { width: 20, height: 20, borderRadius: 10, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  note: { flex: 1, minHeight: THUMB, backgroundColor: Colors.background, borderRadius: 10, paddingHorizontal: 12, paddingTop: 10, fontSize: 14, color: Colors.textPrimary, textAlignVertical: 'top' },
  noteSmall: { minHeight: 40, paddingTop: 8, paddingBottom: 8 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  iconBtn: { padding: 6 },
  joinChip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 14, backgroundColor: Colors.background },
  joinText: { fontSize: 12, fontWeight: '600', color: Colors.textSecondary },
  add: { height: 56, borderRadius: 14, borderWidth: 1.5, borderColor: Colors.border, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 6, backgroundColor: Colors.background },
  addLabel: { fontSize: 14, color: Colors.textSecondary },
});
