const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// node_modules 중 private class fields(#)를 사용하는 패키지들을 Babel로 변환
config.transformer.getTransformOptions = async () => ({
  transform: {
    experimentalImportSupport: false,
    inlineRequires: true,
  },
});

config.resolver.unstable_enablePackageExports = true;

module.exports = config;