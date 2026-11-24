import { IS_MOCK, KAKAO_REST_KEY } from '@/constants/config';
import { AppError } from './errors';
import type { PlaceInfo } from '@/types';

const MOCK_PLACES: PlaceInfo[] = [
  { name: '테스트 카페', address: '서울특별시 성동구 성수동', lat: 37.5446, lng: 127.0557 },
];

interface KakaoResponse {
  documents?: {
    place_name: string;
    address_name: string;
    road_address_name?: string;
    x: string; // 경도
    y: string; // 위도
    category_name?: string;
  }[];
}

/** 카카오 로컬 키워드 검색 — 한국 가게/장소 검색이 가장 정확하고 무료 */
async function searchKakao(query: string, signal?: AbortSignal): Promise<PlaceInfo[]> {
  const res = await fetch(
    `https://dapi.kakao.com/v2/local/search/keyword.json?size=8&query=${encodeURIComponent(query)}`,
    { signal, headers: { Authorization: `KakaoAK ${KAKAO_REST_KEY}` } }
  );
  if (res.status === 401 || res.status === 403) {
    throw new AppError('UNKNOWN', '카카오 키가 올바르지 않거나 카카오맵 사용 설정이 꺼져 있어요.');
  }
  if (!res.ok) throw new AppError('UNKNOWN', `장소 검색에 실패했어요 (${res.status})`);
  const j = (await res.json()) as KakaoResponse;
  return (j.documents ?? []).map((d) => ({
    name: d.place_name,
    address: d.road_address_name || d.address_name,
    lat: Number(d.y),
    lng: Number(d.x),
  }));
}

interface PhotonResponse {
  features?: {
    geometry: { coordinates: [number, number] };
    properties: { name?: string; street?: string; housenumber?: string; district?: string; city?: string; state?: string; country?: string };
  }[];
}

/** 키가 없을 때 쓰는 무료 대체: Photon(OpenStreetMap 기반, 입력하며 검색하는 용도로 만들어진 공개 서버). 등록 안 된 가게는 안 나올 수 있음 */
async function searchFree(query: string, signal?: AbortSignal): Promise<PlaceInfo[]> {
  const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=6&lang=default`;
  // 공개 무료 서버는 기본 접속 표시(okhttp)를 차단하므로 앱을 식별하는 User-Agent를 보낸다
  const res = await fetch(url, { signal, headers: { Accept: 'application/json', 'User-Agent': 'AIBlogerApp/1.0' } });
  if (!res.ok) throw new AppError('UNKNOWN', `장소 검색에 실패했어요 (${res.status})`);
  const j = (await res.json()) as PhotonResponse;
  return (j.features ?? [])
    .filter((f) => f.properties.name && f.geometry?.coordinates?.length === 2)
    .map((f) => {
      const p = f.properties;
      const address = [p.state, p.city, p.district, [p.street, p.housenumber].filter(Boolean).join(' ')]
        .filter((v, i, arr) => v && arr.indexOf(v) === i)
        .join(' ');
      return { name: p.name!, address, lat: f.geometry.coordinates[1], lng: f.geometry.coordinates[0] };
    });
}

export const hasKakaoSearch = !!KAKAO_REST_KEY;

/** 장소 검색 → 후보 목록. 네트워크 오류는 AppError */
export async function searchPlaces(query: string, signal?: AbortSignal): Promise<PlaceInfo[]> {
  const q = query.trim();
  if (q.length < 2) return [];
  if (IS_MOCK) return MOCK_PLACES;
  try {
    return KAKAO_REST_KEY ? await searchKakao(q, signal) : await searchFree(q, signal);
  } catch (e) {
    if ((e as Error).name === 'AbortError') throw e;
    if (e instanceof AppError) throw e;
    throw new AppError('NETWORK', '네트워크 연결을 확인해주세요.');
  }
}
