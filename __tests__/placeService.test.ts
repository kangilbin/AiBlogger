jest.mock('@/constants/config', () => ({ IS_MOCK: false, KAKAO_REST_KEY: '' }));

import { searchPlaces } from '@/services/placeService';

const mockFetch = jest.fn();
beforeEach(() => {
  mockFetch.mockReset();
  (global as any).fetch = mockFetch;
});

describe('searchPlaces (키 없음 → 무료 Photon 검색)', () => {
  it('두 글자 미만은 검색하지 않는다', async () => {
    expect(await searchPlaces('a')).toEqual([]);
    expect(mockFetch).not.toHaveBeenCalled();
  });
  it('결과를 좌표가 있는 장소 목록으로 바꾼다', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        features: [
          {
            geometry: { coordinates: [127.1, 37.5] },
            properties: { name: '카페A', street: '아차산로9길', district: '성수2가3동', city: '서울특별시' },
          },
        ],
      }),
    });
    const r = await searchPlaces('카페A');
    expect(r).toEqual([{ name: '카페A', address: '서울특별시 성수2가3동 아차산로9길', lat: 37.5, lng: 127.1 }]);
    expect(mockFetch.mock.calls[0][0]).toContain('photon');
  });
  it('서버 오류는 에러로 전달한다', async () => {
    mockFetch.mockResolvedValue({ ok: false, status: 500, json: async () => ({}) });
    await expect(searchPlaces('카페A')).rejects.toThrow('500');
  });
  it('네트워크 실패는 NETWORK 에러', async () => {
    mockFetch.mockRejectedValue(new Error('x'));
    await expect(searchPlaces('카페A')).rejects.toMatchObject({ code: 'NETWORK' });
  });
});
