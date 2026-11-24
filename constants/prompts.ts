import type { PromptPreset } from '@/types';

export const BUILTIN_PRESETS: PromptPreset[] = [
  {
    id: 'friendly',
    name: '친근한 일상형',
    description: '친구에게 얘기하듯 편안한 ~해요체',
    builtin: true,
    prompt: `친구에게 수다 떨듯 편안하고 따뜻한 ~해요체로 씁니다.
- 이모지는 문단당 최대 1개, 과하지 않게 사용합니다.
- 문장은 짧게, 독자에게 말을 거는 표현("여러분도 가보시면 좋겠어요")을 한두 번 섞습니다.`,
  },
  {
    id: 'professional',
    name: '전문 리뷰어형',
    description: '객관적이고 항목별로 정리된 평가',
    builtin: true,
    prompt: `차분하고 객관적인 ~합니다체로 씁니다.
- 감탄사와 이모지는 쓰지 않고, 근거(사진에서 보이는 것, 사용자가 남긴 메모)를 들어 평가합니다.
- 감정 표현보다 관찰한 사실과 비교 기준을 앞세웁니다.`,
  },
  {
    id: 'humorous',
    name: '유머러스형',
    description: '재치 있는 비유와 드립이 섞인 가벼운 톤',
    builtin: true,
    prompt: `재치 있고 가벼운 구어체로 씁니다. 읽다가 피식 웃게 만드는 것이 목표입니다.
- 음식·공간을 과장된 비유로 묘사하되, 사실 정보는 왜곡하지 않습니다.
- 자기 자신을 약간 깎는 유머("점심 먹은 지 1시간인데 또 시켰다")를 한두 번 사용합니다.
- 아쉬운 점도 웃음으로 풀어내되 비꼬거나 비하하지 않습니다.`,
  },
  {
    id: 'honest',
    name: '솔직 후기형',
    description: '장점과 단점을 가감 없이, 정보 중심',
    builtin: true,
    prompt: `광고 같지 않은 솔직한 후기체(~했어요/~더라고요)로 씁니다.
- 좋았던 점과 아쉬웠던 점을 구체적인 디테일(양, 온도, 대기 시간, 청결, 응대 등)과 함께 가감 없이 적습니다.
- 칭찬만 늘어놓지 않고, 협찬 받은 글처럼 들리는 과장 표현을 피합니다.`,
  },
];

export const DEFAULT_PRESET_ID = 'friendly';
