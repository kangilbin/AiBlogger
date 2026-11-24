import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { Colors } from '@/constants/colors';
import { layoutBlocks } from '@/utils/postFormat';
import type { PhotoEntry } from '@/types';

/** 미리보기: 본문 블록 + 사진을 실제 게시 순서대로 렌더링 */
export function PostBody({ body, photos }: { body: string; photos: PhotoEntry[] }) {
  return (
    <View style={{ gap: 14 }}>
      {layoutBlocks(body, photos.map((x, i) => i > 0 && !!x.joinPrev)).map((b, i) => {
        if (b.type === 'heading') return <Text key={i} style={styles.heading}>{b.text}</Text>;
        if (b.type === 'paragraph') return <Text key={i} style={styles.p}>{b.text}</Text>;
        if (b.type === 'gallery') {
          const odd = b.indices.length % 2 === 1;
          return (
            <View key={i} style={styles.gallery}>
              {b.indices.map((pi, k) =>
                photos[pi] ? (
                  <Image
                    key={pi}
                    source={{ uri: photos[pi].uri }}
                    style={[styles.cell, odd && k === 0 && styles.cellWide]}
                    resizeMode="cover"
                  />
                ) : null
              )}
            </View>
          );
        }
        const photo = photos[b.index];
        return photo ? <Image key={i} source={{ uri: photo.uri }} style={styles.img} resizeMode="cover" /> : null;
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  heading: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary, marginTop: 6 },
  p: { fontSize: 15, lineHeight: 26, color: Colors.textPrimary },
  gallery: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  cell: { width: '49%', aspectRatio: 1, borderRadius: 10, backgroundColor: Colors.divider },
  cellWide: { width: '100%', aspectRatio: 16 / 9 },
  img: { width: '100%', aspectRatio: 4 / 3, borderRadius: 12, backgroundColor: Colors.divider },
});
