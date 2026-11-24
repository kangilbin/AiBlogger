import React, { useMemo, useRef, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import {
  View, Text, ScrollView, StyleSheet,
  Alert, KeyboardAvoidingView, Platform, Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
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
import { Typo, SCREEN_PADDING } from '@/constants/styles';
import { TextField } from '@/components/ui/TextField';
import { Field } from '@/components/ui/Field';
import { BottomBar } from '@/components/ui/BottomBar';
import { MAX_PHOTOS } from '@/constants/api';

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

  // 이미 글이 생성(이력에 저장)된 뒤 새 글 탭에 오면 입력을 모두 비워 새로 시작.
  // 생성 중이거나 아직 결과가 없는 입력(실패 후 재시도 등)은 그대로 둔다.
  useFocusEffect(
    React.useCallback(() => {
      const s = usePostStore.getState();
      if (s.genStatus !== 'running' && s.body.trim()) {
        s.resetForm();
        setPlaceError(null);
      }
    }, [])
  );

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
          <Ionicons name="hourglass-outline" size={40} color={Colors.textDisabled} />
          <Text style={styles.lockTitle}>글 작성 중...</Text>
          <Text style={styles.lockDesc}>완료되면 상단에 알려드려요.</Text>
        </View>
        <BottomBar>
          <Button label="홈으로" variant="secondary" onPress={() => router.replace('/(main)')} fullWidth />
        </BottomBar>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader title="새 블로그 글" onBack={() => router.back()} />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView ref={scrollRef} scrollEnabled={!dragging} scrollEventThrottle={16} onScroll={(e) => { scrollYRef.current = e.nativeEvent.contentOffset.y; }} style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <Text style={Typo.display}>어디를{'\n'}다녀오셨나요?</Text>

          <Field
            label="사진"
            tag="required"
            hint="글에 들어갈 순서대로 추가하세요. 같은 음식 사진처럼 한꺼번에 보여주고 싶으면 사진을 길게 눌러 묶을 사진 위로 끌어다 놓으세요. 사진마다 메모를 남기면 AI가 맥락에 맞춰 써줘요."
          >
            <PhotoList photos={photos} maxCount={MAX_PHOTOS} onAdd={handlePickImage} onRemove={removePhoto} onMove={movePhoto} onNote={setPhotoNote} onJoin={setPhotoJoin} onGroup={joinPhoto} onDragChange={setDragging} scrollRef={scrollRef} scrollYRef={scrollYRef} />
          </Field>

          <Field label="장소명" tag="required" error={placeError}>
            <TextField
              error={!!placeError}
              placeholder="예) 성수 카페 이름"
              value={placeName}
              onChangeText={(t) => { setField({ placeName: t }); setPlaceError(null); }}
              maxLength={50}
              returnKeyType="done"
            />
          </Field>

          <Field
            label="글에 지도 넣기"
            right={<Switch value={showMap} onValueChange={(v) => setField({ showMap: v })} trackColor={{ true: Colors.primary, false: Colors.fillStrong }} />}
            hint={showMap ? '검색해서 고르면 발행할 때 글 맨 아래에 그 위치의 구글 지도가 붙어요. 고르지 않으면 장소명으로 지도를 검색해요.' : undefined}
          >
            {showMap && (
              <PlaceSearch
                value={place}
                initialQuery={placeName}
                onChange={(p) => setField(p ? { place: p, placeName: placeName.trim() || p.name } : { place: null })}
              />
            )}
          </Field>

          <Field label="별점" tag="required" hint="별점에 따라 글의 평가 톤이 달라져요. 낮으면 아쉬운 점 중심으로 써요.">
            <StarRating value={rating} onChange={(v) => setField({ rating: v })} />
          </Field>

          <Field label="한줄평" tag="optional">
            <TextField
              placeholder="예) 분위기는 최고인데 직원이 좀 불친절했어요"
              value={summary}
              onChangeText={(t) => setField({ summary: t })}
              maxLength={100}
            />
          </Field>

          <Field label="특이사항" tag="optional" right={<Text style={styles.count}>{notes.length}/300</Text>}>
            <TextField
              placeholder={'예) 매장이 지저분했음, 웨이팅 40분, 주차 불가'}
              value={notes}
              onChangeText={(t) => setField({ notes: t })}
              multiline
              maxLength={300}
            />
          </Field>

          <Field label="글쓰기 스타일">
            <PresetSelector presets={presets} selectedId={selectedId} onSelect={selectPreset} onManage={() => router.push('/prompts')} />
          </Field>

          <Field label="이번 글만 추가 요청" tag="optional">
            <TextField
              placeholder={'예) 1000자 내외로, 마지막에 재방문 의사 포함'}
              value={extraPrompt}
              onChangeText={(t) => setField({ extraPrompt: t })}
              multiline
              maxLength={300}
            />
          </Field>
        </ScrollView>

        <BottomBar>
          <Button label="AI 글 생성하기" onPress={handleGenerate} fullWidth />
        </BottomBar>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  scroll: { flex: 1 },
  content: { paddingHorizontal: SCREEN_PADDING, paddingTop: 8, paddingBottom: 32, gap: 32 },
  count: Typo.caption,
  lockBox: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, padding: 32 },
  lockTitle: { ...Typo.title, marginTop: 8 },
  lockDesc: { ...Typo.body, color: Colors.textSecondary, textAlign: 'center' },
});
