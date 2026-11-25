import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Touchable } from '@/components/ui/Touchable';
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
  /** true면 제목 줄을 눌러야 입력칸이 펼쳐짐(선택 항목용). 값이 있으면(filled) 항상 펼쳐 둠 */
  collapsible?: boolean;
  filled?: boolean;
  children?: React.ReactNode;
}

/** 라벨 + 입력 + 도움말을 묶는 폼 한 칸 */
export function Field({ label, tag, hint, error, right, collapsible, filled, children }: Props) {
  const [manual, setManual] = useState(false);
  const open = !collapsible || manual || !!filled;
  const toggleable = !!collapsible && !filled;
  const Head = toggleable ? Touchable : View;
  return (
    <View style={styles.field}>
      <Head
        style={styles.head}
        {...(toggleable ? { onPress: () => setManual((v) => !v), activeOpacity: 0.7 } : {})}
      >
        <Text style={styles.label}>
          {label}
          {tag === 'required' && <Text style={styles.required}>  필수</Text>}
          {tag === 'optional' && <Text style={styles.optional}>  선택</Text>}
        </Text>
        {right}
        {toggleable && <Ionicons name={manual ? 'chevron-up' : 'chevron-down'} size={20} color={Colors.textTertiary} />}
      </Head>
      {open && children}
      {open && (error ? <Text style={styles.error}>{error}</Text> : hint ? <Text style={styles.hint}>{hint}</Text> : null)}
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
