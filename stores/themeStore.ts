import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { cleanThemeName, hasName } from '@/utils/theme';
import type { Theme } from '@/types';

type Result = { ok: true } | { ok: false; error: string };

interface ThemeState {
  themes: Theme[];
  addTheme: (name: string) => Result;
  renameTheme: (id: string, name: string) => Result;
  deleteTheme: (id: string) => void;
  addSub: (themeId: string, name: string) => Result;
  renameSub: (themeId: string, subId: string, name: string) => Result;
  deleteSub: (themeId: string, subId: string) => void;
}

const uid = (p: string) => `${p}_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
const EMPTY = { ok: false as const, error: '이름을 입력해 주세요.' };
const DUP = { ok: false as const, error: '이미 존재하는 이름입니다.' };

/** 글 분류 테마 목록(기기 로컬 저장). 이름 변경/삭제는 이미 발행된 글의 라벨에는 영향이 없다 */
export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      themes: [],

      addTheme: (raw) => {
        const name = cleanThemeName(raw);
        if (!name) return EMPTY;
        if (hasName(get().themes.map((t) => t.name), name)) return DUP;
        set((s) => ({ themes: [...s.themes, { id: uid('t'), name, subs: [] }] }));
        return { ok: true };
      },

      renameTheme: (id, raw) => {
        const name = cleanThemeName(raw);
        if (!name) return EMPTY;
        const list = get().themes;
        if (hasName(list.map((t) => t.name), name, list.findIndex((t) => t.id === id))) return DUP;
        set({ themes: list.map((t) => (t.id === id ? { ...t, name } : t)) });
        return { ok: true };
      },

      deleteTheme: (id) => set((s) => ({ themes: s.themes.filter((t) => t.id !== id) })),

      addSub: (themeId, raw) => {
        const name = cleanThemeName(raw);
        if (!name) return EMPTY;
        const theme = get().themes.find((t) => t.id === themeId);
        if (!theme) return { ok: false, error: '상위 카테고리를 찾을 수 없습니다.' };
        if (hasName(theme.subs.map((x) => x.name), name)) return DUP;
        set((s) => ({
          themes: s.themes.map((t) => (t.id === themeId ? { ...t, subs: [...t.subs, { id: uid('s'), name }] } : t)),
        }));
        return { ok: true };
      },

      renameSub: (themeId, subId, raw) => {
        const name = cleanThemeName(raw);
        if (!name) return EMPTY;
        const theme = get().themes.find((t) => t.id === themeId);
        if (!theme) return { ok: false, error: '상위 카테고리를 찾을 수 없습니다.' };
        if (hasName(theme.subs.map((x) => x.name), name, theme.subs.findIndex((x) => x.id === subId))) return DUP;
        set((s) => ({
          themes: s.themes.map((t) =>
            t.id === themeId ? { ...t, subs: t.subs.map((x) => (x.id === subId ? { ...x, name } : x)) } : t
          ),
        }));
        return { ok: true };
      },

      deleteSub: (themeId, subId) =>
        set((s) => ({
          themes: s.themes.map((t) => (t.id === themeId ? { ...t, subs: t.subs.filter((x) => x.id !== subId) } : t)),
        })),
    }),
    {
      name: 'themes_v1',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({ themes: s.themes }),
    }
  )
);
