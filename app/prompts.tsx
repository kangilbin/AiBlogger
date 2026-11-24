import React, { useState } from 'react';
import {
  View, Text, TextInput, ScrollView, StyleSheet, Alert,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSettingsStore } from '@/stores/settingsStore';
import { Button } from '@/components/ui/Button';
import { Colors } from '@/constants/colors';
import type { PromptPreset } from '@/types';
import { Touchable } from '@/components/ui/Touchable';

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
      Alert.alert('입력 필요', '이름과 프롬프트를 모두 입력해주세요.');
      return;
    }
    store.savePreset(editing.id, { name: editing.name.trim(), prompt: editing.prompt.trim() });
    setEditing(null);
  };

  const confirmDelete = (p: PromptPreset) =>
    Alert.alert('스타일 삭제', `"${p.name}" 스타일을 삭제할까요?`, [
      { text: '취소', style: 'cancel' },
      { text: '삭제', style: 'destructive', onPress: () => { store.deletePreset(p.id); setEditing(null); } },
    ]);

  const confirmReset = (p: PromptPreset) =>
    Alert.alert('기본값으로 복원', '수정한 내용을 지우고 기본 프롬프트로 되돌릴까요?', [
      { text: '취소', style: 'cancel' },
      { text: '복원', onPress: () => { store.resetPreset(p.id); setEditing(null); } },
    ]);

  const current = editing?.id ? presets.find((p) => p.id === editing.id) : undefined;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Touchable onPress={() => (editing ? setEditing(null) : router.back())} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name={'arrow-back'} size={24} color={Colors.textPrimary} />
        </Touchable>
        <Text style={styles.title}>{editing ? (editing.id ? '스타일 편집' : '새 스타일') : '글쓰기 스타일'}</Text>
        <View style={{ width: 24 }} />
      </View>

      {editing ? (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">
            <Text style={styles.label}>이름</Text>
            <TextInput style={styles.input} value={editing.name} onChangeText={(t) => setEditing({ ...editing, name: t })} placeholder="예) 나만의 말투" placeholderTextColor={Colors.textDisabled} maxLength={20} />
            <Text style={styles.label}>프롬프트 (말투·구성 방식)</Text>
            <TextInput
              style={[styles.input, styles.area]}
              value={editing.prompt}
              onChangeText={(t) => setEditing({ ...editing, prompt: t })}
              placeholder={TEMPLATE}
              placeholderTextColor={Colors.textDisabled}
              multiline
              textAlignVertical="top"
              maxLength={1500}
            />
            <Text style={styles.count}>{editing.prompt.length}/1500</Text>
            <Text style={styles.hint}>사진·별점·메모를 반영하는 규칙은 앱이 자동으로 붙여요. 여기에는 말투와 글의 구성 방식만 적으면 돼요.</Text>
            <Button label="저장" onPress={save} fullWidth />
            {current?.builtin && store.isModified(current.id) && (
              <Button label="기본값으로 복원" variant="secondary" onPress={() => confirmReset(current)} fullWidth />
            )}
            {current && !current.builtin && (
              <Button label="삭제" variant="ghost" onPress={() => confirmDelete(current)} fullWidth />
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      ) : (
        <ScrollView contentContainerStyle={styles.list}>
          {presets.map((p) => (
            <Touchable key={p.id} style={styles.item} onPress={() => startEdit(p)} activeOpacity={0.7}>
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={styles.name}>
                  {p.name}
                  {p.builtin ? (store.isModified(p.id) ? '  · 수정됨' : '  · 기본') : '  · 내 스타일'}
                </Text>
                <Text style={styles.desc} numberOfLines={1}>{p.description}</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={Colors.textDisabled} />
            </Touchable>
          ))}
          <Button label="+ 내 글쓰기 스타일 추가" variant="secondary" onPress={startNew} fullWidth style={{ marginTop: 8 }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14, backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.border },
  title: { fontSize: 17, fontWeight: '600', color: Colors.textPrimary },
  list: { padding: 16, gap: 8 },
  item: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.white, borderRadius: 14, padding: 16 },
  name: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary },
  desc: { fontSize: 13, color: Colors.textSecondary },
  form: { padding: 20, gap: 10 },
  label: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary, marginTop: 4 },
  input: { backgroundColor: Colors.white, borderWidth: 1.5, borderColor: Colors.border, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, color: Colors.textPrimary },
  area: { minHeight: 220, lineHeight: 22 },
  count: { fontSize: 12, color: Colors.textDisabled, textAlign: 'right' },
  hint: { fontSize: 12, color: Colors.textSecondary, lineHeight: 18, marginBottom: 6 },
});
