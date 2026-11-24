import React, { useState } from 'react';
import { TextInput, TextInputProps, StyleSheet } from 'react-native';
import { Colors } from '@/constants/colors';
import { Radius } from '@/constants/styles';

interface Props extends TextInputProps {
  error?: boolean;
}

/** 회색 채움 입력창. 포커스되면 파란 테두리, 오류면 빨간 테두리 */
export const TextField = React.forwardRef<TextInput, Props>(function TextField(
  { style, error, onFocus, onBlur, multiline, ...rest },
  ref
) {
  const [focused, setFocused] = useState(false);
  return (
    <TextInput
      ref={ref}
      {...rest}
      multiline={multiline}
      placeholderTextColor={Colors.textDisabled}
      onFocus={(e) => { setFocused(true); onFocus?.(e); }}
      onBlur={(e) => { setFocused(false); onBlur?.(e); }}
      style={[
        styles.input,
        multiline && styles.multiline,
        focused && styles.focused,
        error && styles.error,
        style,
      ]}
    />
  );
});

const styles = StyleSheet.create({
  input: {
    backgroundColor: Colors.fill,
    borderRadius: Radius.sm,
    borderWidth: 1.5,
    borderColor: 'transparent',
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: Colors.textPrimary,
  },
  multiline: { minHeight: 96, paddingTop: 14, textAlignVertical: 'top', lineHeight: 22 },
  focused: { borderColor: Colors.primary, backgroundColor: Colors.bg },
  error: { borderColor: Colors.error },
});
