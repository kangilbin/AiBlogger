import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { usePostStore } from '@/stores/postStore';
import { Button } from '@/components/ui/Button';
import { useShallow } from 'zustand/react/shallow';
import { PostBody } from '@/components/ui/PostBody';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { Colors } from '@/constants/colors';
import { Radius, Typo, SCREEN_PADDING } from '@/constants/styles';
import { TextField } from '@/components/ui/TextField';
import { BottomBar } from '@/components/ui/BottomBar';
import { Touchable } from '@/components/ui/Touchable';
import { ThemeSelector } from '@/components/ui/ThemeSelector';

export default function PreviewScreen() {
  const router = useRouter();
  const { title, body, photos, labels, placeName, place, showMap, setField, startGeneration, saveDraft, genStatus, genError, dismissGeneration } =
    usePostStore(
      useShallow((s) => ({
        title: s.title, body: s.body, photos: s.photos, labels: s.labels, placeName: s.placeName, place: s.place,
        showMap: s.showMap, setField: s.setField, startGeneration: s.startGeneration, saveDraft: s.saveDraft, genStatus: s.genStatus,
        genError: s.genError, dismissGeneration: s.dismissGeneration,
      }))
    );
  const [isEditing, setIsEditing] = useState(false);

  // 탭 화면은 나가도 언마운트되지 않으므로 포커스 기준으로 처리:
  // 들어올 때 수정 모드를 풀고(이력에서 다른 글을 열어도 항상 보기 모드로 시작), 나갈 때 수정 내용을 이력에 저장
  useFocusEffect(
    React.useCallback(() => {
      setIsEditing(false);
      setIsFocused(true);
      return () => {
        setIsFocused(false);
        saveDraft();
      };
    }, [saveDraft])
  );

  const [isFocused, setIsFocused] = useState(true);

  // 다시 생성도 새 글 작성처럼 백그라운드로 진행: 수정 내용을 저장하고 홈으로 이동, 진행/완료는 상단 배너로 안내
  const handleRegenerate = () => {
    saveDraft();
    startGeneration();
    router.replace('/(main)');
  };

  // 이 화면에서는 배너가 숨겨지므로 실패/완료를 여기서 처리
  useEffect(() => {
    // 탭 화면은 안 보일 때도 마운트되어 있으므로, 이 화면을 보고 있을 때만 처리 (아니면 배너가 처리)
    if (!isFocused) return;
    if (genStatus === 'error') {
      Alert.alert('재생성 실패', genError ?? '다시 시도해주세요.');
      dismissGeneration();
    } else if (genStatus === 'done') {
      dismissGeneration();
    }
  }, [genStatus, isFocused]);

  const handlePublish = () => {
    router.push('/(main)/publish');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader
        title="미리보기"
        onBack={() => router.back()}
        right={
          <Touchable onPress={() => { if (isEditing) saveDraft(); setIsEditing(!isEditing); }} hitSlop={10}>
            <Text style={styles.editBtnText}>{isEditing ? '완료' : '수정'}</Text>
          </Touchable>
        }
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
        keyboardVerticalOffset={90}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {isEditing ? (
            <View style={{ gap: 12 }}>
              <TextField style={styles.titleInput} value={title} onChangeText={(t) => setField({ title: t })} placeholder="제목" multiline />
              <Text style={styles.editHint}>사진 위치는 [[사진N]] 줄이에요(줄을 옮기면 위치가 바뀌어요). ## 소제목, **굵게**, {'>'} 인용, - 목록, --- 구분선을 쓸 수 있어요.</Text>
              <TextField
                style={styles.editableText}
                value={body}
                onChangeText={(t) => setField({ body: t })}
                multiline
              />
            </View>
          ) : (
            <View style={{ gap: 16 }}>
              <Text style={styles.postTitle}>{title}</Text>
              <PostBody body={body} photos={photos} />
              {showMap && (
                <View style={styles.mapNote}>
                  <Ionicons name="location" size={20} color={Colors.primary} />
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={styles.mapTitle}>위치 지도</Text>
                    <Text style={Typo.caption}>
                      발행하면 글 맨 아래에 '{place?.name ?? placeName}' 구글 지도가 붙어요{place?.address ? `\n${place.address}` : ''}.
                    </Text>
                  </View>
                </View>
              )}
              {labels.length > 0 && <Text style={styles.labels}>{labels.map((l) => `#${l}`).join(' ')}</Text>}
            </View>
          )}
          <ThemeSelector labels={labels} onChange={(l) => { setField({ labels: l }); saveDraft(); }} />
        </ScrollView>

        <BottomBar row>
          <Button label={genStatus === 'running' ? '다시 작성 중...' : '다시 생성'} onPress={handleRegenerate} disabled={genStatus === 'running'} variant="secondary" style={styles.footerBtn} />
          <Button label="발행하기" onPress={handlePublish} style={styles.footerBtn} />
        </BottomBar>
      </KeyboardAvoidingView>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  editBtnText: { fontSize: 16, color: Colors.primary, fontWeight: '600' },
  scroll: { flex: 1 },
  content: { paddingHorizontal: SCREEN_PADDING, paddingTop: 8, paddingBottom: 40 },
  postTitle: { ...Typo.display, fontSize: 24, lineHeight: 34 },
  titleInput: { fontSize: 20, fontWeight: '700', lineHeight: 28 },
  editHint: { ...Typo.caption, color: Colors.textTertiary },
  labels: { ...Typo.body, color: Colors.primary },
  editableText: { fontSize: 16, lineHeight: 26, minHeight: 400, padding: 16 },
  mapNote: { flexDirection: 'row', gap: 12, padding: 16, borderRadius: Radius.md, backgroundColor: Colors.fill },
  mapTitle: { ...Typo.body, fontWeight: '600' },
  footerBtn: { flex: 1 },
});
