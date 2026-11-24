import React, { useMemo, useRef, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import {
  View, Text, TextInput, ScrollView, StyleSheet,
  Alert, KeyboardAvoidingView, Platform, Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { usePostStore } from '@/stores/postStore';
import { useAuthStore } from '@/stores/authStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { PlaceSearch } from '@/components/ui/PlaceSearch';
import { PhotoList } from '@/components/ui/PhotoList';
import { StarRating } from '@/components/ui/StarRating';
import { PresetSelector } from '@/components/ui/PresetSelector';
import { Button } from '@/components/ui/Button';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { Colors } from '@/constants/colors';
import { MAX_PHOTOS } from '@/constants/api';
import { Touchable } from '@/components/ui/Touchable';

export default function CreateScreen() {
  const router = useRouter();
  const scrollRef = useRef<ScrollView>(null);
  const scrollYRef = useRef(0);
  const [dragging, setDragging] = useState(false);
  const hasGeminiKey = useAuthStore((s) => s.hasGeminiKey);
  // 필요한 값만 구독해 입력 중 불필요한 전체 리렌더를 줄임
  const {
    photos, placeName, place, showMap, rating, summary, notes, extraPrompt, genStatus,
    addPhotos, removePhoto, movePhoto, setPhotoNote, setPhotoJoin, joinPhoto, setField, startGeneration,
  } = usePostStore(
    useShallow((s) => ({
      photos: s.photos, placeName: s.placeName, place: s.place, showMap: s.showMap, rating: s.rating,
      summary: s.summary, notes: s.notes, extraPrompt: s.extraPrompt, genStatus: s.genStatus,
      addPhotos: s.addPhotos, removePhoto: s.removePhoto, movePhoto: s.movePhoto, setPhotoNote: s.setPhotoNote,
      setPhotoJoin: s.setPhotoJoin, joinPhoto: s.joinPhoto, setField: s.setField, startGeneration: s.startGeneration,
    }))
  );
  const selectedId = useSettingsStore((s) => s.selectedId);
  const selectPreset = useSettingsStore((s) => s.selectPreset);
  // overrides/custom 변경 시에만 재계산
  const overrides = useSettingsStore((s) => s.overrides);
  const custom = useSettingsStore((s) => s.custom);
  const presets = useMemo(() => useSettingsStore.getState().presets(), [overrides, custom]);

  const [placeError, setPlaceError] = useState<string | null>(null);

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('권한 필요', '사진 라이브러리 접근 권한이 필요합니다.');
      return;
    }
    const remain = MAX_PHOTOS - photos.length;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: remain,
      orderedSelection: true,
      quality: 1,
    });
    if (result.canceled) return;
    // 업로드/분석 시 필요한 크기로 줄이므로 원본 URI만 보관
    addPhotos(result.assets.slice(0, remain).map((a) => a.uri));
  };

  const validate = () => {
    if (photos.length === 0) { Alert.alert('사진 필요', '사진을 최소 1장 추가해주세요.'); return false; }
    if (!placeName.trim()) { setPlaceError('장소명을 입력해주세요.'); return false; }
    if (rating === 0) { Alert.alert('별점 필요', '별점을 선택해주세요.'); return false; }
    return true;
  };

  const handleGenerate = () => {
    if (!hasGeminiKey) {
      Alert.alert('Gemini 키 필요', 'AI(Gemini)가 글을 쓰려면 내 Gemini API 키가 필요해요. 발급 방법을 안내해 드릴게요.', [
        { text: '취소', style: 'cancel' },
        { text: '등록하러 가기', onPress: () => router.push('/gemini-guide') },
      ]);
      return;
    }
    if (!validate()) return;

    // 백그라운드로 시작하고 홈으로 — 진행/완료는 상단 배너로 알려줌
    startGeneration();
    router.replace('/(main)');
  };

  // 생성 중 입력을 바꾸면 결과(사진 순서 등)와 어긋나므로 완료될 때까지 잠금
  if (genStatus === 'running') {
    return (
      <SafeAreaView style={styles.container}>
        <ScreenHeader title="새 블로그 글" onBack={() => router.back()} />
        <View style={styles.lockBox}>
          <Ionicons name="hourglass-outline" size={36} color={Colors.textDisabled} />
          <Text style={styles.lockTitle}>글을 작성하고 있어요</Text>
          <Text style={styles.lockDesc}>완료되면 상단에 알려드려요.{'\n'}그동안 다른 화면을 둘러보셔도 돼요.</Text>
          <Button label="홈으로" variant="secondary" onPress={() => router.replace('/(main)')} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader title="새 블로그 글" onBack={() => router.back()} />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView ref={scrollRef} scrollEnabled={!dragging} scrollEventThrottle={16} onScroll={(e) => { scrollYRef.current = e.nativeEvent.contentOffset.y; }} style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>사진 <Text style={styles.required}>*</Text></Text>
            <Text style={styles.hint}>글에 들어갈 순서대로 추가하세요. 같은 음식 사진처럼 한꺼번에 보여주고 싶으면 사진을 길게 눌러 묶을 사진 위로 끌어다 놓으세요. 묶인 사진은 한 줄로 보여요. 사진마다 메모를 남기면 AI가 맥락에 맞춰 써줘요.</Text>
            <PhotoList photos={photos} maxCount={MAX_PHOTOS} onAdd={handlePickImage} onRemove={removePhoto} onMove={movePhoto} onNote={setPhotoNote} onJoin={setPhotoJoin} onGroup={joinPhoto} onDragChange={setDragging} scrollRef={scrollRef} scrollYRef={scrollYRef} />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>장소명 <Text style={styles.required}>*</Text></Text>
            <TextInput
              style={[styles.input, placeError && styles.inputError]}
              placeholder="예) 성수 카페 이름"
              placeholderTextColor={Colors.textDisabled}
              value={placeName}
              onChangeText={(t) => { setField({ placeName: t }); setPlaceError(null); }}
              maxLength={50}
              returnKeyType="done"
            />
            {placeError ? <Text style={styles.errorText}>{placeError}</Text> : null}
          </View>

          <View style={styles.section}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={styles.sectionLabel}>📍 글에 지도 넣기</Text>
              <Switch value={showMap} onValueChange={(v) => setField({ showMap: v })} />
            </View>
            {showMap && (
              <>
                <PlaceSearch
                  value={place}
                  initialQuery={placeName}
                  onChange={(p) => setField(p ? { place: p, placeName: placeName.trim() || p.name } : { place: null })}
                />
                <Text style={styles.hint}>검색해서 고르면 발행할 때 글 맨 아래에 그 위치의 구글 지도가 붙어요. 고르지 않으면 장소명으로 지도를 검색해요.</Text>
              </>
            )}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>별점 <Text style={styles.required}>*</Text></Text>
            <StarRating value={rating} onChange={(v) => setField({ rating: v })} />
            <Text style={styles.hint}>별점에 따라 글의 평가 톤이 달라져요 (낮으면 아쉬운 점 중심).</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>한줄평 <Text style={styles.optional}>(선택)</Text></Text>
            <TextInput
              style={styles.input}
              placeholder="예) 분위기는 최고인데 직원이 좀 불친절했어요"
              placeholderTextColor={Colors.textDisabled}
              value={summary}
              onChangeText={(t) => setField({ summary: t })}
              maxLength={100}
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>특이사항 <Text style={styles.optional}>(선택)</Text></Text>
            <TextInput
              style={[styles.input, styles.textarea]}
              placeholder={'예) 매장이 지저분했음, 웨이팅 40분, 주차 불가'}
              placeholderTextColor={Colors.textDisabled}
              value={notes}
              onChangeText={(t) => setField({ notes: t })}
              multiline
              textAlignVertical="top"
              maxLength={300}
            />
            <Text style={styles.charCount}>{notes.length}/300</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>글쓰기 스타일</Text>
            <PresetSelector presets={presets} selectedId={selectedId} onSelect={selectPreset} onManage={() => router.push('/prompts')} />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>이번 글만 추가 요청 <Text style={styles.optional}>(선택)</Text></Text>
            <TextInput
              style={[styles.input, styles.textarea]}
              placeholder={'예) 1000자 내외로, 마지막에 재방문 의사 포함'}
              placeholderTextColor={Colors.textDisabled}
              value={extraPrompt}
              onChangeText={(t) => setField({ extraPrompt: t })}
              multiline
              textAlignVertical="top"
              maxLength={300}
            />
          </View>

          <Button label="AI 글 생성하기" onPress={handleGenerate} fullWidth style={{ marginTop: 8 }} />
        </ScrollView>
      </KeyboardAvoidingView>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  lockBox: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, padding: 32 },
  lockTitle: { fontSize: 17, fontWeight: '700', color: Colors.textPrimary },
  lockDesc: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22, marginBottom: 8 },
  container: { flex: 1, backgroundColor: Colors.background },
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
  scroll: { flex: 1 },
  content: { padding: 20, gap: 24, paddingBottom: 48 },
  section: { gap: 8 },
  sectionLabel: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary },
  required: { color: Colors.error },
  optional: { color: Colors.textSecondary, fontWeight: '400', fontSize: 13 },
  hint: { fontSize: 12, color: Colors.textDisabled },
  input: {
    backgroundColor: Colors.white,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: Colors.textPrimary,
  },
  inputError: { borderColor: Colors.error },
  textarea: { height: 88, paddingTop: 14 },
  errorText: { fontSize: 12, color: Colors.error },
  charCount: { fontSize: 12, color: Colors.textDisabled, textAlign: 'right' },
});