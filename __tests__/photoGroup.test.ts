import { joinPhotoTo, removePhotoAt, moveGroup, groupsOf } from '@/utils/photoGroup';
import type { PhotoEntry } from '@/types';

/** 'a','b!','c' 처럼 쓰면 끝에 !가 있는 사진은 앞 사진과 묶임 */
const make = (spec: string[]): PhotoEntry[] =>
  spec.map((s) => ({ uri: s.replace('!', ''), note: '', joinPrev: s.endsWith('!') }));
const show = (photos: PhotoEntry[]) => groupsOf(photos).map((g) => g.map((i) => photos[i].uri).join(''));

describe('joinPhotoTo', () => {
  it('단독 사진을 다른 단독 사진에 묶는다', () => {
    expect(show(joinPhotoTo(make(['a', 'b', 'c']), 2, 0))).toEqual(['ac', 'b']);
  });

  it('요청 시나리오: 1 단독, 2·3 묶음, 4 단독, 5·6 묶음', () => {
    let p = make(['1', '2', '3', '4', '5', '6']);
    p = joinPhotoTo(p, 2, 1); // 3을 2에
    p = joinPhotoTo(p, 5, 4); // 6을 5에
    expect(show(p)).toEqual(['1', '23', '4', '56']);
  });

  it('묶음의 첫 사진을 빼도 남은 사진이 앞 묶음에 붙지 않는다', () => {
    // [a][bcd]에서 b를 e에 묶기 → c,d는 a와 합쳐지면 안 됨
    const p = joinPhotoTo(make(['a', 'b', 'c!', 'd!', 'e']), 1, 4);
    expect(show(p)).toEqual(['a', 'cd', 'eb']);
  });

  it('묶음 중간 사진을 빼도 나머지 묶음은 유지된다', () => {
    const p = joinPhotoTo(make(['a', 'b!', 'c!', 'd']), 1, 3);
    expect(show(p)).toEqual(['ac', 'db']);
  });

  it('같은 묶음 안에서는 변화 없음', () => {
    const p = make(['a', 'b!', 'c!']);
    expect(joinPhotoTo(p, 0, 2)).toBe(p);
  });
});

describe('removePhotoAt', () => {
  it('묶음 첫 사진 삭제 시 다음 사진이 앞 묶음에 붙지 않는다', () => {
    expect(show(removePhotoAt(make(['a', 'b', 'c!']), 1))).toEqual(['a', 'c']);
  });
});

describe('moveGroup', () => {
  it('묶음 단위로 위치를 바꾼다', () => {
    expect(show(moveGroup(make(['a', 'b', 'c!', 'd']), 3, -1))).toEqual(['a', 'd', 'bc']);
    expect(show(moveGroup(make(['a', 'b', 'c!', 'd']), 0, 1))).toEqual(['bc', 'a', 'd']);
  });

  it('맨 앞/뒤에서는 변화 없음', () => {
    const p = make(['a', 'b']);
    expect(moveGroup(p, 0, -1)).toBe(p);
    expect(moveGroup(p, 1, 1)).toBe(p);
  });
});
