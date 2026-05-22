import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface BadgeProps {
  label: string;
  color: string;
  textColor?: string;
  size?: 'sm' | 'md';
}

export function Badge({ label, color, textColor = '#fff', size = 'md' }: BadgeProps) {
  return (
    <View style={[styles.badge, { backgroundColor: color }, size === 'sm' && styles.sm]}>
      <Text style={[styles.label, { color: textColor }, size === 'sm' && styles.labelSm]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  sm: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 8 },
  label: { fontSize: 12, fontWeight: '600' },
  labelSm: { fontSize: 10 },
});
