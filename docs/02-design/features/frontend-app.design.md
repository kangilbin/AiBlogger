# Design: AI Bloger App - Frontend

## 개요

| 항목 | 내용 |
|------|------|
| Feature | frontend-app |
| 작성일 | 2026-05-20 |
| 단계 | Design (v2 — 프로덕션 수준) |
| 참조 Plan | docs/01-plan/features/frontend-app.plan.md |

> 다크모드 미지원 — 라이트 테마 단일 구성  
> 백엔드: Spring Boot (auth/user/blog/ai/tistory 도메인)  
> Mock 모드: `EXPO_PUBLIC_USE_MOCK=true` 환경변수로 토글

---

## 1. 디렉토리 구조

```
AIBlogerApp/
├── app/
│   ├── _layout.tsx                  # 루트 레이아웃 (JWT 기반 인증 분기)
│   ├── settings.tsx                 # 설정 (모달)
│   ├── (auth)/
│   │   ├── _layout.tsx
│   │   ├── login.tsx                # Google 로그인 + Mock 로그인 버튼
│   │   └── tistory-connect.tsx      # Tistory 연동 (code → 백엔드)
│   └── (main)/
│       ├── _layout.tsx              # 탭 네비게이션 (홈/새글/이력)
│       ├── index.tsx                # 홈
│       ├── create.tsx               # 글 생성
│       ├── preview.tsx              # 미리보기 + 수정
│       ├── publish.tsx              # 발행
│       └── history.tsx              # 이력 (서버 조회 + Pull-to-refresh)
├── components/
│   ├── ui/
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Card.tsx
│   │   ├── StarRating.tsx
│   │   ├── ToneSelector.tsx
│   │   ├── ImageGrid.tsx
│   │   └── LoadingOverlay.tsx
│   └── layout/
│       └── SafeContainer.tsx
├── constants/
│   ├── colors.ts
│   ├── styles.ts
│   └── api.ts                       # API 엔드포인트 + BASE_URL
├── services/
│   ├── apiClient.ts                 # Axios + JWT 인터셉터 + Mock 어댑터 토글
│   ├── authService.ts               # Google OAuth (PKCE) + Tistory code 전달
│   ├── blogService.ts               # generate / publish / history
│   ├── userService.ts               # getMe / gemini-key CRUD
│   └── mock/
│       ├── adapter.ts               # Axios custom adapter (mock 응답)
│       └── data.ts                  # Mock 데이터 (유저, 글, 이력)
├── stores/
│   ├── authStore.ts                 # JWT 기반, 서버 유저 정보
│   ├── postStore.ts                 # 글 생성/발행/이력 (서버 API)
│   └── settingsStore.ts             # Gemini 키 서버 저장
├── types/
│   └── index.ts
└── .env                             # EXPO_PUBLIC_USE_MOCK / EXPO_PUBLIC_API_URL
```

---

## 2. 디자인 토큰 (라이트 모드 전용)

### 색상 (`constants/colors.ts`)

```typescript
export const Colors = {
  primary: '#3182F6',    primaryLight: '#EBF3FF',  primaryDark: '#1A6CE8',
  white: '#FFFFFF',      background: '#F9FAFB',     surface: '#FFFFFF',
  border: '#E5E8EB',     divider: '#F2F4F6',
  textPrimary: '#191F28', textSecondary: '#8B95A1',
  textDisabled: '#C9CDD2', textInverse: '#FFFFFF',
  success: '#00C471',    warning: '#FF8A00',        error: '#F04452',
  star: '#FFC940',       starEmpty: '#E5E8EB',
}
```

---

## 3. 공통 UI 컴포넌트

| 컴포넌트 | 주요 Props |
|----------|-----------|
| `Button` | `label`, `onPress`, `variant?('primary'\|'secondary'\|'ghost')`, `disabled?`, `loading?`, `fullWidth?`, `style?` |
| `Input` | `label?`, `error?`, + TextInputProps |
| `Card` | `children`, `style?` |
| `StarRating` | `value`, `onChange?`, `size?(32)`, `readonly?` |
| `ToneSelector` | `value: Tone`, `onChange` |
| `ImageGrid` | `images`, `onAdd`, `onRemove`, `maxCount?(5)` |
| `LoadingOverlay` | `visible`, `message?` |
| `SafeContainer` | `children`, `scrollable?`, `style?`, `contentStyle?` |

---

## 4. API 클라이언트 설계

### 4-1. `constants/api.ts`

```typescript
export const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8080';
export const ENDPOINTS = {
  auth: { google, tistory, refresh, logout },
  user: { me, geminiKey },
  blog: { generate, publish, history },
}
```

### 4-2. `services/apiClient.ts`

- Axios 인스턴스 (baseURL, timeout: 30s)
- **Request 인터셉터**: `SecureStore`에서 access token 읽어 `Authorization: Bearer` 주입
- **Response 인터셉터**: 401 수신 시 refresh token으로 자동 갱신, 실패 시 `authEventEmitter.emit('logout')`
- **Mock 모드**: `EXPO_PUBLIC_USE_MOCK=true`이면 `adapter: mockAdapter` 적용 → 실제 네트워크 미사용

```
tokenStorage: SecureStore 기반 access/refresh token 관리
authEventEmitter: 토큰 만료 시 전역 로그아웃 이벤트
```

### 4-3. Mock 어댑터 (`services/mock/adapter.ts`)

URL 패턴 + HTTP 메서드 매칭 → 가짜 응답 반환  
글 생성 2500ms, 나머지 500ms 지연으로 실제 느낌 시뮬레이션

---

## 5. 서비스 레이어

### authService.ts

