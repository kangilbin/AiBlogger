const mockUpload = jest.fn();
const mockCreate = jest.fn();

jest.mock('@/services/driveService', () => ({ uploadPublicImage: (...a: unknown[]) => mockUpload(...a) }));
jest.mock('@/services/bloggerService', () => ({ createPost: (...a: unknown[]) => mockCreate(...a) }));

import { publishToBlogger, clearUploadCache } from '@/services/publishService';

const base = {
  blogId: 'b1',
  photos: [{ uri: 'p1', note: '' }, { uri: 'p2', note: '메모' }],
  placeName: '카페',
  title: '  ',
  body: '본문\n\n[[사진1]]', // 사진2 마커 누락
  labels: ['a'],
  isDraft: false,
};

beforeEach(() => {
  mockUpload.mockReset().mockImplementation(async (uri: string) => `https://img/${uri}`);
  mockCreate.mockReset().mockResolvedValue({ id: '1', url: 'https://post' });
  clearUploadCache();
});

describe('publishToBlogger', () => {
  it('누락된 사진 마커를 보정하고 빈 제목은 장소명으로 대체한다', async () => {
    const r = await publishToBlogger(base);
    const sent = mockCreate.mock.calls[0][1];
    expect(sent.title).toBe('카페');
    expect(sent.html).toContain('https://img/p1');
    expect(sent.html).toContain('https://img/p2');
    expect(r.thumbnailUrl).toBe('https://img/p1');
  });

  it('발행 재시도 시 이미 올린 사진은 다시 업로드하지 않는다', async () => {
    mockCreate.mockRejectedValueOnce(new Error('boom'));
    await expect(publishToBlogger(base)).rejects.toThrow('boom');
    expect(mockUpload).toHaveBeenCalledTimes(2);

    await publishToBlogger(base);
    expect(mockUpload).toHaveBeenCalledTimes(2); // 캐시 사용
    expect(mockCreate).toHaveBeenCalledTimes(2);
  });

  it('진행 상황을 콜백으로 알린다', async () => {
    const msgs: string[] = [];
    await publishToBlogger({ ...base, onProgress: (m) => msgs.push(m) });
    expect(msgs[0]).toContain('0/2');
    expect(msgs).toContain('사진 업로드 중 (2/2)');
    expect(msgs[msgs.length - 1]).toBe('블로그에 발행 중');
  });
});
