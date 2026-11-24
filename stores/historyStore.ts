import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { PostHistory } from '@/types';

const HISTORY_MAX = 100;

interface HistoryState {
  history: PostHistory[];
  add: (entry: PostHistory) => void;
  remove: (id: string) => void;
}

export const useHistoryStore = create<HistoryState>()(
  persist(
    (set) => ({
      history: [],
      add: (entry) => set((s) => ({ history: [entry, ...s.history].slice(0, HISTORY_MAX) })),
      remove: (id) => set((s) => ({ history: s.history.filter((h) => h.id !== id) })),
    }),
    { name: 'history_v2', storage: createJSONStorage(() => AsyncStorage) }
  )
);
