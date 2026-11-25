import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '@/stores/themeStore';
import { Button } from '@/components/ui/Button';
import { Colors } from '@/constants/colors';
import { Typo, SCREEN_PADDING } from '@/constants/styles';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { ListRow } from '@/components/ui/ListRow';
import { TextField } from '@/components/ui/TextField';
import { Field } from '@/components/ui/Field';
import { Touchable } from '@/components/ui/Touchable';

export default function ThemesScreen() {
  const router = useRouter();
  const store = useThemeStore();
  const [openId, setOpenId] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [newSub, setNewSub] = useState('');
  const [nameDraft, setNameDraft] = useState('');

  const open = openId ? store.themes.find((t) => t.id === openId) : undefined;

  const show = (r: { ok: boolean; error?: string }) => {
    if (!r.ok) Alert.alert('확인해주세요', r.error);
    return r.ok;
  };

  const addTheme = () => {
    if (show(store.addTheme(newName))) setNewName('');
  };

  const addSub = () => {
    if (open && show(store.addSub(open.id, newSub))) setNewSub('');
  };

  const openTheme = (id: string, name: string) => {
    setOpenId(id);
    setNameDraft(name);
    setNewSub('');
  };

  const saveName = () => {
    if (open && nameDraft.trim() !== open.name) show(store.renameTheme(open.id, nameDraft));
  };

  const confirmDeleteTheme = () => {
    if (!open) return;
    Alert.alert('테마 삭제', `"${open.name}"와 하위 테마를 삭제할까요?\n이미 발행한 글의 라벨은 그대로 남아요.`, [
      { text: '취소', style: 'cancel' },
      { text: '삭제', style: 'destructive', onPress: () => { store.deleteTheme(open.id); setOpenId(null); } },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader title={open ? open.name : '테마 관리'} onBack={() => (open ? setOpenId(null) : router.back())} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          {open ? (
            <>
              <Field label="상위 테마 이름">
                <TextField value={nameDraft} onChangeText={setNameDraft} onEndEditing={saveName} onBlur={saveName} maxLength={20} />
              </Field>

              <Field label="하위 테마" hint="글을 발행하면 '상위/하위' 라벨로 붙어요.">
                {open.subs.map((s) => (
                  <ListRow
                    key={s.id}
                    title={s.name}
                    chevron={false}
                    right={
                      <Touchable
                        hitSlop={10}
                        onPress={() =>
                          Alert.alert('하위 테마 삭제', `"${s.name}"를 삭제할까요?`, [
                            { text: '취소', style: 'cancel' },
                            { text: '삭제', style: 'destructive', onPress: () => store.deleteSub(open.id, s.id) },
                          ])
                        }
                      >
                        <Ionicons name="close-circle" size={22} color={Colors.textDisabled} />
                      </Touchable>
                    }
                  />
                ))}
                <View style={styles.addRow}>
                  <TextField style={{ flex: 1 }} value={newSub} onChangeText={setNewSub} placeholder="하위 테마 이름 (예: 국내)" maxLength={20} onSubmitEditing={addSub} />
                  <Button label="추가" onPress={addSub} />
                </View>
              </Field>

              <Button label="이 테마 삭제" variant="danger" onPress={confirmDeleteTheme} fullWidth />
            </>
          ) : (
            <>
              <Text style={Typo.caption}>
                글을 쓸 때 고른 테마가 블로그 라벨로 붙어요. 이름을 바꾸거나 삭제해도 이미 발행된 글의 라벨은 바뀌지 않아요.
              </Text>
              {store.themes.length === 0 && <Text style={styles.empty}>아직 테마가 없어요. 아래에서 추가해보세요.</Text>}
              <View>
                {store.themes.map((t) => (
                  <ListRow
                    key={t.id}
                    title={t.name}
                    subtitle={t.subs.length ? t.subs.map((s) => s.name).join(', ') : '하위 테마 없음'}
                    onPress={() => openTheme(t.id, t.name)}
                  />
                ))}
              </View>
              <View style={styles.addRow}>
                <TextField style={{ flex: 1 }} value={newName} onChangeText={setNewName} placeholder="상위 테마 이름 (예: 여행)" maxLength={20} onSubmitEditing={addTheme} />
                <Button label="추가" onPress={addTheme} />
              </View>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  content: { paddingHorizontal: SCREEN_PADDING, paddingTop: 8, paddingBottom: 40, gap: 20 },
  addRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  empty: { ...Typo.body, color: Colors.textTertiary, textAlign: 'center', paddingVertical: 24 },
});
