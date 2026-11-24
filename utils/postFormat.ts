export type PostBlock =
  | { type: 'heading'; text: string }
  | { type: 'paragraph'; text: string }
  | { type: 'quote'; text: string } // `> ` 인용/총평 강조
  | { type: 'list'; items: string[] } // `- ` 목록
  | { type: 'divider' } // `---` 구분선
  | { type: 'photo'; index: number } // 0-based
  | { type: 'gallery'; indices: number[] }; // 한 묶음으로 보여줄 사진들 (0-based)

/** joinPrev 플래그로 사진을 묶음으로 나눈다. 예) [F,T,T,F] → [[0,1,2],[3]] */
export function photoGroups(joins: boolean[]): number[][] {
  const groups: number[][] = [];
  joins.forEach((join, i) => {
    if (join && groups.length) groups[groups.length - 1].push(i);
    else groups.push([i]);
  });
  return groups;
}

/** 본문 블록을 만들되, 같은 묶음의 사진은 첫 마커 위치에 갤러리 하나로 모으고 나머지 마커는 제거 */
export function layoutBlocks(body: string, joins: boolean[] = []): PostBlock[] {
  const groupOf = new Map<number, number[]>();
  for (const g of photoGroups(joins)) if (g.length > 1) g.forEach((i) => groupOf.set(i, g));
  const done = new Set<number>();
  const out: PostBlock[] = [];
  for (const b of parseBody(body)) {
    if (b.type !== 'photo') {
      out.push(b);
      continue;
    }
    const g = groupOf.get(b.index);
    if (!g) {
      out.push(b);
    } else if (!done.has(g[0])) {
      g.forEach((i) => done.add(i));
      out.push({ type: 'gallery', indices: g });
    }
  }
  return out;
}

const MARKER = /\[\[사진(\d+)\]\]/g;

/** 마커 정리: 범위 밖/중복 제거, 빠진 사진은 말미에 추가 */
export function normalizeBody(body: string, photoCount: number): string {
  const seen = new Set<number>();
  let text = body.replace(MARKER, (_, n) => {
    const i = Number(n);
    if (i < 1 || i > photoCount || seen.has(i)) return '';
    seen.add(i);
    return `[[사진${i}]]`;
  });
  const missing: string[] = [];
  for (let i = 1; i <= photoCount; i++) if (!seen.has(i)) missing.push(`[[사진${i}]]`);
  if (missing.length) text = `${text.trim()}\n\n${missing.join('\n\n')}`;
  return spaceBlocks(text);
}

type LineKind = 'h' | 'm' | 'hr' | 'q' | 'li' | 'p';
const kindOf = (l: string): LineKind =>
  /^##\s/.test(l) ? 'h'
  : /^\[\[사진\d+\]\]$/.test(l) ? 'm'
  : /^---+$/.test(l) ? 'hr'
  : /^>\s?/.test(l) ? 'q'
  : /^[-•]\s+/.test(l) ? 'li'
  : 'p';

/** 소제목·사진·구분선은 앞뒤 빈 줄로 분리, 인용/목록/문단은 종류가 바뀔 때 분리, 연속 빈 줄은 하나로 (블로그 가독성) */
export function spaceBlocks(text: string): string {
  const out: string[] = [];
  let prev: LineKind | null = null;
  for (const raw of text.split('\n')) {
    const line = raw.trim();
    if (!line) continue;
    const k = kindOf(line);
    if (prev && (k !== prev || k === 'h' || k === 'm' || k === 'hr')) out.push('');
    out.push(line);
    prev = k;
  }
  return out.join('\n').trim();
}

/** **굵게** 를 조각으로 나눈다 */
export function inlineSegments(text: string): { text: string; bold: boolean }[] {
  const out: { text: string; bold: boolean }[] = [];
  text.split(/\*\*(.+?)\*\*/g).forEach((t, i) => {
    if (t) out.push({ text: t, bold: i % 2 === 1 });
  });
  return out;
}

export function parseBody(body: string): PostBlock[] {
  const blocks: PostBlock[] = [];
  for (const raw of body.split(/\n{2,}/)) {
    const chunk = raw.trim();
    if (!chunk) continue;
    // 한 덩어리 안에 마커가 섞여 있으면 분리
    const parts = chunk.split(/(\[\[사진\d+\]\])/).map((s) => s.trim()).filter(Boolean);
    for (const part of parts) {
      const m = /^\[\[사진(\d+)\]\]$/.exec(part);
      if (m) {
        blocks.push({ type: 'photo', index: Number(m[1]) - 1 });
        continue;
      }
      // 한 덩어리 안에서도 줄 종류(소제목/구분선/인용/목록/문단)별로 블록을 나눈다
      let para: string[] = [];
      let quote: string[] = [];
      let items: string[] = [];
      const flush = () => {
        if (para.length) blocks.push({ type: 'paragraph', text: para.join('\n') });
        if (quote.length) blocks.push({ type: 'quote', text: quote.join('\n') });
        if (items.length) blocks.push({ type: 'list', items });
        para = []; quote = []; items = [];
      };
      for (const line of part.split('\n')) {
        const l = line.trim();
        if (!l) continue;
        const k = kindOf(l);
        if (k !== 'p') { if (para.length) flush(); }
        if (k !== 'q') { if (quote.length) flush(); }
        if (k !== 'li') { if (items.length) flush(); }
        if (k === 'h') blocks.push({ type: 'heading', text: l.slice(3).trim() });
        else if (k === 'hr') blocks.push({ type: 'divider' });
        else if (k === 'q') quote.push(l.replace(/^>\s?/, ''));
        else if (k === 'li') items.push(l.replace(/^[-•]\s+/, ''));
        else para.push(l);
      }
      flush();
    }
  }
  return blocks;
}

