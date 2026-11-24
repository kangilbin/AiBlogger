import { session } from './session';
import { AppError } from './errors';
import { refreshAccessToken } from './authService';
import { IS_MOCK } from '@/constants/config';

const expired = () => new AppError('SESSION_EXPIRED', '로그인이 만료되었어요. 다시 로그인해주세요.');

// 동시에 여러 요청이 만료를 만나도 갱신은 한 번만
let refreshing: Promise<string | null> | null = null;
async function refresh(stale?: string): Promise<string | null> {
  if (IS_MOCK) return null;
  refreshing ??= refreshAccessToken(stale)
    .then(async (t) => {
      if (t) await session.save(t, 3600);
      return t;
    })
    .finally(() => {
      refreshing = null;
    });
  return refreshing;
}

async function send(url: string, init: RequestInit, token: string): Promise<Response> {
  try {
    return await fetch(url, {
      ...init,
      headers: { ...(init.headers as Record<string, string>), Authorization: `Bearer ${token}` },
    });
  } catch {
    throw new AppError('NETWORK', '네트워크 연결을 확인해주세요.');
  }
}

/** Google API 호출용 fetch 래퍼 — Bearer 토큰 주입. 토큰이 만료됐거나 401이면 조용히 갱신해서 재시도하고, 그래도 안 되면 로그인 화면으로 */
export async function googleFetch(url: string, init: RequestInit = {}): Promise<Response> {
  let token = session.getToken() ?? (await refresh());
  if (!token) {
    session.expire();
    throw expired();
  }

  let res = await send(url, init, token);
  if (res.status === 401) {
    const fresh = await refresh(token);
    if (!fresh) {
      session.expire();
      throw expired();
    }
    res = await send(url, init, fresh);
    if (res.status === 401) {
      session.expire();
      throw expired();
    }
  }
  return res;
}

export async function readError(res: Response): Promise<string> {
  try {
    const j = await res.json();
    return j?.error?.message ?? `요청 실패 (${res.status})`;
  } catch {
    return `요청 실패 (${res.status})`;
  }
}
