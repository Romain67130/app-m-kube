import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../constants/colors';

interface ProgressBarProps {
  value: number;
  showLabel?: boolean;
  height?: number;
  color?: string;
}

export function ProgressBar({ value, showLabel = true, height = 8, color = COLORS.secondary }: ProgressBarProps) {
  const pct = Math.min(100, Math.max(0, value));
  const barColor = pct === 100 ? COLORS.success : pct >= 50 ? color : COLORS.warning;

  return (
    <View style={styles.row}>
      <View style={[styles.track, { height }]}>
        <View style={[styles.fill, { width: `${pct}%`, backgroundColor: barColor, height }]} />
      </View>
      {showLabel && <Text style={styles.label}>{pct}%</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  track: { flex: 1, backgroundColor: COLORS.border, borderRadius: 4, overflow: 'hidden' },
  fill: { borderRadius: 4 },
  label: { fontSize: 12, fontWeight: '700', color: COLORS.textSecondary, width: 34, textAlign: 'right' },
});
