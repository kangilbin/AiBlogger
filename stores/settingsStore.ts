import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { geminiKeyStorage } from '@/services/session';
import { BUILTIN_PRESETS, DEFAULT_PRESET_ID } from '@/constants/prompts';
import { useAuthStore } from './authStore';
import type { PromptPreset } from '@/types';

interface SettingsState {
  /** 기본 프리셋을 사용자가 수정한 내용 */
  overrides: Record<string, { name: string; prompt: string }>;
  custom: PromptPreset[];
  selectedId: string;

  presets: () => PromptPreset[];
  selectedPreset: () => PromptPreset;
  selectPreset: (id: string) => void;
  savePreset: (id: string | null, data: { name: string; prompt: string }) => string;
  resetPreset: (id: string) => void;
  deletePreset: (id: string) => void;
  isModified: (id: string) => boolean;

  saveGeminiKey: (key: string) => Promise<void>;
  deleteGeminiKey: () => Promise<void>;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
    overrides: {},
    custom: [],
    selectedId: DEFAULT_PRESET_ID,

    presets: () => {
      const { overrides, custom } = get();
      const builtins = BUILTIN_PRESETS.map((p) => (overrides[p.id] ? { ...p, ...overrides[p.id] } : p));
      return [...builtins, ...custom];
    },

    selectedPreset: () => {
      const list = get().presets();
      return list.find((p) => p.id === get().selectedId) ?? list[0];
    },

    selectPreset: (id) => {
      set({ selectedId: id });
    },

    savePreset: (id, data) => {
      const isBuiltin = !!id && BUILTIN_PRESETS.some((p) => p.id === id);
      if (isBuiltin) {
        set((s) => ({ overrides: { ...s.overrides, [id!]: data } }));
        return id!;
      }
      if (id) {
        set((s) => ({ custom: s.custom.map((p) => (p.id === id ? { ...p, ...data } : p)) }));
        return id;
      }
      const newId = `custom_${Date.now()}`;
      set((s) => ({
        custom: [...s.custom, { id: newId, description: '내가 만든 스타일', builtin: false, ...data }],
        selectedId: newId,
      }));
      return newId;
    },

    resetPreset: (id) => {
      set((s) => {
        const { [id]: _removed, ...rest } = s.overrides;
        return { overrides: rest };
      });
    },

    deletePreset: (id) => {
      set((s) => ({
        custom: s.custom.filter((p) => p.id !== id),
        selectedId: s.selectedId === id ? DEFAULT_PRESET_ID : s.selectedId,
      }));
    },

    isModified: (id) => !!get().overrides[id],

    saveGeminiKey: async (key) => {
      await geminiKeyStorage.set(key);
      useAuthStore.getState().setHasGeminiKey(true);
    },

    deleteGeminiKey: async () => {
      await geminiKeyStorage.remove();
      useAuthStore.getState().setHasGeminiKey(false);
    },
  }),
    {
      name: 'prompt_presets_v2',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({ overrides: s.overrides, custom: s.custom, selectedId: s.selectedId }),
    }
  )
);
