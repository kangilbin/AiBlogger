import React, { useState } from 'react';
import {
  View, Text, TextInput, ScrollView, StyleSheet, Alert, Linking,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { Ionicons } from '@expo/vector-icons';
import { useSettingsStore } from '@/stores/settingsStore';
import { useAuthStore } from '@/stores/authStore';
import { validateGeminiKey, looksLikeGeminiKey, cleanGeminiKey } from '@/services/geminiService';
import { errorMessage } from '@/services/errors';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { Button } from '@/components/ui/Button';
import { Colors } from '@/constants/colors';
import { Touchable } from '@/components/ui/Touchable';

const AI_STUDIO_URL = 'https://aistudio.google.com/app/apikey';

const STEPS = [
  { title: 'Google AI Studio 열기', desc: '아래 버튼을 누르면 브라우저가 열려요. 블로그에 쓰는 구글 계정과 같은 계정으로 로그인하면 편해요.' },
  { title: '"API 키 만들기" 누르기', desc: '화면의 [API 키 만들기] 버튼을 누르고, 프로젝트를 물어보면 아무거나(없으면 "새 프로젝트")를 선택하세요.' },
  { title: '만들어진 키 복사하기', desc: '"AIza"로 시작하는 긴 문자열이 키예요. 복사 아이콘을 눌러 복사하세요.' },
  { title: '이 앱으로 돌아와 붙여넣기', desc: '아래 [붙여넣기] 버튼을 누르고 [확인하고 저장]을 누르면 끝!' },
];

const FAQ = [
  { q: '정말 무료인가요?', a: '네. 무료 사용량 안에서는 결제 수단 등록 없이 쓸 수 있어요. 한도를 넘으면 잠시 후 다시 시도하면 됩니다.' },
  { q: '내 키는 안전한가요?', a: '키는 이 기기의 보안 저장소에만 저장되고 우리 서버로 보내지 않아요 (서버가 없어요). 다른 사람에게 키를 공유하지는 마세요.' },
  { q: '키를 잘못 만들었거나 유출됐어요', a: 'AI Studio에서 해당 키를 삭제하고 새로 만든 뒤, 설정에서 다시 등록하면 돼요.' },
];

export default function GeminiGuideScreen() {
  const router = useRouter();
  const hasKey = useAuthStore((s) => s.hasGeminiKey);
  const saveGeminiKey = useSettingsStore((s) => s.saveGeminiKey);
  const [key, setKey] = useState('');
  const [busy, setBusy] = useState(false);
  const [show, setShow] = useState(true); // 붙여넣은 값을 눈으로 확인할 수 있게 기본은 보임
  const [error, setError] = useState<string | null>(null);

  const paste = async () => {
    const text = cleanGeminiKey(await Clipboard.getStringAsync());
    if (!text) {
      Alert.alert('클립보드가 비어 있어요', '먼저 AI Studio에서 키를 복사해주세요.');
      return;
    }
    setKey(text);
    setError(looksLikeGeminiKey(text) ? null : '키가 너무 짧거나 이상한 문자가 섞여 있어요. 키 전체를 다시 복사해주세요.');
  };

  const save = async () => {
    const k = cleanGeminiKey(key);
    if (!looksLikeGeminiKey(k)) {
      setError('키 형식이 올바르지 않아요. 키 전체를 복사했는지 확인해주세요(공백 없이 20자 이상).');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const ok = await validateGeminiKey(k);
      if (!ok) {
        setError('구글이 이 키를 거부했어요. 키를 다시 복사하거나, AI Studio에서 새 키를 만들어주세요.');
        return;
      }
      await saveGeminiKey(k);
      setKey('');
      Alert.alert('등록 완료', 'Gemini 키가 등록됐어요. 이제 글을 만들 수 있어요!', [
        { text: '확인', onPress: () => router.back() },
      ]);
    } catch (e) {
      setError(errorMessage(e, '저장에 실패했어요. 다시 시도해주세요.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader title="Gemini 키 등록" onBack={() => router.back()} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.intro}>
            <Text style={styles.introTitle}>AI가 글을 쓰려면 키가 필요해요</Text>
            <Text style={styles.introDesc}>
              글을 쓰는 AI(Gemini)를 쓰려면 내 구글 계정으로 발급한 API 키가 필요해요. 발급은 무료이고, 한 번만 등록하면 계속 쓸 수 있어요.
              {hasKey ? '\n(이미 등록된 키가 있어요. 새 키를 등록하면 교체돼요.)' : ''}
            </Text>
          </View>

          {STEPS.map((st, i) => (
            <View key={st.title} style={styles.step}>
              <View style={styles.num}><Text style={styles.numText}>{i + 1}</Text></View>
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={styles.stepTitle}>{st.title}</Text>
                <Text style={styles.stepDesc}>{st.desc}</Text>
                {i === 0 && (
                  <Button label="AI Studio 열기" variant="secondary" onPress={() => Linking.openURL(AI_STUDIO_URL)} style={styles.inlineBtn} />
                )}
              </View>
            </View>
          ))}

          <View style={styles.form}>
            <Text style={styles.label}>Gemini API 키</Text>
            <View style={styles.inputWrap}>
              <TextInput
                style={[styles.input, styles.inputFlex, error && styles.inputError]}
                value={key}
                onChangeText={(t) => { setKey(t); setError(null); }}
                placeholder="여기에 키를 붙여넣으세요"
                placeholderTextColor={Colors.textDisabled}
                autoCapitalize="none"
                autoCorrect={false}
                secureTextEntry={!show}
                multiline={false}
              />
              <Touchable style={styles.eye} onPress={() => setShow((v) => !v)} accessibilityLabel={show ? '키 숨기기' : '키 보기'}>
                <Ionicons name={show ? 'eye-off-outline' : 'eye-outline'} size={20} color={Colors.textSecondary} />
              </Touchable>
            </View>
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <View style={styles.row}>
              <Button label="붙여넣기" variant="secondary" onPress={paste} style={{ flex: 1 }} />
              <Button label="확인하고 저장" onPress={save} loading={busy} disabled={!key.trim()} style={{ flex: 2 }} />
            </View>
          </View>

          <Text style={styles.faqHeader}>자주 묻는 질문</Text>
          {FAQ.map((f) => (
            <View key={f.q} style={styles.faq}>
              <Text style={styles.q}>{f.q}</Text>
              <Text style={styles.a}>{f.a}</Text>
            </View>
          ))}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 20, gap: 14, paddingBottom: 48 },
  intro: { gap: 6, marginBottom: 4 },
  introTitle: { fontSize: 20, fontWeight: '700', color: Colors.textPrimary },
  introDesc: { fontSize: 14, color: Colors.textSecondary, lineHeight: 22 },
  step: { flexDirection: 'row', gap: 12, backgroundColor: Colors.white, borderRadius: 14, padding: 14 },
  num: { width: 26, height: 26, borderRadius: 13, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  numText: { color: Colors.white, fontWeight: '700', fontSize: 13 },
  stepTitle: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary },
  stepDesc: { fontSize: 13, color: Colors.textSecondary, lineHeight: 20 },
  inlineBtn: { alignSelf: 'flex-start', height: 38, paddingHorizontal: 18, marginTop: 6 },
  inputWrap: { justifyContent: 'center' },
  inputFlex: { paddingRight: 48 },
  eye: { position: 'absolute', right: 8, padding: 8 },
  form: { gap: 8, marginTop: 6 },
  label: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  input: { backgroundColor: Colors.white, borderWidth: 1.5, borderColor: Colors.border, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, color: Colors.textPrimary },
  inputError: { borderColor: Colors.error },
  error: { fontSize: 12, color: Colors.error, lineHeight: 18 },
  row: { flexDirection: 'row', gap: 10 },
  faqHeader: { fontSize: 14, fontWeight: '700', color: Colors.textSecondary, marginTop: 18 },
  faq: { backgroundColor: Colors.white, borderRadius: 14, padding: 14, gap: 4 },
  q: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  a: { fontSize: 13, color: Colors.textSecondary, lineHeight: 20 },
});
