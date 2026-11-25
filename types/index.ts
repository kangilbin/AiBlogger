export interface User {
  name: string;
  email: string;
  photo: string;
}

/** 글쓰기 스타일 프롬프트 (기본 4종 + 사용자 정의) */
export interface PromptPreset {
  id: string;
  name: string;
  description: string;
  prompt: string;
  builtin: boolean;
}

/** 사용자가 순서대로 넣는 사진 한 장 + 그 사진에 대한 메모 */
export interface PhotoEntry {
  uri: string;
  note: string;
  /** true면 바로 앞 사진과 한 묶음(갤러리)으로 게시 */
  joinPrev?: boolean;
}

/** 장소 검색으로 고른 장소 (지도 표시용 좌표 포함) */
export interface PlaceInfo {
  name: string;
  address: string;
  lat: number;
  lng: number;
}

export interface BlogInfo {
  id: string;
  name: string;
  url: string;
}

export interface GeneratedPost {
  title: string;
  /** 본문. 문단은 빈 줄로 구분, `## ` 소제목, `[[사진N]]` 사진 위치 마커 */
  body: string;
  labels: string[];
  /** 사진별 대체 텍스트(alt), 사진 순서대로. 검색 노출·접근성용 */
  alts?: string[];
}

/** 글 분류 테마. 발행 시 Blogger 라벨로 붙음(상위: '여행', 하위 선택 시: '여행/국내') */
export interface Theme {
  id: string;
  name: string;
  subs: { id: string; name: string }[];
}

/** generated: AI가 작성만 한 미발행 글(이어서 수정/발행 가능)published: 발행 */
export type PublishStatus = 'generated' | 'published';

/** 미발행 글을 그대로 다시 열기 위한 입력/사진 스냅샷 */
export interface PostSnapshot {
  photos: PhotoEntry[];
  place: PlaceInfo | null;
  showMap: boolean;
  summary: string;
  notes: string;
  extraPrompt: string;
  customTitle?: string;
}

export interface PostHistory {
  id: string;
  placeName: string;
  rating: number;
  thumbnailUri: string;
  title: string;
  body: string;
  labels: string[];
  publishStatus: PublishStatus;
  postUrl?: string;
  /** 미발행(generated) 글을 이어서 편집할 때 복원하는 데이터 */
  snapshot?: PostSnapshot;
  /** 사진별 대체 텍스트 */
  alts?: string[];
  createdAt: string;
}
