import React from 'react';
import { Text, ActivityIndicator, StyleSheet, ViewStyle } from 'react-native';
import { Colors } from '@/constants/colors';
import { Radius } from '@/constants/styles';
import { Touchable } from '@/components/ui/Touchable';

interface ButtonProps {
  label: string;
  onPress: () => void;
  /** primary: 파랑 채움 / secondary: 연한 파랑 / ghost: 글자만 / danger: 연한 빨강 */
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  /** lg: 56px 하단 CTA / md: 44px 인라인 */
  size?: 'lg' | 'md';
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'lg',
  disabled = false,
  loading = false,
  fullWidth = false,
  style,
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <Touchable
      onPress={onPress}
      disabled={isDisabled}
      style={[
        styles.base,
        size === 'md' ? styles.md : styles.lg,
        styles[variant],
        fullWidth && styles.fullWidth,
        isDisabled && styles.disabled,
        style,
      ]}
      pressScale={0.98}
    >
      {loading ? (
        <ActivityIndicator size="small" color={variant === 'primary' ? Colors.textInverse : Colors.primary} />
      ) : (
        <Text style={[styles.label, size === 'md' && styles.labelMd, styles[`${variant}Label`]]}>{label}</Text>
      )}
    </Touchable>
  );
}

const styles = StyleSheet.create({
  base: { alignItems: 'center', justifyContent: 'center' },
  lg: { height: 56, borderRadius: Radius.md, paddingHorizontal: 20 },
  md: { height: 44, borderRadius: Radius.sm, paddingHorizontal: 16 },
  fullWidth: { width: '100%' },
  disabled: { opacity: 0.4 },
  primary: { backgroundColor: Colors.primary },
  secondary: { backgroundColor: Colors.primaryLight },
  ghost: { backgroundColor: 'transparent' },
  danger: { backgroundColor: Colors.errorLight },
  label: { fontSize: 17, fontWeight: '600' },
  labelMd: { fontSize: 15 },
  primaryLabel: { color: Colors.textInverse },
  secondaryLabel: { color: Colors.primary },
  ghostLabel: { color: Colors.textSecondary },
  dangerLabel: { color: Colors.error },
});
