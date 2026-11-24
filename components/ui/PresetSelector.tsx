import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { Colors } from '@/constants/colors';
import { Radius } from '@/constants/styles';
import type { PromptPreset } from '@/types';
import { Touchable } from '@/components/ui/Touchable';

interface Props {
  presets: PromptPreset[];
  selectedId: string;
  onSelect: (id: string) => void;
  onManage: () => void;
}

export function PresetSelector({ presets, selectedId, onSelect, onManage }: Props) {
  const selected = presets.find((p) => p.id === selectedId) ?? presets[0];
  return (
    <View style={{ gap: 8 }}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {presets.map((p) => {
          const on = p.id === selected.id;
          return (
            <Touchable key={p.id} onPress={() => onSelect(p.id)} style={[styles.chip, on && styles.chipOn]} activeOpacity={0.7}>
              <Text style={[styles.label, on && styles.labelOn]}>{p.name}</Text>
            </Touchable>
          );
        })}
        <Touchable onPress={onManage} style={[styles.chip, styles.manage]} activeOpacity={0.7}>
          <Text style={styles.manageLabel}>편집·추가</Text>
        </Touchable>
      </ScrollView>
      <Text style={styles.desc}>{selected.description}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { gap: 8, paddingRight: 8 },
  chip: { paddingHorizontal: 16, height: 40, justifyContent: 'center', borderRadius: Radius.pill, backgroundColor: Colors.fill },
  chipOn: { backgroundColor: Colors.textPrimary },
  label: { fontSize: 14, fontWeight: '600', color: Colors.textSecondary },
  labelOn: { color: Colors.textInverse },
  manage: { backgroundColor: Colors.primaryLight },
  manageLabel: { fontSize: 14, color: Colors.primary, fontWeight: '600' },
  desc: { fontSize: 13, color: Colors.textTertiary },
});
