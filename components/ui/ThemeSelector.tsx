import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/colors';
import { Radius, Typo } from '@/constants/styles';
import { Touchable } from '@/components/ui/Touchable';
import { useThemeStore } from '@/stores/themeStore';
import { allThemeLabels, applyThemeLabel, themeLabel } from '@/utils/theme';

interface Props {
  labels: string[];
  onChange: (labels: string[]) => void;
  hideTitle?: boolean;
}

/** 글에 붙일 테마 선택: 상위 → (있으면) 하위. 선택한 테마는 라벨 맨 앞에 들어감 */
export function ThemeSelector({ labels, onChange, hideTitle }: Props) {
  const router = useRouter();
  const themes = useThemeStore((s) => s.themes);
  const known = allThemeLabels(themes);

  // 현재 라벨 중 등록된 테마와 일치하는 것으로 선택 상태 복원
  const current = labels.find((l) => known.includes(l)) ?? null;
  const [parentName, subName] = current ? current.split('/') : [null, null];
  const parent = themes.find((t) => t.name === parentName) ?? null;

  const select = (next: string | null) => onChange(applyThemeLabel(labels, next, known));

  const Chip = ({ label, on, onPress }: { label: string; on: boolean; onPress: () => void }) => (
    <Touchable onPress={onPress} style={[styles.chip, on && styles.chipOn]} activeOpacity={0.7}>
      <Text style={[styles.label, on && styles.labelOn]}>{label}</Text>
    </Touchable>
  );

  return (
    <View style={{ gap: 8 }}>
      {!hideTitle && <Text style={styles.title}>카테고리</Text>}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        <Chip label="선택 안 함" on={!parent} onPress={() => select(null)} />
        {themes.map((t) => (
          <Chip key={t.id} label={t.name} on={parent?.id === t.id} onPress={() => select(themeLabel(t.name))} />
        ))}
        <Touchable onPress={() => router.push('/themes')} style={[styles.chip, styles.manage]} activeOpacity={0.7}>
          <Text style={styles.manageLabel}>편집·추가</Text>
        </Touchable>
      </ScrollView>

      {parent && parent.subs.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
          <Chip label="하위 없음" on={!subName} onPress={() => select(themeLabel(parent.name))} />
          {parent.subs.map((s) => (
            <Chip key={s.id} label={s.name} on={subName === s.name} onPress={() => select(themeLabel(parent.name, s.name))} />
          ))}
        </ScrollView>
      )}
      {current && <Text style={Typo.caption}>블로그 라벨: {current}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  title: { ...Typo.body, fontWeight: '600' },
  row: { gap: 8, paddingRight: 8 },
  chip: { paddingHorizontal: 16, height: 40, justifyContent: 'center', borderRadius: Radius.pill, backgroundColor: Colors.fill },
  chipOn: { backgroundColor: Colors.textPrimary },
  label: { fontSize: 14, fontWeight: '600', color: Colors.textSecondary },
  labelOn: { color: Colors.textInverse },
  manage: { backgroundColor: Colors.primaryLight },
  manageLabel: { fontSize: 14, color: Colors.primary, fontWeight: '600' },
});
