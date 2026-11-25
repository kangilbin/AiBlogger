import { uploadPublicImage } from './driveService';
import { createPost } from './bloggerService';
import { toHtml, normalizeBody, type MapTarget } from '@/utils/postFormat';
import type { PhotoEntry } from '@/types';

// 업로드 성공한 사진의 공개 URL 캐시 — 발행 재시도 시 Drive 중복 업로드 방지
const uploadedUrls = new Map<string, string>();

export function clearUploadCache() {
  uploadedUrls.clear();
}

export interface PublishParams {
  blogId: string;
  photos: PhotoEntry[];
  placeName: string;
  /** 지도에 표시할 검색어 (없으면 지도 생략) */
  mapTarget?: MapTarget;
  title: string;
  body: string;
  labels: string[];
  /** 사진별 AI 대체 텍스트 (없으면 사진 메모 → 장소명) */
  alts?: string[];
  onProgress?: (message: string) => void;
}

export interface PublishResult {
  id: string;
  url: string;
  title: string;
  body: string;
  thumbnailUrl: string;
}

/** 사진 업로드(병렬) → HTML 조립 → Blogger 게시 */
export async function publishToBlogger(p: PublishParams): Promise<PublishResult> {
  let done = 0;
  const report = () => p.onProgress?.(`사진 업로드 중 (${done}/${p.photos.length})`);
  report();

  const urls = await Promise.all(
    p.photos.map(async (photo, i) => {
      let url = uploadedUrls.get(photo.uri);
      if (!url) {
        url = await uploadPublicImage(photo.uri, `${Date.now()}_${i + 1}.jpg`);
        uploadedUrls.set(photo.uri, url);
      }
      done++;
      report();
      return url;
    })
  );

  p.onProgress?.('블로그에 발행 중');
  // 직접 수정하며 사진 마커가 지워졌어도 모든 사진이 게시되도록 보정
  const body = normalizeBody(p.body, p.photos.length);
  const title = p.title.trim() || p.placeName;
  const html = toHtml(body, urls, p.photos.map((x, i) => p.alts?.[i] || x.note || p.placeName), p.mapTarget, p.photos.map((x, i) => i > 0 && !!x.joinPrev));
  const res = await createPost(p.blogId, { title, html, labels: p.labels });

  return { ...res, title, body, thumbnailUrl: urls[0] ?? '' };
}
