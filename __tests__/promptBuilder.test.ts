import { buildSystemPrompt, buildUserText, sentimentGuide, type PostInput } from '@/services/promptBuilder';

const input: PostInput = {
  photos: [
    { uri: 'a', note: '테이블이 끈적' },
    { uri: 'b', note: '' },
  ],
  placeName: '성수 카페',
  rating: 2,
  summary: '불친절',
  notes: '매장이 지저분',
  extraPrompt: '',
  preset: { id: 'x', name: 'x', description: '', builtin: false, prompt: '반말로 쓴다' },
};

describe('sentimentGuide', () => {
  it.each([1, 2, 3, 4, 5])('별점 %i점마다 서로 다른 지침을 반환한다', (r) => {
    expect(sentimentGuide(r)).toContain(`별점 ${r}점`);
  });
  it('낮은 별점은 아쉬운 점 중심이다', () => {
    expect(sentimentGuide(2)).toContain('아쉬운 점이 글의 중심');
  });
});

describe('buildSystemPrompt', () => {
  it('사용자 스타일 프롬프트와 별점 지침을 포함한다', () => {
    const p = buildSystemPrompt(input);
    expect(p).toContain('반말로 쓴다');
    expect(p).toContain('별점 2점');
    expect(p).toContain('[[사진N]]');
  });
});

describe('buildUserText', () => {
  it('값이 있는 항목만 포함한다', () => {
    const t = buildUserText(input);
    expect(t).toContain('장소명: 성수 카페');
    expect(t).toContain('한줄평: 불친절');
    expect(t).toContain('특이사항: 매장이 지저분');
    expect(t).not.toContain('추가 요청');
    expect(t).toContain('사진 2장');
  });
});

describe('묶음 사진 안내', () => {
  const { groupSummary } = require('@/services/promptBuilder');
  it('묶음이 있으면 범위를 알려준다', () => {
    const photos = [
      { uri: 'a', note: '' },
      { uri: 'b', note: '', joinPrev: true },
      { uri: 'c', note: '', joinPrev: true },
      { uri: 'd', note: '' },
    ];
    expect(groupSummary(photos)).toContain('사진1~3');
  });
  it('묶음이 없으면 빈 문자열', () => {
    expect(groupSummary([{ uri: 'a', note: '' }, { uri: 'b', note: '' }])).toBe('');
  });
});

describe('주소 전달', () => {
  const { buildUserText } = require('@/services/promptBuilder');
  const base = { photos: [], placeName: '카페A', rating: 4, summary: '', notes: '', extraPrompt: '', preset: { id: 'x', name: 'x', description: '', prompt: 'p', builtin: true } };
  it('주소가 있으면 사용자 텍스트에 포함한다', () => {
    expect(buildUserText({ ...base, placeAddress: '서울 성동구 아차산로9길 8' })).toContain('위치(주소): 서울 성동구 아차산로9길 8');
  });
  it('주소가 없으면 위치 줄이 없다', () => {
    expect(buildUserText(base)).not.toContain('위치(주소)');
  });
});
