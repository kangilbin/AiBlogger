jest.mock('@/constants/config', () => ({ IS_MOCK: false, KAKAO_REST_KEY: 'test-key' }));

import { searchPlaces } from '@/services/placeService';

const mockFetch = jest.fn();
beforeEach(() => {
  mockFetch.mockReset();
  (global as any).fetch = mockFetch;
});

describe('searchPlaces (카카오 키 있음)', () => {
  it('카카오 결과를 좌표(위도=y, 경도=x)가 있는 장소로 바꾸고 키를 헤더로 보낸다', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        documents: [
          { place_name: '카페 어니언 성수', address_name: '서울 성동구 성수동2가', road_address_name: '서울 성동구 아차산로9길 8', x: '127.0582', y: '37.5447' },
        ],
      }),
    });
    const r = await searchPlaces('어니언 성수');
    expect(r).toEqual([{ name: '카페 어니언 성수', address: '서울 성동구 아차산로9길 8', lat: 37.5447, lng: 127.0582 }]);
    const [url, init] = mockFetch.mock.calls[0];
    expect(url).toContain('dapi.kakao.com');
    expect(init.headers.Authorization).toBe('KakaoAK test-key');
  });
  it('키가 거부되면 안내 문구로 에러를 낸다', async () => {
    mockFetch.mockResolvedValue({ ok: false, status: 401, json: async () => ({}) });
    await expect(searchPlaces('카페')).rejects.toThrow('카카오');
  });
});
