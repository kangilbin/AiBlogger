import { create } from 'zustand';
import { generatePost as apiGenerate } from '@/services/geminiService';
import { publishToBlogger, clearUploadCache } from '@/services/publishService';
import { persistPhotos, deleteDraftPhotos } from '@/services/draftPhotos';
import { clearImageCache } from '@/services/imageUtils';
import { errorMessage, AppError } from '@/services/errors';
import { ensureNotificationPermission, notifyIfBackground } from '@/services/notificationService';
import { joinPhotoTo, removePhotoAt, moveGroup } from '@/utils/photoGroup';
import { useSettingsStore } from './settingsStore';
import { useAuthStore } from './authStore';
import { useHistoryStore } from './historyStore';
import { useThemeStore } from './themeStore';
import { allThemeLabels, applyThemeLabel } from '@/utils/theme';
import type { PhotoEntry, PlaceInfo, PostHistory } from '@/types';

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
  /** 직접 정한 제목(선택). 비우면 AI가 만듦 */
  customTitle: string;

  // 생성 결과
  title: string;
  body: string;
  labels: string[];
  /** 사진별 대체 텍스트(AI 생성). 사진 순서와 같은 인덱스 */
  alts: string[];
  /** 백그라운드 생성 상태: 화면을 벗어나도 계속 진행되고 상단 배너로 표시 */
  genStatus: 'idle' | 'running' | 'done' | 'error';
  genError: string | null;
  genPlace: string;

  publishProgress: string | null;
  /** 이력에 저장된 미발행 글의 id (같은 글을 다시 생성/수정하면 이 항목을 갱신) */
  historyId: string | null;

  addPhotos: (uris: string[]) => void;
  removePhoto: (index: number) => void;
  movePhoto: (index: number, dir: -1 | 1) => void;
  setPhotoNote: (index: number, note: string) => void;
  setPhotoJoin: (index: number, join: boolean) => void;
  /** from 사진을 to 사진의 묶음으로 옮김 (드래그앤드랍) */
  joinPhoto: (from: number, to: number) => void;
  setField: (patch: Partial<Pick<PostState, 'placeName' | 'place' | 'showMap' | 'rating' | 'summary' | 'notes' | 'extraPrompt' | 'customTitle' | 'title' | 'body' | 'labels'>>) => void;

  /** 현재 글을 '작성됨(미발행)'으로 이력에 저장/갱신 */
  saveDraft: () => void;
  /** 이력의 미발행 글을 작성 화면 상태로 복원 */
  /** 열었으면 true. 글 생성 중에 다른 글을 열면 진행 중인 결과와 섞이므로 열지 않고 false */
  loadFromHistory: (item: PostHistory) => boolean;
  startGeneration: () => void;
  dismissGeneration: () => void;
  publish: () => Promise<{ ok: true; url: string } | Extract<Result, { ok: false }>>;
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
  customTitle: '',
  title: '',
  body: '',
  labels: [] as string[],
  alts: [] as string[],
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
  historyId: null,

  addPhotos: (uris) =>
    set((s) => ({ photos: [...s.photos, ...uris.map((uri) => ({ uri, note: '' }))] })),
  removePhoto: (index) => set((s) => ({ photos: removePhotoAt(s.photos, index) })),
  movePhoto: (index, dir) => set((s) => ({ photos: moveGroup(s.photos, index, dir) })),
  joinPhoto: (from, to) => set((s) => ({ photos: joinPhotoTo(s.photos, from, to) })),
  setPhotoNote: (index, note) =>
    set((s) => ({ photos: s.photos.map((p, i) => (i === index ? { ...p, note } : p)) })),
  setPhotoJoin: (index, join) =>
    set((s) => ({ photos: s.photos.map((p, i) => (i === index ? { ...p, joinPrev: join } : p)) })),
  setField: (patch) => set(patch),

  saveDraft: () => {
    const s = get();
    if (!s.body.trim()) return;
    const id = s.historyId ?? `local_${Date.now()}`;
    if (!s.historyId) set({ historyId: id });
    useHistoryStore.getState().upsert({
      id,
      placeName: s.placeName,
      rating: s.rating,
      thumbnailUri: s.photos[0]?.uri || '',
      title: s.title,
      body: s.body,
      labels: s.labels,
      alts: s.alts,
      publishStatus: 'generated',
      snapshot: {
        photos: s.photos, place: s.place, showMap: s.showMap,
        summary: s.summary, notes: s.notes, extraPrompt: s.extraPrompt, customTitle: s.customTitle,
      },
      createdAt: useHistoryStore.getState().history.find((h) => h.id === id)?.createdAt ?? new Date().toISOString(),
    });

    // 사진을 영구 저장소로 복사한 뒤 이력/현재 글의 사진 경로를 교체 (이력에서 다시 열어도 사진 유지)
    persistPhotos(id, s.photos).then((saved) => {
      if (saved.every((p, i) => p.uri === s.photos[i]?.uri)) return;
      const cur = get();
      if (cur.historyId !== id) return; // 그 사이 다른 글로 바뀜
      // 그 사이 순서/개수가 바뀌었으면(사진 편집) 덮어쓰지 않음
      if (cur.photos.length !== saved.length || cur.photos.some((p, i) => p.uri !== s.photos[i].uri)) return;
      set({ photos: saved });
      get().saveDraft();
    });
  },

  loadFromHistory: (item) => {
    const cur = get();
    // 생성 중: 같은 글이면 그대로 보여주고, 다른 글이면 열지 않음 (생성 상태/결과가 덮어써지는 것 방지)
    if (cur.genStatus === 'running') return item.id === cur.historyId;
    const snap = item.snapshot;
    clearUploadCache();
    set({
      ...formInitial,
      photos: snap?.photos ?? [],
      place: snap?.place ?? null,
      showMap: snap?.showMap ?? true,
      summary: snap?.summary ?? '',
      notes: snap?.notes ?? '',
      extraPrompt: snap?.extraPrompt ?? '',
      customTitle: snap?.customTitle ?? '',
      placeName: item.placeName,
      rating: item.rating,
      title: item.title,
      body: item.body,
      labels: item.labels,
      alts: item.alts ?? [],
      historyId: item.id,
    });
    return true;
  },

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
      customTitle: s.customTitle,
      preset: useSettingsStore.getState().selectedPreset(),
    })
      .then((post) => {
        // 사용자가 고른 테마 라벨은 다시 생성해도 유지
        const known = allThemeLabels(useThemeStore.getState().themes);
        const picked = get().labels.find((l) => known.includes(l)) ?? null;
        set({ title: get().customTitle.trim() || post.title, body: post.body, labels: applyThemeLabel(post.labels, picked, known), alts: post.alts ?? [], genStatus: 'done' });
        get().saveDraft();
        notifyIfBackground(place, true);
      })
      .catch((e) => {
        set({ genStatus: 'error', genError: fail(e, '글 생성에 실패했습니다.').error });
        notifyIfBackground(place, false);
      });
  },

  dismissGeneration: () => set({ genStatus: 'idle', genError: null }),

  publish: async () => {
    const s = get();
    const blog = useAuthStore.getState().blog;
    if (!blog) return { ok: false, error: '발행할 블로그를 먼저 선택해 주세요.', code: 'BLOG_NOT_SELECTED' };

    try {
      const res = await publishToBlogger({
        blogId: blog.id,
        photos: s.photos,
        placeName: s.placeName,
        mapTarget: s.showMap ? { label: s.place?.name || s.placeName, lat: s.place?.lat, lng: s.place?.lng } : undefined,
        title: s.title,
        body: s.body,
        labels: s.labels,
        alts: s.alts,
        onProgress: (m) => set({ publishProgress: m }),
      });
      // 발행되면 '작성됨' 임시 항목은 발행 항목으로 대체
      if (s.historyId) {
        useHistoryStore.getState().remove(s.historyId);
        deleteDraftPhotos(s.historyId);
      }
      useHistoryStore.getState().add({
        id: res.id,
        placeName: s.placeName,
        rating: s.rating,
        thumbnailUri: res.thumbnailUrl || s.photos[0]?.uri || '',
        title: res.title,
        body: res.body,
        labels: s.labels,
        publishStatus: 'published',
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
    set({ ...formInitial, historyId: null, genStatus: 'idle', genError: null, genPlace: '' });
  },
}));
