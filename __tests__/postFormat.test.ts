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
    expect(html.indexOf('>본문</p>')).toBeLessThan(html.indexOf('<iframe'));
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


describe('소제목 줄바꿈', () => {
  it('소제목 바로 아래 본문이 이어져도 소제목과 문단으로 분리된다', () => {
    const { parseBody } = require('@/utils/postFormat');
    expect(parseBody('## 제목\n본문 첫줄\n본문 둘째줄')).toEqual([
      { type: 'heading', text: '제목' },
      { type: 'paragraph', text: '본문 첫줄\n본문 둘째줄' },
    ]);
  });
  it('normalizeBody가 소제목/마커 앞뒤에 빈 줄을 넣는다', () => {
    const { normalizeBody } = require('@/utils/postFormat');
    expect(normalizeBody('도입\n## 제목\n본문\n[[사진1]]\n마무리', 1)).toBe('도입\n\n## 제목\n\n본문\n\n[[사진1]]\n\n마무리');
  });
});


describe('가벼운 마크업', () => {
  const { parseBody, toHtml, normalizeBody } = require('@/utils/postFormat');
  it('인용/목록/구분선을 블록으로 파싱한다', () => {
    expect(parseBody('> 총평\n- a\n- b\n---\n본문')).toEqual([
      { type: 'quote', text: '총평' },
      { type: 'list', items: ['a', 'b'] },
      { type: 'divider' },
      { type: 'paragraph', text: '본문' },
    ]);
  });
  it('**굵게**는 strong으로, HTML은 이스케이프된다', () => {
    const html = toHtml('**메뉴** <b>x</b>', []);
    expect(html).toContain('<strong>메뉴</strong>');
    expect(html).toContain('&lt;b&gt;');
  });
  it('인용/목록/구분선 HTML이 만들어진다', () => {
    const html = toHtml('> 총평\n\n- a\n- b\n\n---', []);
    expect(html).toContain('<blockquote');
    expect(html).toContain('<ul');
    expect(html).toContain('<hr');
  });
  it('normalizeBody가 종류가 바뀌는 곳에 빈 줄을 넣는다', () => {
    expect(normalizeBody('문단\n- a\n- b\n> q\n---\n끝', 0)).toBe('문단\n\n- a\n- b\n\n> q\n\n---\n\n끝');
  });
});
