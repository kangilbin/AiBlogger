import { pickModels } from '@/services/modelSelector';

const m = (name: string, displayName?: string, methods = ['generateContent']) => ({
  name: `models/${name}`,
  displayName,
  supportedGenerationMethods: methods,
});

describe('pickModels', () => {
  it('선호 순서대로 실제 모델 ID를 반환한다', () => {
    const list = [
      m('gemini-3.1-flash-lite'),
      m('gemini-3.8-flash'),
      m('gemini-3.5-flash-lite'),
      m('gemini-3.6-flash'),
    ];
    expect(pickModels(list)).toEqual([
      'gemini-3.8-flash',
      'gemini-3.6-flash',
      'gemini-3.5-flash-lite',
      'gemini-3.1-flash-lite',
    ]);
  });

  it('ID가 달라도 표시 이름으로 찾는다', () => {
    expect(pickModels([m('flash-x7', 'Gemini 3.8 Flash')])).toEqual(['flash-x7']);
  });

  it('generateContent 미지원 모델과 없는 모델은 건너뛴다', () => {
    const list = [m('gemini-3.8-flash', undefined, ['embedContent']), m('gemini-3.6-flash')];
    expect(pickModels(list)).toEqual(['gemini-3.6-flash']);
  });

  it('preview 같은 변형 이름은 정확히 일치하지 않으면 고르지 않는다', () => {
    expect(pickModels([m('gemini-3.8-flash-preview')])).toEqual([]);
  });
});
