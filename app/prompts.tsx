import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Alert,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useSettingsStore } from '@/stores/settingsStore';
import { Button } from '@/components/ui/Button';
import { Colors } from '@/constants/colors';
import { Typo, SCREEN_PADDING } from '@/constants/styles';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { ListRow } from '@/components/ui/ListRow';
import { TextField } from '@/components/ui/TextField';
import { Field } from '@/components/ui/Field';
import { BottomBar } from '@/components/ui/BottomBar';
import type { PromptPreset } from '@/types';

type Editing = { id: string | null; name: string; prompt: string } | null;

const TEMPLATE = `예) 20대 직장인이 쓰는 듯한 가벼운 ~했어요체.
- 문단은 2~3문장으로 짧게
- 마지막에 한 줄 요약
- 이모지 사용 금지`;

export default function PromptsScreen() {
  const router = useRouter();
  const store = useSettingsStore();
  const presets = store.presets();
  const [editing, setEditing] = useState<Editing>(null);

  const startEdit = (p: PromptPreset) => setEditing({ id: p.id, name: p.name, prompt: p.prompt });
  const startNew = () => setEditing({ id: null, name: '', prompt: '' });

  const save = () => {
    if (!editing) return;
    if (!editing.name.trim() || !editing.prompt.trim()) {
      Alert.alert('입력 필요', '이름과 프롬프트를 모두 입력해 주세요.');
      return;
    }
    store.savePreset(editing.id, { name: editing.name.trim(), prompt: editing.prompt.trim() });
    setEditing(null);
  };

  const confirmDelete = (p: PromptPreset) =>
    Alert.alert('스타일 삭제', `"${p.name}" 스타일을 삭제하시겠습니까?`, [
      { text: '취소', style: 'cancel' },
      { text: '삭제', style: 'destructive', onPress: () => { store.deletePreset(p.id); setEditing(null); } },
    ]);

  const confirmReset = (p: PromptPreset) =>
    Alert.alert('기본값으로 복원', '수정한 내용을 지우고 기본 프롬프트로 되돌리시겠습니까?', [
      { text: '취소', style: 'cancel' },
      { text: '복원', onPress: () => { store.resetPreset(p.id); setEditing(null); } },
    ]);

  const current = editing?.id ? presets.find((p) => p.id === editing.id) : undefined;

  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader
        title={editing ? (editing.id ? '스타일 편집' : '새 스타일') : '글쓰기 스타일'}
        onBack={() => (editing ? setEditing(null) : router.back())}
      />

      {editing ? (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <Field label="이름">
              <TextField value={editing.name} onChangeText={(t) => setEditing({ ...editing, name: t })} placeholder="예) 나만의 말투" maxLength={20} />
            </Field>
            <Field
              label="프롬프트"
              hint="사진·별점·메모를 반영하는 규칙은 앱이 자동으로 추가합니다. 여기에는 말투와 글의 구성 방식만 입력하세요."
              right={<Text style={styles.count}>{editing.prompt.length}/1500</Text>}
            >
              <TextField
                style={styles.area}
                value={editing.prompt}
                onChangeText={(t) => setEditing({ ...editing, prompt: t })}
                placeholder={TEMPLATE}
                multiline
                maxLength={1500}
              />
            </Field>
          </ScrollView>
          <BottomBar>
            <Button label="저장" onPress={save} fullWidth />
            {current?.builtin && store.isModified(current.id) && (
              <Button label="기본값으로 복원" variant="secondary" onPress={() => confirmReset(current)} fullWidth />
            )}
            {current && !current.builtin && (
              <Button label="삭제" variant="danger" onPress={() => confirmDelete(current)} fullWidth />
            )}
          </BottomBar>
        </KeyboardAvoidingView>
      ) : (
        <>
          <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
            {presets.map((p) => (
              <ListRow
                key={p.id}
                title={p.name}
                subtitle={p.description}
                right={p.builtin ? (store.isModified(p.id) ? '수정됨' : '기본') : '내 스타일'}
                onPress={() => startEdit(p)}
              />
            ))}
          </ScrollView>
          <BottomBar>
            <Button label="내 글쓰기 스타일 추가" onPress={startNew} fullWidth />
          </BottomBar>
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  list: { paddingHorizontal: SCREEN_PADDING, paddingBottom: 16 },
  form: { paddingHorizontal: SCREEN_PADDING, paddingTop: 8, paddingBottom: 24, gap: 24 },
  area: { minHeight: 240 },
  count: Typo.caption,
});
