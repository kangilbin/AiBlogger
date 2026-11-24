import React, { useRef, useState } from 'react';
import {
  View, Text, StyleSheet, Share, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { Touchable } from '@/components/ui/Touchable';

export default function BrowserScreen() {
  const router = useRouter();
  const { url, title } = useLocalSearchParams<{ url: string; title: string }>();
  const webViewRef = useRef<WebView>(null);

  const [canGoBack, setCanGoBack] = useState(false);
  const [loading, setLoading] = useState(true);
  const [pageTitle, setPageTitle] = useState(title ?? '');
  const [progress, setProgress] = useState(0);

  const handleShare = async () => {
    if (!url) return;
    await Share.share({ url, message: pageTitle ? `${pageTitle}\n${url}` : url });
  };

  if (!url) {
    router.back();
    return null;
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* 헤더 */}
      <View style={styles.header}>
        <Touchable
          onPress={() => (canGoBack ? webViewRef.current?.goBack() : router.back())}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          style={styles.headerBtn}
        >
          <Ionicons name="chevron-back" size={26} color={Colors.textPrimary} />
        </Touchable>

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle} numberOfLines={1}>{pageTitle}</Text>
          <Text style={styles.headerUrl} numberOfLines={1}>
            {url.replace(/^https?:\/\//, '')}
          </Text>
        </View>

        <View style={styles.headerRight}>
          <Touchable
            onPress={handleShare}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={styles.headerBtn}
          >
            <Ionicons name="share-outline" size={22} color={Colors.textPrimary} />
          </Touchable>
          <Touchable
            onPress={() => router.back()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={styles.headerBtn}
          >
            <Ionicons name="close" size={22} color={Colors.textPrimary} />
          </Touchable>
        </View>
      </View>

      {/* 로딩 프로그레스 바 */}
      {loading && (
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
        </View>
      )}

      <WebView
        ref={webViewRef}
        source={{ uri: url }}
        style={styles.webview}
        onNavigationStateChange={(state) => {
          setCanGoBack(state.canGoBack);
          if (state.title) setPageTitle(state.title);
        }}
        onLoadStart={() => setLoading(true)}
        onLoadEnd={() => setLoading(false)}
        onLoadProgress={({ nativeEvent }) => setProgress(nativeEvent.progress)}
        startInLoadingState
        renderLoading={() => (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={Colors.primary} />
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    height: 56,
    backgroundColor: Colors.bg,
    gap: 4,
  },
  headerBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 4,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  headerUrl: {
    fontSize: 12,
    color: Colors.textTertiary,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressBar: {
    height: 2,
    backgroundColor: Colors.fill,
  },
  progressFill: {
    height: 2,
    backgroundColor: Colors.primary,
  },
  webview: { flex: 1 },
  loadingBox: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.bg,
  },
});