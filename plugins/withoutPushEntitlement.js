// expo-notifications 플러그인이 자동으로 넣는 푸시(aps-environment) 권한을 제거한다.
// 이 앱은 로컬 알림만 쓰므로 푸시 권한이 필요 없고, 개인 개발 팀 계정은 푸시 권한을 지원하지 않는다.
const { withEntitlementsPlist } = require('expo/config-plugins');

module.exports = function withoutPushEntitlement(config) {
  return withEntitlementsPlist(config, (c) => {
    delete c.modResults['aps-environment'];
    return c;
  });
};
