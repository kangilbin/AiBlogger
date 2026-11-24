import * as SecureStore from 'expo-secure-store';

const KEYS = {
  token: 'google_access_token',
  expiresAt: 'google_expires_at',
  gemini: 'gemini_api_key',
};

type Session = { token: string; expiresAt: number };
let cached: Session | null = null;
const expiredListeners = new Set<() => void>();

export const session = {
  async load(): Promise<Session | null> {
    const token = await SecureStore.getItemAsync(KEYS.token);
    const exp = await SecureStore.getItemAsync(KEYS.expiresAt);
    if (!token || !exp) return null;
    cached = { token, expiresAt: Number(exp) };
    return cached;
  },
  async save(token: string, expiresInSec = 3600) {
    // 만료 1분 전에 미리 만료 처리해 호출 도중 만료되는 일을 방지
    const expiresAt = Date.now() + expiresInSec * 1000 - 60_000;
    cached = { token, expiresAt };
    await SecureStore.setItemAsync(KEYS.token, token);
    await SecureStore.setItemAsync(KEYS.expiresAt, String(expiresAt));
  },
  async clear() {
    cached = null;
    await SecureStore.deleteItemAsync(KEYS.token);
    await SecureStore.deleteItemAsync(KEYS.expiresAt);
  },
  /** 유효한 토큰이 없으면 null */
  getToken(): string | null {
    if (!cached || cached.expiresAt <= Date.now()) return null;
    return cached.token;
  },
  expire() {
    cached = null;
    expiredListeners.forEach((fn) => fn());
  },
  onExpired(fn: () => void) {
    expiredListeners.add(fn);
    return () => expiredListeners.delete(fn);
  },
};

export const geminiKeyStorage = {
  get: () => SecureStore.getItemAsync(KEYS.gemini),
  set: (key: string) => SecureStore.setItemAsync(KEYS.gemini, key),
  remove: () => SecureStore.deleteItemAsync(KEYS.gemini),
};
