import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, ActivityIndicator, StyleSheet, Linking, Animated, Easing } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { listBlogs } from '@/services/bloggerService';
import { errorMessage } from '@/services/errors';
import { useAuthStore } from '@/stores/authStore';
import { Colors } from '@/constants/colors';
import { Radius } from '@/constants/styles';
import type { BlogInfo } from '@/types';
import { Touchable } from '@/components/ui/Touchable';

/** 헤더에 놓는 콤보박스 버튼: 현재 블로그 이름 + 화살표 (펼침 상태면 화살표가 위로) */
export function BlogSwitcherTrigger({ open, onPress }: { open: boolean; onPress: () => void }) {
  const blog = useAuthStore((s) => s.blog);
  return (
    <Touchable style={styles.trigger} onPress={onPress} accessibilityRole="button" accessibilityLabel="블로그 변경" pressScale={1}>
      <Text style={styles.name} numberOfLines={1}>{blog?.name ?? '블로그 선택'}</Text>
      <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={20} color={Colors.textTertiary} />
    </Touchable>
  );
}

/**
 * 헤더 바로 아래로 펼쳐지는 블로그 목록. 화면 루트(헤더 아래 영역)에 absolute로 겹쳐 그린다.
 * top: 헤더 높이. 바깥(어두운 영역)을 누르면 닫힘.
 */
export function BlogDropdown({ open, top, onClose }: { open: boolean; top: number; onClose: () => void }) {
  const blog = useAuthStore((s) => s.blog);
  const selectBlog = useAuthStore((s) => s.selectBlog);
  const [blogs, setBlogs] = useState<BlogInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const anim = useRef(new Animated.Value(0)).current;

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      setBlogs(await listBlogs());
    } catch (e) {
      setError(errorMessage(e, '블로그 목록을 불러오지 못했습니다.'));
    } finally {
      setLoading(false);
    }
  };

  // 열릴 때 최신 목록을 불러오고, 부드럽게 펼침/접힘
  useEffect(() => {
    if (open) {
      setMounted(true);
      load();
    }
    Animated.timing(anim, {
      toValue: open ? 1 : 0,
      duration: open ? 180 : 140,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished && !open) setMounted(false);
    });
  }, [open]);

  if (!mounted) return null;

  const pick = async (b: BlogInfo) => {
    if (b.id !== blog?.id) await selectBlog(b);
    onClose();
  };

  return (
    <View style={[styles.layer, { top }]} pointerEvents="box-none">
      <Animated.View style={[styles.backdrop, { opacity: anim }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>
      <Animated.View
        style={[
          styles.sheet,
          {
            opacity: anim,
            transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [-10, 0] }) }],
          },
        ]}
      >
        {loading && blogs.length === 0 ? (
          <ActivityIndicator color={Colors.primary} style={{ margin: 16 }} />
        ) : error ? (
          <View style={{ padding: 12, gap: 8 }}>
            <Text style={styles.err}>{error}</Text>
            <Touchable onPress={load}><Text style={styles.link}>다시 시도</Text></Touchable>
          </View>
        ) : (
          blogs.map((b) => {
            const on = b.id === blog?.id;
            return (
              <Touchable key={b.id} style={[styles.item, on && styles.itemOn]} onPress={() => pick(b)} activeOpacity={0.7}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.itemName} numberOfLines={1}>{b.name}</Text>
                  <Text style={styles.itemUrl} numberOfLines={1}>{b.url.replace(/^https?:\/\//, '')}</Text>
                </View>
                {on && <Ionicons name="checkmark" size={20} color={Colors.primary} />}
              </Touchable>
            );
          })
        )}
        <Touchable style={styles.add} onPress={() => { onClose(); Linking.openURL('https://www.blogger.com'); }}>
          <Ionicons name="add" size={18} color={Colors.primary} />
          <Text style={styles.addText}>Blogger에서 새 블로그 만들기</Text>
        </Touchable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  trigger: { flexDirection: 'row', alignItems: 'center', gap: 4, flexShrink: 1, maxWidth: '75%' },
  name: { fontSize: 20, fontWeight: '700', color: Colors.textPrimary, flexShrink: 1, letterSpacing: -0.4 },
  layer: { position: 'absolute', left: 0, right: 0, bottom: 0, zIndex: 10 },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: Colors.overlay },
  sheet: {
    backgroundColor: Colors.bg,
    padding: 12,
    gap: 4,
    borderBottomLeftRadius: Radius.lg,
    borderBottomRightRadius: Radius.lg,
  },
  item: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 14, borderRadius: Radius.sm },
  itemOn: { backgroundColor: Colors.primaryLight },
  itemName: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary },
  itemUrl: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  add: { flexDirection: 'row', alignItems: 'center', gap: 6, padding: 14, marginTop: 4 },
  addText: { fontSize: 14, fontWeight: '600', color: Colors.primary },
  err: { fontSize: 13, color: Colors.error },
  link: { fontSize: 14, fontWeight: '600', color: Colors.primary },
});
