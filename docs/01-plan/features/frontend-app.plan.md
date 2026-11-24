# Plan: AI Bloger App - Frontend

## 개요

| 항목 | 내용 |
|------|------|
| Feature | frontend-app |
| 작성일 | 2026-05-19 |
| 단계 | Plan |
| 수준 | Dynamic (MVP) |

## 배경 및 목적

AI를 활용해 맛집/카페 방문 후기를 자동으로 블로그 포스팅으로 변환해주는 모바일 앱. 사용자가 사진과 별점만 입력하면 Gemini API가 블로그 글을 생성하고, Tistory에 자동 발행한다.

**벤치마킹**: 토스, 카카오, 당근마켓 (심플하고 직관적인 UX)

## 기술 스택

| 용도 | 선택 |
|------|------|
| 프레임워크 | Expo (React Native) |
| 라우팅 | Expo Router (파일 기반) |
| 인증 | expo-auth-session |
| 토큰 저장 | expo-secure-store |
| 이미지 선택 | expo-image-picker |
| HTTP 통신 | axios |
| 상태 관리 | Zustand |
| 타겟 플랫폼 | Android + iOS |

## 화면 구조

```
app/
├── (auth)/
│   ├── login.tsx              # Google 로그인
│   └── tistory-connect.tsx    # Tistory 계정 연동
├── (main)/
│   ├── _layout.tsx            # 탭 네비게이션
│   ├── index.tsx              # 홈 (글 생성 시작)
│   ├── create.tsx             # 사진 업로드 + 평점 + 말투
│   ├── preview.tsx            # AI 생성 결과 미리보기 + 수정
│   ├── publish.tsx            # Tistory 발행 설정
│   └── history.tsx            # 생성 이력
└── _layout.tsx                # 루트 레이아웃
```

## 핵심 기능 목록

### 1. 인증 플로우 (Auth)
- Google OAuth 로그인 (expo-auth-session)
- Tistory 계정 연동
- 로그인 상태 유지 (토큰 → expo-secure-store)

### 2. Gemini API 키 설정
- 사용자 본인 API 키 입력/저장
- 처음 사용자를 위한 등록 가이드 UI

### 3. 글 생성 화면 (핵심)
- 사진 다중 선택 (expo-image-picker)
- 별점 입력 UI
- 말투 프리셋 (친근하게 / 전문적으로 / 유머러스하게)
- 커스텀 프롬프트 입력
- 생성 요청 → 로딩 표시

### 4. 미리보기 + 수정
- AI 생성 텍스트 표시
- 인라인 수정 기능
- 재생성 버튼

### 5. Tistory 발행
- 임시저장 / 즉시발행 선택
- 발행 완료 후 링크 표시

### 6. 이력 관리
- 생성된 글 목록
- 발행 상태 표시

## 구현 우선순위

| 순위 | 기능 | 이유 |
|------|------|------|
| 1 | 프로젝트 초기 설정 | Expo 프로젝트 생성, 라우터 설정 |
| 2 | 인증 플로우 | 모든 기능의 선제 조건 |
| 3 | Gemini API 키 설정 | 글 생성의 선제 조건 |
| 4 | 글 생성 화면 | 핵심 가치 기능 |
| 5 | 미리보기 + 수정 | 글 생성과 연결 |
| 6 | Tistory 발행 | 최종 아웃풋 |
| 7 | 이력 관리 | 편의 기능 |

## 범위 (Scope)

### In Scope
- Expo 프로젝트 초기화 (expo-router)
- 6개 핵심 화면 구현
- Google OAuth 로그인
- Tistory OAuth 연동
- expo-image-picker 이미지 선택
- Zustand 상태 관리
- Gemini API 연동 (키 입력 방식)
- Tistory API 발행

### Out of Scope (MVP 이후)
- 백엔드 서버 (BaaS 또는 직접 구현)
- 푸시 알림
- 다크 모드
- 소셜 공유

## PDCA 진행 계획

| Phase | 작업 |
|-------|------|
| Plan (현재) | 화면 흐름, 기능 목록, 기술 스택 확정 |
| Design | 컴포넌트 구조 설계, 상태 관리 설계, API 인터페이스 |
| Do | 인증 → 글 생성 → 발행 순으로 구현 |
| Check | 실기기 테스트 (Android/iOS), UX 검증 |

## 성공 기준

- [ ] Google 로그인 → Tistory 연동 → 글 생성 → 발행까지 전체 플로우 동작
- [ ] Android / iOS 모두 빌드 성공
- [ ] 별점 + 사진 입력 후 10초 내 AI 글 생성
- [ ] 토스 수준의 심플한 UI
