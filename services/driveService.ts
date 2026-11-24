import { DRIVE_API, DRIVE_UPLOAD_API } from '@/constants/api';
import { googleFetch, readError } from './http';
import { prepareImage } from './imageUtils';
import { IS_MOCK } from '@/constants/config';

/** 사진을 사용자 Drive에 올리고 블로그에 삽입할 공개 URL을 반환 */
export async function uploadPublicImage(localUri: string, name: string): Promise<string> {
  if (IS_MOCK) return localUri;
  const { base64 } = await prepareImage(localUri, 1280, 0.85);

  const boundary = `aibloger_${Date.now()}`;
  const body =
    `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n` +
    `${JSON.stringify({ name, mimeType: 'image/jpeg' })}\r\n` +
    `--${boundary}\r\nContent-Type: image/jpeg\r\nContent-Transfer-Encoding: base64\r\n\r\n` +
    `${base64}\r\n--${boundary}--`;

  const up = await googleFetch(`${DRIVE_UPLOAD_API}/files?uploadType=multipart&fields=id`, {
    method: 'POST',
    headers: { 'Content-Type': `multipart/related; boundary=${boundary}` },
    body,
  });
  if (!up.ok) throw new Error(`사진 업로드 실패: ${await readError(up)}`);
  const { id } = await up.json();

  const perm = await googleFetch(`${DRIVE_API}/files/${id}/permissions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ role: 'reader', type: 'anyone' }),
  });
  if (!perm.ok) throw new Error(`사진 공개 설정 실패: ${await readError(perm)}`);

  return `https://lh3.googleusercontent.com/d/${id}`;
}
