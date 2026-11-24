import React from 'react';
import { Pressable, PressableProps, StyleProp, ViewStyle } from 'react-native';

interface TouchableProps extends Omit<PressableProps, 'style'> {
  style?: StyleProp<ViewStyle>;
  /** 눌렸을 때 투명도 (기본 0.6) */
  activeOpacity?: number;
  /** 눌렸을 때 크기 (기본 0.97, 1이면 크기 변화 없음) */
  pressScale?: number;
}

/** 모든 버튼 공통: 누르는 동안 살짝 작아지고 흐려져서 눌린 느낌을 준다 */
export function Touchable({ style, activeOpacity = 0.6, pressScale = 0.97, disabled, ...rest }: TouchableProps) {
  return (
    <Pressable
      {...rest}
      disabled={disabled}
      style={({ pressed }) => [
        style,
        pressed && !disabled && { opacity: activeOpacity, transform: [{ scale: pressScale }] },
      ]}
    />
  );
}
