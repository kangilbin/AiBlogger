export const GOOGLE_SCOPES = [
  'openid',
  'profile',
  'email',
  'https://www.googleapis.com/auth/blogger',
  // 앱이 직접 만든 파일만 접근 가능한 최소 권한 (사진 호스팅용)
  'https://www.googleapis.com/auth/drive.file',
];

export const BLOGGER_API = 'https://www.googleapis.com/blogger/v3';
export const DRIVE_UPLOAD_API = 'https://www.googleapis.com/upload/drive/v3';
export const DRIVE_API = 'https://www.googleapis.com/drive/v3';
export const GEMINI_API = 'https://generativelanguage.googleapis.com/v1beta';

// 무료 티어로 이미지 입력까지 지원하는 모델
export const GEMINI_MODEL = 'gemini-2.5-flash';

export const MAX_PHOTOS = 10;
