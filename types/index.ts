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
}

export type PublishStatus = 'draft' | 'published';

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
  createdAt: string;
}
