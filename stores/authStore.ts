import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { session, geminiKeyStorage } from '@/services/session';
import { refreshAccessToken, signOutGoogle } from '@/services/authService';
import { IS_MOCK } from '@/constants/config';
import type { BlogInfo, User } from '@/types';

const PROFILE_KEY = 'profile_v1';

interface AuthState {
  user: User | null;
  blog: BlogInfo | null;
  hasGeminiKey: boolean;
  isInitialized: boolean;
  isLoggedIn: boolean;

  init: () => Promise<void>;
  login: (user: User, accessToken: string, expiresIn?: number) => Promise<void>;
  selectBlog: (blog: BlogInfo) => Promise<void>;
  setHasGeminiKey: (v: boolean) => void;
  logout: () => Promise<void>;
}

const persistProfile = (user: User | null, blog: BlogInfo | null) =>
  AsyncStorage.setItem(PROFILE_KEY, JSON.stringify({ user, blog })).catch(() => {});

export const useAuthStore = create<AuthState>((set, get) => {
  // 토큰 만료/401 → 로그인 화면으로 (블로그 선택·Gemini 키는 유지)
  session.onExpired(() => {
    session.clear();
    set({ isLoggedIn: false, user: null });
  });

  return {
    user: null,
    blog: null,
    hasGeminiKey: false,
    isInitialized: false,
    isLoggedIn: false,

    init: async () => {
      const hasGeminiKey = !!(await geminiKeyStorage.get());
      const raw = await AsyncStorage.getItem(PROFILE_KEY).catch(() => null);
      const saved: { user: User | null; blog: BlogInfo | null } = raw
        ? JSON.parse(raw)
        : { user: null, blog: null };

      await session.load();
      let valid = !!session.getToken();
      // 토큰이 만료됐어도 이전에 로그인한 적이 있으면 조용히 갱신 (재로그인 불필요)
      if (!valid && saved.user && !IS_MOCK) {
        // 오프라인 등으로 갱신이 지연돼도 앱 시작이 막히지 않게 제한 시간을 둠
        const t = await Promise.race([
          refreshAccessToken(),
          new Promise<null>((r) => setTimeout(() => r(null), 8000)),
        ]);
        if (t) {
          await session.save(t, 3600);
          valid = true;
        }
      }
      set({
        hasGeminiKey,
        blog: saved.blog,
        user: valid ? saved.user : null,
        isLoggedIn: valid && !!saved.user,
        isInitialized: true,
      });
    },

    login: async (user, accessToken, expiresIn) => {
      await session.save(accessToken, expiresIn);
      await persistProfile(user, get().blog);
      set({ user, isLoggedIn: true });
    },

    selectBlog: async (blog) => {
      await persistProfile(get().user, blog);
      set({ blog });
    },

    setHasGeminiKey: (v) => set({ hasGeminiKey: v }),

    logout: async () => {
      await session.clear();
      await signOutGoogle();
      await persistProfile(null, null);
      set({ user: null, blog: null, isLoggedIn: false });
    },
  };
});