const esc = (s: string) =>
  s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

/** 지도에 표시할 대상. 좌표가 있으면 정확한 위치, 없으면 이름으로 검색 */
export interface MapTarget {
  label: string;
  lat?: number;
  lng?: number;
}

const hasCoords = (t: MapTarget) => typeof t.lat === 'number' && typeof t.lng === 'number';

/** 구글 지도 임베드용 q 값. 좌표+이름이면 핀에 이름이 표시됨 */
export const mapEmbedQuery = (t: MapTarget) =>
  // 이름 속 괄호(예: "스타벅스 (성수점)")는 q=좌표(이름) 문법을 깨뜨리므로 공백으로 바꾼다
  hasCoords(t) ? `${t.lat},${t.lng}(${t.label.replace(/[()]/g, ' ').replace(/\s+/g, ' ').trim()})` : t.label;

export const mapLink = (t: MapTarget) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(hasCoords(t) ? `${t.lat},${t.lng}` : t.label)}`;

/** 지도 임베드 블록 (API 키 불필요한 Google Maps 임베드 + 지도 앱 링크) */
export function mapHtml(t: MapTarget): string {
  const src = `https://maps.google.com/maps?q=${encodeURIComponent(mapEmbedQuery(t))}&hl=ko&z=17&output=embed`;
  return [
    `<div style="margin:24px 0">`,
    `<h3>📍 위치</h3>`,
    `<iframe src="${esc(src)}" width="100%" height="320" style="border:0;border-radius:8px" loading="lazy" allowfullscreen></iframe>`,
    `<p style="text-align:center"><a href="${esc(mapLink(t))}" target="_blank" rel="noopener">구글 지도에서 '${esc(t.label)}' 보기</a></p>`,
    `</div>`,
  ].join('\n');
}

// 블로그 가독성용 간격: 사진 위는 넓게, 아래(사진 설명 글)는 좁게 붙여 사진-글이 한 덩어리로 읽히게 한다
const P_STYLE = 'margin:0 0 22px;line-height:1.9;word-break:keep-all';
const H3_STYLE = 'margin:48px 0 16px;padding-bottom:8px;border-bottom:1px solid #e5e0f0;line-height:1.5';
const QUOTE_STYLE = 'margin:28px 0;padding:16px 20px;background:#f4f1fb;border-left:4px solid #8b7ad6;border-radius:8px;line-height:1.8';
const LIST_STYLE = 'margin:0 0 22px;padding-left:22px;line-height:1.8';
const HR_STYLE = 'margin:40px 0;border:0;border-top:1px solid #e5e0f0';
const inlineHtml = (t: string) => esc(t).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br />');
const PHOTO_MARGIN = '44px 0 14px';

const photoImg = (url: string, alt: string, style: string) =>
  `<img src="${esc(url)}" alt="${esc(alt)}" style="${style}" />`;

/** Blogger 게시용 HTML. photoUrls[i]는 i번째 사진의 공개 URL. map이 있으면 끝에 지도, joins로 묶음 사진을 갤러리로 */
export function toHtml(
  body: string,
  photoUrls: string[],
  photoAlts: string[] = [],
  map?: MapTarget,
  joins: boolean[] = []
): string {
  const html = layoutBlocks(body, joins)
    .map((b) => {
      if (b.type === 'heading') return `<h3 style="${H3_STYLE}">${esc(b.text)}</h3>`;
      if (b.type === 'paragraph') return `<p style="${P_STYLE}">${inlineHtml(b.text)}</p>`;
      if (b.type === 'quote')
        return `<blockquote style="${QUOTE_STYLE}">${inlineHtml(b.text)}</blockquote>`;
      if (b.type === 'list')
        return `<ul style="${LIST_STYLE}">${b.items.map((it) => `<li style="margin:0 0 8px">${inlineHtml(it)}</li>`).join('')}</ul>`;
      if (b.type === 'divider') return `<hr style="${HR_STYLE}" />`;
      if (b.type === 'gallery') {
        const imgs = b.indices
          .filter((i) => photoUrls[i])
          .map((i) => photoImg(photoUrls[i], photoAlts[i] ?? '', 'width:100%;height:100%;object-fit:cover;border-radius:8px;display:block'));
        if (!imgs.length) return '';
        // 홀수 장이면 첫 장을 가로 전체로 크게
        const cells = imgs
          .map((img, k) => `<div style="flex:1 1 calc(50% - 4px);min-width:calc(50% - 4px);${imgs.length % 2 && k === 0 ? 'flex-basis:100%;' : ''}aspect-ratio:${imgs.length % 2 && k === 0 ? '16/9' : '1/1'};overflow:hidden">${img}</div>`)
          .join('');
        return `<div style="display:flex;flex-wrap:wrap;gap:8px;margin:${PHOTO_MARGIN}">${cells}</div>`;
      }
      const url = photoUrls[b.index];
      if (!url) return '';
      return `<div style="text-align:center;margin:${PHOTO_MARGIN}">${photoImg(url, photoAlts[b.index] ?? '', 'max-width:100%;height:auto;border-radius:8px')}</div>`;
    })
    .join('\n');
  return map ? `${html}\n${mapHtml(map)}` : html;
}
