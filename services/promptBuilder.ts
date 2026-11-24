import type { PhotoEntry, PromptPreset } from '@/types';
import { photoGroups } from '@/utils/postFormat';

export interface PostInput {
  photos: PhotoEntry[];
  placeName: string;
  /** 장소 검색으로 고른 주소 (있으면 글 작성에 참고) */
  placeAddress?: string;
  rating: number; // 1~5
  summary: string; // 한줄평
  notes: string; // 특이사항
  preset: PromptPreset;
  extraPrompt: string;
}

/** 별점에 따라 글 전체의 감정선·비중을 정하는 지침 */
export function sentimentGuide(rating: number): string {
  if (rating <= 1)
    return '별점 1점: 매우 실망스러운 방문이었습니다. 불만 사항을 분명하게, 그러나 감정적 비난 없이 근거와 함께 서술하고 재방문/추천 의사가 낮음을 솔직하게 밝히세요. 장점은 있어도 짧게만 언급하세요.';
  if (rating <= 2)
    return '별점 2점: 전반적으로 아쉬운 방문이었습니다. 아쉬운 점이 글의 중심이며, 사진에서 그 근거가 보이면 짚어주세요. 좋았던 점은 짧게 균형만 맞추세요.';
  if (rating <= 3)
    return '별점 3점: 평범/호불호 갈리는 방문입니다. 좋았던 점과 아쉬운 점을 비슷한 비중으로 다루고, 어떤 사람에게 맞을지 판단 기준을 제시하세요.';
  if (rating <= 4)
    return '별점 4점: 만족스러운 방문입니다. 장점을 중심으로 쓰되 사소한 아쉬움 한 가지는 솔직하게 덧붙이세요.';
  return '별점 5점: 매우 만족스러운 방문입니다. 좋았던 이유를 사진 속 디테일로 구체적으로 풀어내고 적극 추천하세요. 단, 과장 광고처럼 보이지 않게 하세요.';
}

export function buildSystemPrompt(input: PostInput): string {
  return `당신은 맛집·카페·여행 후기를 10년간 꾸준히 써온 블로거입니다. 지금은 사용자가 직접 방문한 장소의 후기를 사용자의 이름으로 대신 씁니다. 한국어로 작성합니다.
오랜 경력은 문체, 글의 구성, 독자가 궁금해할 정보를 고르는 감각에만 반영하세요. 사용자가 주지 않은 경험·방문 횟수·비교 경험을 지어내서는 안 됩니다.

[글쓰기 스타일 — 반드시 이 스타일을 따르세요]
${input.preset.prompt.trim()}

[감정/평가 톤]
${sentimentGuide(input.rating)}

[사실 준수 규칙]
- 사진에서 실제로 보이는 것과 사용자가 적어준 정보만 근거로 씁니다. 보이지 않는 메뉴명·가격·영업시간·위치 등은 지어내지 마세요.
- 사용자의 한줄평·특이사항·사진별 메모는 반드시 본문에 자연스럽게 반영합니다. 특히 부정적인 특이사항(지저분함, 불친절, 긴 대기 등)은 해당 사진을 근거로 구체적으로 언급하세요.
- 별점과 어긋나는 평가를 하지 마세요.

[출력 형식]
- JSON으로만 답하세요: { "title": 제목, "body": 본문, "labels": 해시태그 없는 라벨 3~6개 }
- body는 평문입니다. 문단은 빈 줄로 구분하고, 소제목이 필요하면 줄 앞에 "## "를 붙입니다. 마크다운 굵게/목록 문법은 쓰지 마세요.
- 사진은 제공된 순서(사진1, 사진2, …)를 지켜 글 흐름에 맞는 위치에 단독 줄로 [[사진N]] 마커를 넣습니다. 모든 사진을 정확히 한 번씩 사용하세요.
- 사용자가 "묶음"으로 지정한 사진들은 한 장면(예: 같은 메뉴의 여러 컷)이며 갤러리로 한꺼번에 게시됩니다. 묶음의 마커들은 같은 자리에 연달아 두고, 본문에서는 그 묶음을 하나의 대상으로 함께 설명하세요.`;
}

/** 묶음 사진 안내 문구. 묶음이 없으면 빈 문자열 */
export function groupSummary(photos: PhotoEntry[]): string {
  const groups = photoGroups(photos.map((p, i) => i > 0 && !!p.joinPrev)).filter((g) => g.length > 1);
  if (!groups.length) return '';
  const label = (g: number[]) => `사진${g[0] + 1}~${g[g.length - 1] + 1}`;
  return `묶음 사진: ${groups.map(label).join(', ')} (각각 하나의 묶음으로 함께 게시됨)`;
}

export function buildUserText(input: PostInput): string {
  const lines = [
    `장소명: ${input.placeName}`,
    input.placeAddress && `위치(주소): ${input.placeAddress}`,
    `별점: ${input.rating}/5`,
    input.summary.trim() && `한줄평: ${input.summary.trim()}`,
    input.notes.trim() && `특이사항: ${input.notes.trim()}`,
    input.extraPrompt.trim() && `추가 요청: ${input.extraPrompt.trim()}`,
    `사진 ${input.photos.length}장이 촬영 순서대로 이어집니다.`,
    groupSummary(input.photos),
  ];
  return lines.filter(Boolean).join('\n');
}
