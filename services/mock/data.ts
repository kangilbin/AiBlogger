import type { GeneratedPost, User } from '@/types';

export const MOCK_USER: User = {
  name: '김테스트',
  email: 'test@gmail.com',
  photo: 'https://i.pravatar.cc/150?img=3',
};

export const MOCK_BLOG = { id: 'mock-blog', name: '테스트 블로그', url: 'https://example.blogspot.com' };

export const MOCK_GENERATED: GeneratedPost = {
  title: '성수동 카페 방문기 - 분위기는 좋았지만 아쉬움도 남았던 날',
  body: `지난 주말, 저장해두었던 성수동 카페에 드디어 다녀왔어요.

## 첫인상

[[사진1]]

빈티지 창고를 개조한 외관이 인상적이었어요. 다만 입구 쪽이 조금 어수선해서 첫인상은 반반이었습니다.

## 메뉴와 맛

[[사진2]]

시그니처 라떼는 크림이 부드럽고 균형이 좋았어요.

## 총평

분위기 대비 관리 상태가 아쉬웠지만, 커피 맛만큼은 만족스러웠습니다.`,
  labels: ['성수동카페', '카페투어', '서울카페'],
};
