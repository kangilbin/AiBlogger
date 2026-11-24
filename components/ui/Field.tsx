import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '@/constants/colors';
import { Typo } from '@/constants/styles';

interface Props {
  label: string;
  /** '필수' | '선택' 표시 */
  tag?: 'required' | 'optional';
  hint?: string;
  error?: string | null;
  /** 라벨 오른쪽에 놓을 요소 (스위치 등) */
  right?: React.ReactNode;
  children?: React.ReactNode;
}

/** 라벨 + 입력 + 도움말을 묶는 폼 한 칸 */
export function Field({ label, tag, hint, error, right, children }: Props) {
  return (
    <View style={styles.field}>
      <View style={styles.head}>
        <Text style={styles.label}>
          {label}
          {tag === 'required' && <Text style={styles.required}>  필수</Text>}
          {tag === 'optional' && <Text style={styles.optional}>  선택</Text>}
        </Text>
        {right}
      </View>
      {children}
      {error ? <Text style={styles.error}>{error}</Text> : hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  field: { gap: 10 },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  label: { ...Typo.heading, fontSize: 15 },
  required: { fontSize: 13, fontWeight: '500', color: Colors.primary },
  optional: { fontSize: 13, fontWeight: '500', color: Colors.textTertiary },
  hint: { ...Typo.caption, color: Colors.textTertiary },
  error: { ...Typo.caption, color: Colors.error },
});
