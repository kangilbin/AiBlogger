export const IS_MOCK = process.env.EXPO_PUBLIC_USE_MOCK === 'true';

/** 장소 검색용 카카오 로컬 API REST 키 (없으면 무료 공개 검색으로 대체). developers.kakao.com에서 발급 */
export const KAKAO_REST_KEY = process.env.EXPO_PUBLIC_KAKAO_REST_KEY ?? '';
