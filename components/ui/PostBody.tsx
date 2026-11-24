import React, { useState } from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { Colors } from '@/constants/colors';
import { Radius } from '@/constants/styles';
import { layoutBlocks, inlineSegments } from '@/utils/postFormat';
import type { PhotoEntry } from '@/types';

const GAP = 6;

const rich = (text: string) =>
  inlineSegments(text).map((s, k) => (s.bold ? <Text key={k} style={{ fontWeight: '700' }}>{s.text}</Text> : s.text));

/** 묶음 사진: 퍼센트 폭 대신 실제 폭을 재서 픽셀로 배치 (홀수면 첫 장을 가로 전체로) */
function Gallery({ uris }: { uris: string[] }) {
  const [w, setW] = useState(0);
  const odd = uris.length % 2 === 1;
  const half = Math.floor((w - GAP) / 2);
  return (
    <View style={[styles.gallery, styles.photoGap]} onLayout={(e) => setW(e.nativeEvent.layout.width)}>
      {w > 0 &&
        uris.map((uri, k) => {
          const wide = odd && k === 0;
          return (
            <Image
              key={`${k}-${uri}`}
              source={{ uri }}
              style={[styles.cell, wide ? { width: w, height: Math.round((w * 9) / 16) } : { width: half, height: half }]}
              resizeMode="cover"
            />
          );
        })}
    </View>
  );
}

/** 미리보기: 본문 블록 + 사진을 실제 게시 순서대로 렌더링 */
export function PostBody({ body, photos }: { body: string; photos: PhotoEntry[] }) {
  return (
    <View style={{ gap: 16 }}>
      {layoutBlocks(body, photos.map((x, i) => i > 0 && !!x.joinPrev)).map((b, i) => {
        if (b.type === 'heading') return <Text key={i} style={styles.heading}>{b.text}</Text>;
        if (b.type === 'paragraph') return <Text key={i} style={styles.p}>{rich(b.text)}</Text>;
        if (b.type === 'quote')
          return (
            <View key={i} style={styles.quote}>
              <Text style={styles.p}>{rich(b.text)}</Text>
            </View>
          );
        if (b.type === 'list')
          return (
            <View key={i} style={{ gap: 6 }}>
              {b.items.map((it, k) => (
                <View key={k} style={styles.li}>
                  <Text style={styles.p}>•</Text>
                  <Text style={[styles.p, { flex: 1 }]}>{rich(it)}</Text>
                </View>
              ))}
            </View>
          );
        if (b.type === 'divider') return <View key={i} style={styles.hr} />;
        if (b.type === 'gallery') {
          return <Gallery key={i} uris={b.indices.map((pi) => photos[pi]?.uri).filter(Boolean) as string[]} />;
        }
        const photo = photos[b.index];
        return photo ? <Image key={i} source={{ uri: photo.uri }} style={[styles.img, styles.photoGap]} resizeMode="cover" /> : null;
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  heading: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary, marginTop: 22, marginBottom: -2, letterSpacing: -0.2 },
  p: { fontSize: 16, lineHeight: 27, color: Colors.textPrimary },
  photoGap: { marginTop: 14 },
  quote: { padding: 16, borderRadius: Radius.sm, backgroundColor: Colors.fill, borderLeftWidth: 4, borderLeftColor: Colors.primary },
  li: { flexDirection: 'row', gap: 8, paddingLeft: 4 },
  hr: { height: 1, backgroundColor: Colors.fillStrong, marginVertical: 12 },
  gallery: { flexDirection: 'row', flexWrap: 'wrap', gap: GAP, width: '100%' },
  cell: { borderRadius: Radius.sm, backgroundColor: Colors.fill },
  img: { width: '100%', aspectRatio: 4 / 3, borderRadius: Radius.sm, backgroundColor: Colors.fill },
});