```typescript
// Google OAuth — PKCE, 클라이언트 처리
useGoogleAuth()  →  { request, response, promptAsync }

// Google access_token → 백엔드 → JWT
loginWithGoogle(googleAccessToken) → AuthTokens

// Tistory — code 획득은 클라이언트, 토큰 교환은 백엔드
openTistoryAuth() → string | null  (code)
connectTistory(code) → void        (백엔드: code + secret → token 교환)

logout() → void
```

### blogService.ts

```typescript
generatePost({ images, placeName, rating, tone, customPrompt })
  → multipart/form-data → POST /api/blog/generate
  → { generatedText: string }

publishPost({ generatedText, placeName, visibility, categoryId? })
  → POST /api/blog/publish
  → { postId, url }

fetchHistory(page, size) → PostHistory[]
```

### userService.ts

```typescript
getMe() → User & { tistoryConnected, hasGeminiKey }
saveGeminiKey(apiKey) → void    // 서버 암호화 저장
deleteGeminiKey() → void
```

---

## 6. Zustand 스토어

### authStore.ts

```typescript
{
  user: User | null
  tistoryConnected: boolean
  hasGeminiKey: boolean
  isInitialized: boolean
  isLoggedIn: boolean

  init()          // SecureStore 토큰 확인 → getMe() → 상태 세팅
  setUser()
  setTistoryConnected()
  setHasGeminiKey()
  refreshUser()   // 서버에서 최신 유저 정보 재조회
  logout()        // 서버 logout API + 토큰 삭제
}
```

### postStore.ts

```typescript
// 입력
images, placeName, rating, tone, customPrompt

// 상태
generatedText, isGenerating, generateError
history, isLoadingHistory, historyError
isPublishing, publishError

// 액션
generatePost()   → POST /api/blog/generate (images multipart)
publishPost()    → POST /api/blog/publish
loadHistory()    → GET /api/blog/history
resetForm()
```

### settingsStore.ts

```typescript
isSavingKey, saveKeyError
saveGeminiKey(key)   → POST /api/user/gemini-key
deleteGeminiKey()    → DELETE /api/user/gemini-key
```

---

## 7. 화면별 상세 설계

### 7-1. 루트 레이아웃 (`app/_layout.tsx`)

```
앱 시작 → authStore.init()
  isLoggedIn=false  → (auth)/login
  isLoggedIn=true, tistoryConnected=false → (auth)/tistory-connect
  isLoggedIn=true, tistoryConnected=true  → (main)
```

### 7-2. 로그인 (`app/(auth)/login.tsx`)

- Google OAuth PKCE → `loginWithGoogle(token)` → JWT 저장 → authStore 세팅
- **Mock 모드 전용**: `[개발] Mock 로그인` 버튼 → 토큰 직접 세팅 (OAuth 우회)

### 7-3. Tistory 연동 (`app/(auth)/tistory-connect.tsx`)

- `openTistoryAuth()` → code 획득
- `connectTistory(code)` → 백엔드가 client_secret으로 token 교환
- 성공 → `authStore.setTistoryConnected(true)`

### 7-4. 홈 (`app/(main)/index.tsx`)

- 사용자 이름 인사 + 새 글 작성 버튼
- 최근 이력 카드 (postStore.history)
- 설정(⚙️) → `/settings` 모달

### 7-5. 글 생성 (`app/(main)/create.tsx`)

- `hasGeminiKey` 확인 → 미등록 시 설정 안내 Alert
- 이미지: `expo-image-picker` + `expo-image-manipulator` (1200px 리사이즈, 품질 80%)
- 입력 검증: 사진 ≥1장, 장소명 필수, 평점 > 0
- 글자 수 카운터 (customPrompt: 최대 300자)
- `postStore.generatePost()` → 성공 시 preview로 이동

### 7-6. 미리보기 (`app/(main)/preview.tsx`)

- 읽기/편집 모드 토글 (상단 우측 버튼)
- 하단: 다시 생성 + 발행하기

### 7-7. 발행 (`app/(main)/publish.tsx`)

- 발행 방식: 즉시발행(3) / 임시저장(0) 라디오
- `postStore.publishPost()` → 성공 시 결과 화면
- 결과: 링크 복사(Clipboard) + 블로그 보기(Linking) + 홈으로

### 7-8. 이력 (`app/(main)/history.tsx`)

- `useEffect` → `postStore.loadHistory()` (GET /api/blog/history)
- Pull-to-refresh (RefreshControl)
- 에러 시 재시도 버튼
- 빈 상태 UI

### 7-9. 설정 (`app/settings.tsx`) — Modal

- Gemini API 키: 등록/삭제 (서버 저장, 화면엔 등록 여부만 표시)
- Tistory: 연동 상태 + 재연동
- 계정: 이름/이메일 + 로그아웃

---

## 8. 네비게이션 플로우

```
앱 시작
  └─ 인증 분기 (_layout.tsx)
        ├─ 미인증 → login → tistory-connect → (main)
        └─ 인증됨 → (main)/index
                       ├─ create → preview → publish → (main)
                       ├─ history
                       └─ settings (modal)
```

---

## 9. 환경 설정

| 변수 | 설명 | 기본값 |
|------|------|--------|
| `EXPO_PUBLIC_USE_MOCK` | Mock 모드 토글 | `false` |
| `EXPO_PUBLIC_API_URL` | 백엔드 서버 주소 | `http://localhost:8080` |

---

## 10. 제약 사항

| 항목 | 내용 |
|------|------|
| 다크모드 | 미지원 |
| 이미지 | 최대 5장, 업로드 전 1200px/80% 품질 압축 |
| Gemini API 키 | 서버 암호화 저장 (클라이언트 미보관) |
| Tistory OAuth | client_secret 서버 보관, 클라이언트는 code만 획득 |
| 최소 OS | iOS 16+, Android API 28+ |
| 글자 수 | customPrompt 최대 300자 |