import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { Touchable } from '@/components/ui/Touchable';

interface StarRatingProps {
  value: number;
  onChange?: (v: number) => void;
  size?: number;
  readonly?: boolean;
}

export function StarRating({ value, onChange, size = 32, readonly = false }: StarRatingProps) {
  const stars = [1, 2, 3, 4, 5];

  const getIcon = (index: number) => {
    if (value >= index) return 'star';
    if (value >= index - 0.5) return 'star-half';
    return 'star-outline';
  };

  return (
    <View style={styles.container}>
      {stars.map((index) => (
        <View key={index} style={styles.starWrapper}>
          <Touchable
            style={[styles.halfTouch, { width: size / 2, height: size }]}
            onPress={() => !readonly && onChange?.(index - 0.5)}
            disabled={readonly}
          />
          <Touchable
            style={[styles.halfTouch, { width: size / 2, height: size, left: size / 2 }]}
            onPress={() => !readonly && onChange?.(index)}
            disabled={readonly}
          />
          <Ionicons
            name={getIcon(index)}
            size={size}
            color={value >= index - 0.5 ? Colors.star : Colors.starEmpty}
            style={styles.starIcon}
          />
        </View>
      ))}
      {!readonly && (
        <Text style={styles.valueText}>{value > 0 ? value.toFixed(1) : '-'}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  starWrapper: { position: 'relative' },
  halfTouch: { position: 'absolute', zIndex: 1, top: 0 },
  starIcon: { pointerEvents: 'none' },
  valueText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginLeft: 8,
  },
});