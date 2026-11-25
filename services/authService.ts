import Constants from 'expo-constants';
import { GoogleSignin, isSuccessResponse, isErrorWithCode, statusCodes } from '@react-native-google-signin/google-signin';
import { GOOGLE_SCOPES } from '@/constants/api';
import { AppError } from './errors';
import type { User } from '@/types';

let configured = false;

/** Android는 패키지 이름+SHA-1로 앱을 인증하므로 맞춤 URI 스킴이 필요 없다. webClientId는 토큰 발급용 */
function configure() {
  if (configured) return;
  const extra = Constants.expoConfig?.extra ?? {};
  GoogleSignin.configure({
    webClientId: extra.googleWebClientId,
    iosClientId: extra.googleIosClientId,
    scopes: GOOGLE_SCOPES.filter((s) => s.startsWith('https://')),
  });
  configured = true;
}

export interface GoogleLoginResult {
  user: User;
  accessToken: string;
}

/** 로그인 → 사용자 정보 + 액세스 토큰. 사용자가 취소하면 null */
export async function signInWithGoogle(): Promise<GoogleLoginResult | null> {
  configure();
  try {
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    const res = await GoogleSignin.signIn();
    if (!isSuccessResponse(res)) return null;
    const { accessToken } = await GoogleSignin.getTokens();
    const u = res.data.user;
    return { user: { name: u.name ?? '', email: u.email, photo: u.photo ?? '' }, accessToken };
  } catch (e) {
    if (isErrorWithCode(e) && e.code === statusCodes.SIGN_IN_CANCELLED) return null;
    if (isErrorWithCode(e) && e.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
      throw new AppError('LOGIN_FAILED', 'Google Play 서비스를 사용할 수 없습니다.');
    }
    throw new AppError('LOGIN_FAILED', e instanceof Error ? e.message : '로그인 중 오류가 발생했습니다.');
  }
}

/** 저장된 로그인으로 조용히 새 액세스 토큰을 받는다 (토큰이 약 1시간마다 만료되므로 자동 갱신용). 실패하면 null */
export async function refreshAccessToken(staleToken?: string): Promise<string | null> {
  try {
    configure();
    if (staleToken) await GoogleSignin.clearCachedAccessToken(staleToken).catch(() => {});
    const silent = await GoogleSignin.signInSilently();
    if (silent.type !== 'success') return null;
    const { accessToken } = await GoogleSignin.getTokens();
    return accessToken;
  } catch {
    return null;
  }
}

export async function signOutGoogle() {
  try {
    configure();
    await GoogleSignin.signOut();
  } catch {}
}
