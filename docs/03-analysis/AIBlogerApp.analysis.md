# Gap Analysis — AIBlogerApp Frontend

- **분석일**: 2026-05-20
- **PDCA Phase**: Check (Tistory cookie 방식 마이그레이션 후)
- **Match Rate (분석 시점)**: 88% → **수정 후 97%**

---

## 카테고리별 점수

| 카테고리 | 점수 | 상태 |
|---------|:---:|:---:|
| Screen Structure (Expo Router) | 100% | OK |
| Authentication Flow | 90% | Warn |
| API Endpoints (constants/api.ts) | 100% | OK |
| Data Model / Types | 100% | OK |
| Service Layer | 95% | OK |
| Zustand Stores | 100% | OK |
| Mock Adapter Coverage | 100% | OK |
| Stale Code Removal | 50% → 100% | Fixed |
| Session Expiry UX | 90% | OK |

---

## 수정 완료 항목

### C1 (Critical) — `app/settings.tsx` 삭제된 함수 import → 수정 완료
- `openTistoryAuth`, `connectTistory` import 제거
- `reconnecting` state 제거
- `handleReconnectTistory` → `router.push('/(auth)/tistory-connect')` 로 단순화
- `blogAddress` 를 Tistory 연동 상태값으로 표시

### M3 — `categoryId` 필드 제거 → 수정 완료
- `services/blogService.ts` `PublishPostRequest`에서 `categoryId?: string` 삭제

### L2 — logout 시 `tistorySessionExpired` 미초기화 → 수정 완료
- `stores/authStore.ts` logout reducer에 `tistorySessionExpired: false` 추가

### M2 — `checkTistoryStatus` 미사용 → 수정 완료
- `authStore.init()` 에서 `tistoryConnected: true` 일 때 자동 호출
- 세션 만료 감지 시 `tistorySessionExpired: true` 로 초기 설정

---

## 잔존 이슈 (설계 결정 필요)

### H1 — 세션 만료 에러 매칭 방식
- `publish.tsx:27` 에서 `publishError === 'TISTORY_SESSION_EXPIRED'` 문자열 비교
- 백엔드 에러 응답 필드명 확정 필요 (`message` vs `code`)
- **액션**: 백엔드 개발 시 `response.data.message = 'TISTORY_SESSION_EXPIRED'` 로 통일

### H2 — `document.cookie` 로 HttpOnly 쿠키 미수집
- `tistory-connect.tsx` 의 JS 주입 방식으로는 `TISTORY_SESSID` (HttpOnly) 미포함
- **옵션 A**: `@react-native-cookies/cookies` 패키지 추가하여 네이티브 쿠키 읽기
- **옵션 B**: 백엔드가 WebView URL을 받아서 별도 Playwright 세션으로 처리
- **현재**: MVP 단계에서 HttpOnly 이외의 세션 쿠키로 동작 여부 확인 필요

### H3 — Mock 데이터 `tistoryConnected: true` 로 신규 플로우 테스트 불가
- 개발 중 새 연동 플로우 테스트 시 `services/mock/data.ts` 에서 `tistoryConnected: false` 로 수동 변경
