import React from 'react';
import { TextInput, StyleSheet } from 'react-native';
import { COLORS } from '../constants/colors';

interface DateInputProps {
  value: string;
  onChange: (formatted: string, iso: string) => void;
  placeholder?: string;
}

function formatDisplay(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4, 8)}`;
}

function toISO(formatted: string): string {
  const digits = formatted.replace(/\D/g, '');
  if (digits.length === 8) {
    return `${digits.slice(4, 8)}-${digits.slice(2, 4)}-${digits.slice(0, 2)}`;
  }
  return '';
}

export function DateInput({ value, onChange, placeholder = 'JJ/MM/AAAA' }: DateInputProps) {
  const handleChange = (text: string) => {
    const formatted = formatDisplay(text);
    const iso = toISO(formatted);
    onChange(formatted, iso);
  };

  return (
    <TextInput
      style={styles.input}
      value={value}
      onChangeText={handleChange}
      placeholder={placeholder}
      keyboardType="numeric"
      maxLength={10}
    />
  );
}

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 15,
    backgroundColor: COLORS.surface,
    letterSpacing: 1,
  },
});
