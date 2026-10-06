import React from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet } from 'react-native';
import { colors } from '../theme';

export default function ConfirmModal({
  visible,
  emoji,
  titulo,
  texto,
  textoSim = 'Confirmar',
  perigo = false,
  onSim,
  onCancelar,
}) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancelar}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          {!!emoji && <Text style={styles.emoji}>{emoji}</Text>}
          <Text style={styles.titulo}>{titulo}</Text>
          <Text style={styles.texto}>{texto}</Text>
          <TouchableOpacity
            style={[styles.btn, perigo && { backgroundColor: colors.pink }]}
            onPress={onSim}>
            <Text style={styles.btnText}>{textoSim}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onCancelar}>
            <Text style={styles.voltar}>Voltar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 24,
  },
  card: { backgroundColor: '#fff', borderRadius: 22, padding: 22 },
  emoji: { fontSize: 40, textAlign: 'center' },
  titulo: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.primary,
    textAlign: 'center',
    marginTop: 6,
  },
  texto: {
    color: colors.text,
    textAlign: 'center',
    marginVertical: 14,
    lineHeight: 21,
  },
  btn: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 30,
    alignItems: 'center',
  },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  voltar: { textAlign: 'center', color: colors.muted, marginTop: 14 },
});
