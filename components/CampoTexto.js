import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { colors } from '../theme';

export default function CampoTexto({
  label,
  dica,
  senha = false,
  multiline = false,
  contador,
  style,
  ...props
}) {
  const [ver, setVer] = useState(false);

  return (
    <View style={[styles.grupo, style]}>
      <Text style={styles.label}>{label}</Text>
      {!!dica && <Text style={styles.dica}>{dica}</Text>}
      <View style={{ justifyContent: 'center' }}>
        <TextInput
          style={[styles.input, multiline && styles.textarea, senha && { paddingRight: 48 }]}
          placeholderTextColor={colors.muted}
          multiline={multiline}
          secureTextEntry={senha && !ver}
          {...props}
        />
        {senha && (
          <TouchableOpacity style={styles.olho} onPress={() => setVer(!ver)}>
            <Text>{ver ? '🙈' : '👁️'}</Text>
          </TouchableOpacity>
        )}
      </View>
      {contador !== undefined && <Text style={styles.contador}>{contador}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  grupo: { marginBottom: 14 },
  label: { fontWeight: '700', color: colors.primary, fontSize: 14, marginBottom: 6 },
  dica: { color: colors.muted, fontSize: 12, marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 14,
    backgroundColor: '#fff',
    color: colors.text,
  },
  textarea: { minHeight: 90, textAlignVertical: 'top' },
  olho: { position: 'absolute', right: 14 },
  contador: { alignSelf: 'flex-end', color: colors.muted, fontSize: 12, marginTop: 4 },
});