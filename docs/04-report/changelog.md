# AI Bloger App - Changelog

All notable changes to this project will be documented in this file.

## [1.0.0] - 2026-05-20

### Added
- **Frontend App (Expo React Native)**
  - Google OAuth login integration (PKCE)
  - Tistory OAuth connection (code → backend exchange)
  - Multi-image selection with automatic compression (1200px/80%)
  - AI-powered blog post generation (Gemini API via backend)
  - Post preview and editing interface
  - Tistory direct publishing (draft/instant)
  - Post history management with pull-to-refresh
  - Gemini API key management (server-side encryption)
  - JWT token auto-refresh mechanism
  - Mock mode for backend-less testing

### UI Components (8 total)
- Button (primary/secondary/ghost variants)
- Input with error states
- Card container
- StarRating (1-5 stars)
- ToneSelector (friendly/professional/humorous)
- ImageGrid with add/remove
- LoadingOverlay with message
- SafeContainer with safe area handling

### Architecture
- Service layer (API abstraction)
- Zustand state management (3 stores: auth, post, settings)
- Axios HTTP client with request/response interceptors
- Mock adapter for offline testing
- Structured TypeScript types (100% coverage)
- Expo Router file-based routing

### Settings & Configuration
- Environment variables (EXPO_PUBLIC_USE_MOCK, EXPO_PUBLIC_API_URL)
- Light theme design tokens (colors, typography)
- API endpoint definitions
- Mock data for development

### Documentation
- Plan document (feature requirements, tech stack)
- Design document (architecture, API specs, component layout)
- Gap analysis (100% match rate achieved)
- Completion report (lessons learned, next steps)

### Known Constraints
- Dark mode not supported (light theme only)
- Maximum 5 images per post
- Requires backend for: Google OAuth token exchange, Tistory OAuth, Gemini API, image storage
- Minimum OS: iOS 16+, Android API 28+

## Deployment Ready

- ✅ Frontend code: Complete
- ✅ Mock testing: Verified
- ✅ TypeScript compilation: All types safe
- ⏳ Backend integration: Pending backend implementation
- ⏳ Production builds: Ready after backend complete
- ⏳ App Store/Play Store: Ready after testing phase

## Next Phase

Backend development expected to begin 2026-05-21:
- Google OAuth server integration
- Tistory OAuth token exchange (client_secret protection)
- Gemini API integration
- User & blog post database
- Image storage (S3 or local)

See `docs/04-report/frontend-app.report.md` for detailed specifications and API contracts.
