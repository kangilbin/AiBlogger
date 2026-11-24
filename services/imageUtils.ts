import * as ImageManipulator from 'expo-image-manipulator';

const cache = new Map<string, Promise<{ uri: string; base64: string }>>();

/** 지정 폭으로 리사이즈 + JPEG 압축 후 base64 반환. 같은 (uri,폭,품질)은 재사용 (재생성/재시도 시 재인코딩 방지) */
export function prepareImage(uri: string, width: number, quality = 0.8) {
  const key = `${uri}|${width}|${quality}`;
  let hit = cache.get(key);
  if (!hit) {
    hit = ImageManipulator.manipulateAsync(uri, [{ resize: { width } }], {
      compress: quality,
      format: ImageManipulator.SaveFormat.JPEG,
      base64: true,
    })
      .then((r) => ({ uri: r.uri, base64: r.base64 ?? '' }))
      .catch((e) => {
        cache.delete(key); // 실패는 캐시하지 않음
        throw e;
      });
    cache.set(key, hit);
  }
  return hit;
}

export function clearImageCache() {
  cache.clear();
}
