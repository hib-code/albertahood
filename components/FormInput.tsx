
import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { colors, commonStyles } from '../styles/commonStyles';

interface FormInputProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  multiline?: boolean;
  keyboardType?: 'default' | 'email-address' | 'phone-pad';
  required?: boolean;
}

export default function FormInput({
  label,
  value,
  onChangeText,
  placeholder,
  multiline = false,
  keyboardType = 'default',
  required = false,
}: FormInputProps) {
  return (
    <View style={styles.container}>
      <Text style={[commonStyles.label, required && styles.requiredLabel]}>
        {label}
        {required && <Text style={styles.asterisk}> *</Text>}
      </Text>
      <TextInput
        style={[
          multiline ? commonStyles.textArea : commonStyles.input,
          styles.input,
        ]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textSecondary}
        multiline={multiline}
        keyboardType={keyboardType}
        autoCapitalize={keyboardType === 'email-address' ? 'none' : 'sentences'}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    width: '100%',
  },
  input: {
    fontSize: 16,
  },
  requiredLabel: {
    color: colors.text,
  },
  asterisk: {
    color: colors.error,
  },
});
