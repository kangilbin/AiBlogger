import type { PhotoEntry } from '@/types';
import { photoGroups } from '@/utils/postFormat';

const joinsOf = (photos: PhotoEntry[]) => photos.map((p, i) => i > 0 && !!p.joinPrev);

/** 사진들을 묶음(연속 구간) 단위로 나눈다. 예) [F,T,T,F] → [[0,1,2],[3]] */
export function groupsOf(photos: PhotoEntry[]): number[][] {
  return photoGroups(joinsOf(photos));
}

/** from 사진을 to 사진 바로 뒤로 옮기고 to와 같은 묶음으로 만든다 (드래그앤드랍). 같은 묶음끼리면 변화 없음 */
export function joinPhotoTo(photos: PhotoEntry[], from: number, to: number): PhotoEntry[] {
  if (from === to || from < 0 || to < 0 || from >= photos.length || to >= photos.length) return photos;
  const groups = groupsOf(photos);
  const sameGroup = groups.some((g) => g.includes(from) && g.includes(to));
  if (sameGroup) return photos;

  const moved = photos[from];
  const rest = photos.filter((_, i) => i !== from);
  // 묶음의 첫 사진이 빠지면, 다음 사진이 새 첫 사진이 되므로 앞 묶음에 붙지 않게 끊어준다
  if (!moved.joinPrev && rest[from]?.joinPrev) rest[from] = { ...rest[from], joinPrev: false };

  const target = to > from ? to - 1 : to;
  rest.splice(target + 1, 0, { ...moved, joinPrev: true });
  return rest;
}

/** 사진 한 장 삭제. 묶음의 첫 사진이 지워져도 다음 사진이 앞 묶음에 붙지 않게 정리 */
export function removePhotoAt(photos: PhotoEntry[], index: number): PhotoEntry[] {
  if (index < 0 || index >= photos.length) return photos;
  const removed = photos[index];
  const rest = photos.filter((_, i) => i !== index);
  if (!removed.joinPrev && rest[index]?.joinPrev) rest[index] = { ...rest[index], joinPrev: false };
  return rest;
}

/** index가 속한 묶음(단독 사진 포함)을 앞(-1)/뒤(+1) 묶음과 자리 바꿈. 묶음 구성은 유지 */
export function moveGroup(photos: PhotoEntry[], index: number, dir: -1 | 1): PhotoEntry[] {
  const groups = groupsOf(photos);
  const gi = groups.findIndex((g) => g.includes(index));
  const gj = gi + dir;
  if (gi < 0 || gj < 0 || gj >= groups.length) return photos;
  [groups[gi], groups[gj]] = [groups[gj], groups[gi]];
  return groups.flatMap((g) =>
    g.map((i, k) => {
      const p = photos[i];
      const joinPrev = k > 0;
      return !!p.joinPrev === joinPrev ? p : { ...p, joinPrev };
    }),
  );
}
