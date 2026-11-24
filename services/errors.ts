export type AppErrorCode =
  | 'SESSION_EXPIRED'
  | 'GEMINI_KEY_MISSING'
  | 'GEMINI_KEY_INVALID'
  | 'GEMINI_QUOTA'
  | 'GEMINI_BLOCKED'
  | 'BLOG_NOT_SELECTED'
  | 'NETWORK'
  | 'LOGIN_FAILED'
  | 'UNKNOWN';

export class AppError extends Error {
  code: AppErrorCode;
  constructor(code: AppErrorCode, message: string) {
    super(message);
    this.code = code;
  }
}

export function errorMessage(e: unknown, fallback: string): string {
  if (e instanceof AppError) return e.message;
  if (e instanceof Error && e.message) return e.message;
  return fallback;
}
