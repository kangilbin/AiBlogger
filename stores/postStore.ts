import { create } from 'zustand';
import { generatePost as apiGenerate } from '@/services/geminiService';
import { publishToBlogger, clearUploadCache } from '@/services/publishService';
import { clearImageCache } from '@/services/imageUtils';
import { errorMessage, AppError } from '@/services/errors';
import { ensureNotificationPermission, notifyIfBackground } from '@/services/notificationService';
import { useSettingsStore } from './settingsStore';
import { useAuthStore } from './authStore';
import { useHistoryStore } from './historyStore';
import type { PhotoEntry, PlaceInfo } from '@/types';

type Result = { ok: true } | { ok: false; error: string; code?: string };

/** 작성 중인 글(입력 → 생성 결과 → 발행) 상태. 외부 호출은 services에 위임 */
interface PostState {
  // 입력
  photos: PhotoEntry[];
  placeName: string;
  /** 장소 검색으로 고른 장소(좌표). 없으면 장소명으로 지도를 검색 */
  place: PlaceInfo | null;
  /** 글 끝에 지도 첨부 여부 */
  showMap: boolean;
  rating: number;
  summary: string;
  notes: string;
  extraPrompt: string;

  // 생성 결과
  title: string;
  body: string;
  labels: string[];
  /** 백그라운드 생성 상태: 화면을 벗어나도 계속 진행되고 상단 배너로 표시 */
  genStatus: 'idle' | 'running' | 'done' | 'error';
  genError: string | null;
  genPlace: string;

  publishProgress: string | null;

  addPhotos: (uris: string[]) => void;
  removePhoto: (index: number) => void;
  movePhoto: (index: number, dir: -1 | 1) => void;
  setPhotoNote: (index: number, note: string) => void;
  setPhotoJoin: (index: number, join: boolean) => void;
  setField: (patch: Partial<Pick<PostState, 'placeName' | 'place' | 'showMap' | 'rating' | 'summary' | 'notes' | 'extraPrompt' | 'title' | 'body'>>) => void;

  startGeneration: () => void;
  dismissGeneration: () => void;
  publish: (isDraft: boolean) => Promise<{ ok: true; url: string } | Extract<Result, { ok: false }>>;
  resetForm: () => void;
}

const formInitial = {
  photos: [] as PhotoEntry[],
  placeName: '',
  place: null as PlaceInfo | null,
  showMap: true,
  rating: 0,
  summary: '',
  notes: '',
  extraPrompt: '',
  title: '',
  body: '',
  labels: [] as string[],
};

const fail = (e: unknown, fallback: string) => ({
  ok: false as const,
  error: errorMessage(e, fallback),
  code: (e as AppError).code,
});

export const usePostStore = create<PostState>((set, get) => ({
  ...formInitial,
  genStatus: 'idle',
  genError: null,
  genPlace: '',
  publishProgress: null,

  addPhotos: (uris) =>
    set((s) => ({ photos: [...s.photos, ...uris.map((uri) => ({ uri, note: '' }))] })),
  removePhoto: (index) => set((s) => ({ photos: s.photos.filter((_, i) => i !== index) })),
  movePhoto: (index, dir) =>
    set((s) => {
      const to = index + dir;
      if (to < 0 || to >= s.photos.length) return s;
      const next = [...s.photos];
      [next[index], next[to]] = [next[to], next[index]];
      return { photos: next };
    }),
  setPhotoNote: (index, note) =>
    set((s) => ({ photos: s.photos.map((p, i) => (i === index ? { ...p, note } : p)) })),
  setPhotoJoin: (index, join) =>
    set((s) => ({ photos: s.photos.map((p, i) => (i === index ? { ...p, joinPrev: join } : p)) })),
  setField: (patch) => set(patch),

  startGeneration: () => {
    if (get().genStatus === 'running') return;
    const s = get();
    const place = s.placeName.trim();
    set({ genStatus: 'running', genError: null, genPlace: place });
    ensureNotificationPermission();

    // await하지 않음 — 호출한 화면과 무관하게 계속 진행
    apiGenerate({
      photos: s.photos,
      placeName: place,
      placeAddress: s.place?.address,
      rating: s.rating,
      summary: s.summary,
      notes: s.notes,
      extraPrompt: s.extraPrompt,
      preset: useSettingsStore.getState().selectedPreset(),
    })
      .then((post) => {
        set({ title: post.title, body: post.body, labels: post.labels, genStatus: 'done' });
        notifyIfBackground(place, true);
      })
      .catch((e) => {
        set({ genStatus: 'error', genError: fail(e, '글 생성에 실패했습니다.').error });
        notifyIfBackground(place, false);
      });
  },

  dismissGeneration: () => set({ genStatus: 'idle', genError: null }),

  publish: async (isDraft) => {
    const s = get();
    const blog = useAuthStore.getState().blog;
    if (!blog) return { ok: false, error: '발행할 블로그를 먼저 선택해주세요.', code: 'BLOG_NOT_SELECTED' };

    try {
      const res = await publishToBlogger({
        blogId: blog.id,
        photos: s.photos,
        placeName: s.placeName,
        mapTarget: s.showMap ? { label: s.place?.name || s.placeName, lat: s.place?.lat, lng: s.place?.lng } : undefined,
        title: s.title,
        body: s.body,
        labels: s.labels,
        isDraft,
        onProgress: (m) => set({ publishProgress: m }),
      });
      useHistoryStore.getState().add({
        id: res.id,
        placeName: s.placeName,
        rating: s.rating,
        thumbnailUri: res.thumbnailUrl || s.photos[0]?.uri || '',
        title: res.title,
        body: res.body,
        labels: s.labels,
        publishStatus: isDraft ? 'draft' : 'published',
        postUrl: res.url,
        createdAt: new Date().toISOString(),
      });
      return { ok: true, url: res.url };
    } catch (e) {
      return fail(e, '발행에 실패했습니다.');
    } finally {
      set({ publishProgress: null });
    }
  },

  resetForm: () => {
    // 글 하나가 끝나면 사진 관련 캐시도 비워 메모리 누적 방지
    clearUploadCache();
    clearImageCache();
    set({ ...formInitial, genStatus: 'idle', genError: null, genPlace: '' });
  },
}));
