import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Alert, Linking,
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
import { Radius, Typo, SCREEN_PADDING } from '@/constants/styles';
import { TextField } from '@/components/ui/TextField';
import { Field } from '@/components/ui/Field';
import { BottomBar } from '@/components/ui/BottomBar';
import { Touchable } from '@/components/ui/Touchable';

const AI_STUDIO_URL = 'https://aistudio.google.com/app/apikey';

const STEPS = [
  { title: 'Google AI Studio 열기', desc: '아래 버튼을 누르면 브라우저가 열립니다. 블로그에 사용하는 구글 계정과 같은 계정으로 로그인하는 것을 권장합니다.' },
  { title: '"API 키 만들기" 누르기', desc: '화면의 [API 키 만들기] 버튼을 누르고, 프로젝트를 묻는 경우 아무 프로젝트(없으면 "새 프로젝트")를 선택하세요.' },
  { title: '만들어진 키 복사하기', desc: '"AIza"로 시작하는 긴 문자열이 키입니다. 복사 아이콘을 눌러 복사하세요.' },
  { title: '이 앱으로 돌아와 붙여넣기', desc: '아래 [붙여넣기] 버튼을 누르고 [확인하고 저장]을 누르면 끝!' },
];

const FAQ = [
  { q: '정말 무료입니까?', a: '네. 무료 사용량 범위 내에서는 결제 수단 등록 없이 사용할 수 있습니다. 한도를 초과하면 잠시 후 다시 시도해 주세요.' },
  { q: '내 키는 안전합니까?', a: '키는 이 기기의 보안 저장소에만 저장되며 외부 서버로 전송되지 않습니다. 다른 사람에게 키를 공유하지 마세요.' },
  { q: '키를 잘못 만들었거나 유출된 경우', a: 'AI Studio에서 해당 키를 삭제하고 새로 만든 뒤, 설정에서 다시 등록하세요.' },
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
      Alert.alert('클립보드가 비어 있습니다', '먼저 AI Studio에서 키를 복사해 주세요.');
      return;
    }
    setKey(text);
    setError(looksLikeGeminiKey(text) ? null : '키가 너무 짧거나 올바르지 않은 문자가 포함되어 있습니다. 키 전체를 다시 복사해 주세요.');
  };

  const save = async () => {
    const k = cleanGeminiKey(key);
    if (!looksLikeGeminiKey(k)) {
      setError('키 형식이 올바르지 않습니다. 키 전체를 복사했는지 확인해 주세요(공백 없이 20자 이상).');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const ok = await validateGeminiKey(k);
      if (!ok) {
        setError('구글에서 이 키를 거부했습니다. 키를 다시 복사하거나 AI Studio에서 새 키를 만들어 주세요.');
        return;
      }
      await saveGeminiKey(k);
      setKey('');
      Alert.alert('등록 완료', 'Gemini 키가 등록되었습니다. 이제 글을 작성할 수 있습니다.', [
        { text: '확인', onPress: () => router.back() },
      ]);
    } catch (e) {
      setError(errorMessage(e, '저장에 실패했습니다. 다시 시도해 주세요.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader title="Gemini 키 등록" onBack={() => router.back()} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={styles.intro}>
            <Text style={Typo.display}>AI 글 작성에{'\n'}키가 필요합니다</Text>
            <Text style={styles.introDesc}>
              내 구글 계정으로 발급한 Gemini API 키가 필요합니다. 발급은 무료이며, 한 번만 등록하면 계속 사용할 수 있습니다.
              {hasKey ? '\n이미 등록된 키가 있습니다. 새 키를 등록하면 교체됩니다.' : ''}
            </Text>
          </View>

          <View style={{ gap: 20 }}>
            {STEPS.map((st, i) => (
              <View key={st.title} style={styles.step}>
                <View style={styles.num}><Text style={styles.numText}>{i + 1}</Text></View>
                <View style={{ flex: 1, gap: 4 }}>
                  <Text style={styles.stepTitle}>{st.title}</Text>
                  <Text style={Typo.caption}>{st.desc}</Text>
                  {i === 0 && (
                    <Button label="AI Studio 열기" variant="secondary" size="md" onPress={() => Linking.openURL(AI_STUDIO_URL)} style={styles.inlineBtn} />
                  )}
                </View>
              </View>
            ))}
          </View>

          <Field label="Gemini API 키" error={error}>
            <View style={styles.inputWrap}>
              <TextField
                style={styles.inputFlex}
                error={!!error}
                value={key}
                onChangeText={(t) => { setKey(t); setError(null); }}
                placeholder="여기에 키를 붙여넣어 주세요"
                autoCapitalize="none"
                autoCorrect={false}
                secureTextEntry={!show}
                multiline={false}
              />
              <Touchable style={styles.eye} onPress={() => setShow((v) => !v)} accessibilityLabel={show ? '키 숨기기' : '키 보기'}>
                <Ionicons name={show ? 'eye-off-outline' : 'eye-outline'} size={20} color={Colors.textTertiary} />
              </Touchable>
            </View>
          </Field>

          <View style={{ gap: 10 }}>
            <Text style={Typo.heading}>자주 묻는 질문</Text>
            {FAQ.map((f) => (
              <View key={f.q} style={styles.faq}>
                <Text style={styles.q}>{f.q}</Text>
                <Text style={Typo.caption}>{f.a}</Text>
              </View>
            ))}
          </View>
        </ScrollView>

        <BottomBar row>
          <Button label="붙여넣기" variant="secondary" onPress={paste} style={{ flex: 1 }} />
          <Button label="확인하고 저장" onPress={save} loading={busy} disabled={!key.trim()} style={{ flex: 2 }} />
        </BottomBar>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  content: { paddingHorizontal: SCREEN_PADDING, paddingTop: 8, paddingBottom: 32, gap: 32 },
  intro: { gap: 12 },
  introDesc: { ...Typo.body, fontSize: 16, color: Colors.textSecondary },
  step: { flexDirection: 'row', gap: 14 },
  num: { width: 28, height: 28, borderRadius: 14, backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  numText: { color: Colors.primary, fontWeight: '700', fontSize: 14 },
  stepTitle: { ...Typo.body, fontSize: 16, fontWeight: '600', marginTop: 3 },
  inlineBtn: { alignSelf: 'flex-start', marginTop: 8 },
  inputWrap: { justifyContent: 'center' },
  inputFlex: { paddingRight: 48 },
  eye: { position: 'absolute', right: 8, padding: 8 },
  faq: { backgroundColor: Colors.fill, borderRadius: Radius.md, padding: 16, gap: 6 },
  q: { ...Typo.body, fontWeight: '600' },
});
