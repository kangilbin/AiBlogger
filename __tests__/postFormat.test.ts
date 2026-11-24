import { normalizeBody, parseBody, toHtml } from '@/utils/postFormat';

describe('normalizeBody', () => {
  it('빠진 사진 마커를 말미에 추가한다', () => {
    const out = normalizeBody('본문\n\n[[사진1]]', 3);
    expect(out).toContain('[[사진2]]');
    expect(out).toContain('[[사진3]]');
  });

  it('중복·범위 밖 마커를 제거한다', () => {
    const out = normalizeBody('[[사진1]]\n\n글\n\n[[사진1]]\n\n[[사진9]]', 2);
    expect(out.match(/\[\[사진1\]\]/g)).toHaveLength(1);
    expect(out).not.toContain('[[사진9]]');
    expect(out).toContain('[[사진2]]');
  });

  it('사진이 0장이면 마커를 모두 지운다', () => {
    expect(normalizeBody('글[[사진1]]', 0)).toBe('글');
  });
});

describe('parseBody', () => {
  it('제목/문단/사진 블록으로 나눈다', () => {
    const blocks = parseBody('## 소제목\n\n문단\n\n[[사진2]]');
    expect(blocks).toEqual([
      { type: 'heading', text: '소제목' },
      { type: 'paragraph', text: '문단' },
      { type: 'photo', index: 1 },
    ]);
  });

  it('문단 안에 섞인 마커를 분리한다', () => {
    const blocks = parseBody('앞 문장\n[[사진1]]\n뒷 문장');
    expect(blocks.map((b) => b.type)).toEqual(['paragraph', 'photo', 'paragraph']);
  });
});

describe('toHtml', () => {
  it('HTML을 이스케이프하고 사진 URL을 삽입한다', () => {
    const html = toHtml('<script>alert(1)</script>\n\n[[사진1]]', ['https://x/y.jpg'], ['"alt"']);
    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
    expect(html).toContain('src="https://x/y.jpg"');
    expect(html).toContain('alt="&quot;alt&quot;"' );
  });

  it('URL이 없는 사진은 건너뛴다', () => {
    expect(toHtml('[[사진2]]', ['a'])).toBe('');
  });
});

describe('지도 첨부', () => {
  const { toHtml, mapEmbedQuery, mapLink, mapHtml } = require('@/utils/postFormat');
  it('좌표가 있으면 좌표+이름으로, 없으면 이름으로 검색한다', () => {
    expect(mapEmbedQuery({ label: '카페A', lat: 37.5, lng: 127.1 })).toBe('37.5,127.1(카페A)');
    expect(mapEmbedQuery({ label: '카페A' })).toBe('카페A');
    expect(mapLink({ label: '카페A', lat: 37.5, lng: 127.1 })).toContain(encodeURIComponent('37.5,127.1'));
  });
  it('map을 주면 iframe과 링크가 끝에 붙고 값이 이스케이프된다', () => {
    const html = toHtml('본문', [], [], { label: '카페"<b>' });
    expect(html).toContain('<iframe');
    expect(html).toContain('maps.google.com/maps?q=');
    expect(html).not.toContain('<b>');
    expect(html.indexOf('<p>본문</p>')).toBeLessThan(html.indexOf('<iframe'));
  });
  it('map이 없으면 지도 없음', () => {
    expect(toHtml('본문', [])).not.toContain('iframe');
    expect(mapHtml({ label: 'a' })).toContain('output=embed');
  });
});

describe('사진 묶음', () => {
  const { photoGroups, layoutBlocks, toHtml } = require('@/utils/postFormat');
  it('joinPrev 플래그로 묶음을 만든다', () => {
    expect(photoGroups([false, true, true, false])).toEqual([[0, 1, 2], [3]]);
    expect(photoGroups([false, false])).toEqual([[0], [1]]);
  });
  it('묶음은 첫 마커 자리에 갤러리 하나로 모이고 흩어진 마커는 제거된다', () => {
    const body = '[[사진1]]\n\n본문\n\n[[사진2]]\n\n[[사진3]]';
    const blocks = layoutBlocks(body, [false, true, false]);
    expect(blocks.map((b: any) => b.type)).toEqual(['gallery', 'paragraph', 'photo']);
    expect((blocks[0] as any).indices).toEqual([0, 1]);
  });
  it('갤러리 HTML에 묶음 사진이 모두 들어간다', () => {
    const html = toHtml('[[사진1]]\n\n[[사진2]]', ['u1', 'u2'], ['a', 'b'], undefined, [false, true]);
    expect(html).toContain('display:flex');
    expect(html).toContain('src="u1"');
    expect(html).toContain('src="u2"');
    expect(html.match(/<img/g)).toHaveLength(2);
  });
  it('묶음이 없으면 기존처럼 사진 단독 블록', () => {
    expect(toHtml('[[사진1]]', ['u1'])).not.toContain('display:flex');
  });
});

describe('지도 이름 특수문자', () => {
  const { mapEmbedQuery } = require('@/utils/postFormat');
  it('이름 속 괄호는 임베드 질의에서 제거된다', () => {
    expect(mapEmbedQuery({ label: '스타벅스 (성수점)', lat: 37.5, lng: 127.1 })).toBe('37.5,127.1(스타벅스 성수점)');
  });
});
