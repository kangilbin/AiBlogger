import { AppState } from 'react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';

/** Expo Go(Android)에서는 expo-notifications를 import만 해도 오류가 나므로 개발 빌드/배포 빌드에서만 로드 */
const supported = Constants.executionEnvironment !== ExecutionEnvironment.StoreClient;
// eslint-disable-next-line @typescript-eslint/no-var-requires
const Notifications: typeof import('expo-notifications') | null = supported ? require('expo-notifications') : null;

Notifications?.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

/** 알림 탭 리스너 (지원하지 않는 환경이면 no-op) */
export function onNotificationTap(cb: () => void): () => void {
  if (!Notifications) return () => {};
  const sub = Notifications.addNotificationResponseReceivedListener(() => cb());
  return () => sub.remove();
}

let asked = false;

/** 최초 생성 시 1회 권한 요청 (거절해도 앱 사용에는 지장 없음) */
export async function ensureNotificationPermission() {
  if (asked || !Notifications) return;
  asked = true;
  try {
    const cur = await Notifications.getPermissionsAsync();
    if (!cur.granted && cur.canAskAgain) await Notifications.requestPermissionsAsync();
  } catch {}
}

/** 앱이 포그라운드가 아닐 때만 로컬 알림 (포그라운드는 상단 배너가 대신함) */
export async function notifyIfBackground(place: string, ok: boolean) {
  if (!Notifications || AppState.currentState === 'active') return;
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: ok ? '블로그 글 작성 완료' : '블로그 글 작성 실패',
        body: ok ? `'${place}' 글이 완성되었습니다. 눌러서 확인하세요.` : `'${place}' 글 생성에 실패했습니다. 다시 시도해 주세요.`,
      },
      trigger: null,
    });
  } catch {}
}
