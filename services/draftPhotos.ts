import { Directory, File, Paths } from 'expo-file-system';
import type { PhotoEntry } from '@/types';

/**
 * 미발행 글의 사진을 앱 영구 저장소(documentDirectory)로 복사한다.
 * 갤러리에서 고른 사진 URI는 임시(캐시) 경로라 앱 재시작/정리 시 사라져, 이력에서 다시 열면 사진이 깨진다.
 * 복사 실패한 사진은 원래 URI를 그대로 둔다.
 */
export async function persistPhotos(historyId: string, photos: PhotoEntry[]): Promise<PhotoEntry[]> {
  try {
    const dir = new Directory(Paths.document, 'drafts', historyId);
    dir.create({ idempotent: true, intermediates: true });
    return photos.map((p, i) => {
      try {
        if (p.uri.startsWith(dir.uri)) return p; // 이미 복사됨
        const dest = new File(dir, `${i + 1}_${Date.now()}.jpg`);
        new File(p.uri).copy(dest);
        return { ...p, uri: dest.uri };
      } catch {
        return p;
      }
    });
  } catch {
    return photos;
  }
}

export function deleteDraftPhotos(historyId: string) {
  try {
    const dir = new Directory(Paths.document, 'drafts', historyId);
    if (dir.exists) dir.delete();
  } catch {}
}
