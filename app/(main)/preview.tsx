import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { usePostStore } from '@/stores/postStore';
import { Button } from '@/components/ui/Button';
import { LoadingOverlay } from '@/components/ui/LoadingOverlay';
import { useShallow } from 'zustand/react/shallow';
import { PostBody } from '@/components/ui/PostBody';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { Colors } from '@/constants/colors';
import { Touchable } from '@/components/ui/Touchable';

export default function PreviewScreen() {
  const router = useRouter();
  const { title, body, photos, labels, placeName, place, showMap, setField, startGeneration, genStatus, genError, dismissGeneration } =
    usePostStore(
      useShallow((s) => ({
        title: s.title, body: s.body, photos: s.photos, labels: s.labels, placeName: s.placeName, place: s.place,
        showMap: s.showMap, setField: s.setField, startGeneration: s.startGeneration, genStatus: s.genStatus,
        genError: s.genError, dismissGeneration: s.dismissGeneration,
      }))
    );
  const [isEditing, setIsEditing] = useState(false);

  const handleRegenerate = () => startGeneration();

  // 이 화면에서는 배너가 숨겨지므로 실패/완료를 여기서 처리
  useEffect(() => {
    if (genStatus === 'error') {
      Alert.alert('재생성 실패', genError ?? '다시 시도해주세요.');
      dismissGeneration();
    } else if (genStatus === 'done') {
      dismissGeneration();
    }
  }, [genStatus]);

  const handlePublish = () => {
    router.push('/(main)/publish');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader
        title="미리보기"
        onBack={() => router.back()}
        right={
          <Touchable onPress={() => setIsEditing(!isEditing)}>
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
              <TextInput style={styles.titleInput} value={title} onChangeText={(t) => setField({ title: t })} placeholder="제목" multiline />
              <Text style={styles.editHint}>사진 위치는 [[사진N]] 줄로 표시돼요. 줄을 옮기면 사진 위치가 바뀌어요.</Text>
              <TextInput
                style={styles.editableText}
                value={body}
                onChangeText={(t) => setField({ body: t })}
                multiline
                textAlignVertical="top"
              />
            </View>
          ) : (
            <View style={{ gap: 14 }}>
              <Text style={styles.postTitle}>{title}</Text>
              <PostBody body={body} photos={photos} />
              {showMap && (
                <View style={{ marginTop: 14, padding: 14, borderRadius: 12, backgroundColor: Colors.primaryLight }}>
                  <Text style={{ fontSize: 14, fontWeight: '700', color: Colors.textPrimary }}>📍 위치</Text>
                  <Text style={{ fontSize: 13, color: Colors.textSecondary, marginTop: 4 }}>
                    발행하면 글 맨 아래에 '{place?.name ?? placeName}' 구글 지도가 붙어요{place?.address ? `\n${place.address}` : ''}.
                  </Text>
                </View>
              )}
              {labels.length > 0 && <Text style={styles.labels}>{labels.map((l) => `#${l}`).join(' ')}</Text>}
            </View>
          )}
        </ScrollView>

        <View style={styles.footer}>
          <Button
            label="다시 생성"
            onPress={handleRegenerate}
            variant="secondary"
            style={styles.footerBtn}
          />
          <Button
            label="발행하기"
            onPress={handlePublish}
            style={styles.footerBtn}
          />
        </View>
      </KeyboardAvoidingView>

      <LoadingOverlay visible={genStatus === 'running'} message="다시 작성하고 있어요..." />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backBtn: { width: 40 },
  backIcon: { fontSize: 20, color: Colors.textPrimary },
  title: {
    flex: 1,
    fontSize: 17,
    fontWeight: '600',
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  editBtn: { width: 40, alignItems: 'flex-end' },
  editBtnText: { fontSize: 15, color: Colors.primary, fontWeight: '600' },
  scroll: { flex: 1 },
  content: { padding: 20, paddingBottom: 40 },
  postTitle: { fontSize: 22, fontWeight: '700', color: Colors.textPrimary, lineHeight: 30 },
  titleInput: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary, backgroundColor: Colors.white, borderRadius: 12, padding: 14, borderWidth: 1.5, borderColor: Colors.primary },
  editHint: { fontSize: 12, color: Colors.textSecondary },
  labels: { fontSize: 13, color: Colors.primary, lineHeight: 20 },
  previewText: {
    fontSize: 15,
    color: Colors.textPrimary,
    lineHeight: 26,
  },
  editableText: {
    fontSize: 15,
    color: Colors.textPrimary,
    lineHeight: 26,
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    minHeight: 400,
    borderWidth: 1.5,
    borderColor: Colors.primary,
  },
  footer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  footerBtn: { flex: 1 },
});
