import React from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet } from 'react-native';
import { colors } from '../theme';

export default function AskApModal({ visible, onChoose, onClose }) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>Você já tem um apartamento?</Text>
          <Text style={styles.sub}>
            Isso nos ajuda a mostrar as pessoas certas para você.
          </Text>

          <TouchableOpacity
            style={styles.btnPrimary}
            onPress={() => onChoose(true)}>
            <Text style={styles.btnPrimaryText}>Já tenho AP</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.btnOutline}
            onPress={() => onChoose(false)}>
            <Text style={styles.btnOutlineText}>Ainda não tenho AP</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.cancel}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    padding: 24,
  },
  card: { backgroundColor: '#fff', borderRadius: 20, padding: 20 },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.primary,
    textAlign: 'center',
  },
  sub: { color: colors.text, textAlign: 'center', marginVertical: 12 },
  btnPrimary: {
    backgroundColor: colors.primary,
    padding: 14,
    borderRadius: 30,
    alignItems: 'center',
    marginBottom: 10,
  },
  btnPrimaryText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  btnOutline: {
    borderColor: colors.primary,
    borderWidth: 1.5,
    padding: 14,
    borderRadius: 30,
    alignItems: 'center',
  },
  btnOutlineText: { color: colors.primary, fontWeight: '600', fontSize: 16 },
  cancel: { textAlign: 'center', color: colors.muted, marginTop: 12 },
});
