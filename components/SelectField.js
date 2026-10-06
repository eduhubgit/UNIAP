import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { colors } from '../theme';

export default function SelectField({
  title,
  placeholder,
  options,
  value,
  onChange,
  multiple = false,
}) {
  const [open, setOpen] = useState(false);

  // normaliza: sempre trabalhamos com uma lista de ids
  const selected = multiple ? value : value ? [value] : [];

  const toggle = (id) => {
    if (multiple) {
      onChange(
        selected.includes(id)
          ? selected.filter((i) => i !== id)
          : [...selected, id]
      );
    } else {
      onChange(id);
      setOpen(false);
    }
  };

  const resumo = selected
    .map((id) => options.find((o) => o.id === id)?.label)
    .filter(Boolean)
    .join(', ');

  return (
    <View>
      <TouchableOpacity style={styles.field} onPress={() => setOpen(true)}>
        <Text
          style={[styles.fieldText, !resumo && { color: colors.muted }]}
          numberOfLines={2}>
          {resumo || placeholder}
        </Text>
        <Text style={styles.arrow}>▾</Text>
      </TouchableOpacity>

      <Modal
        visible={open}
        transparent
        animationType="slide"
        onRequestClose={() => setOpen(false)}>
        <View style={styles.overlay}>
          <View style={styles.sheet}>
            <Text style={styles.title}>{title}</Text>
            <ScrollView style={{ maxHeight: 340 }}>
              {options.map((op) => {
                const ativo = selected.includes(op.id);
                return (
                  <TouchableOpacity
                    key={op.id}
                    style={styles.item}
                    onPress={() => toggle(op.id)}>
                    <Text style={styles.mark}>
                      {multiple ? (ativo ? '☑' : '☐') : ativo ? '◉' : '○'}
                    </Text>
                    <Text
                      style={[
                        styles.itemText,
                        ativo && { color: colors.primary, fontWeight: '600' },
                      ]}>
                      {op.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            <TouchableOpacity style={styles.btn} onPress={() => setOpen(false)}>
              <Text style={styles.btnText}>
                {multiple ? 'Concluir' : 'Fechar'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 14,
    backgroundColor: '#fff',
  },
  fieldText: { flex: 1, color: colors.text },
  arrow: { color: colors.primary, marginLeft: 8 },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 10,
  },
  item: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
  mark: { fontSize: 20, color: colors.primary, marginRight: 12 },
  itemText: { fontSize: 16, color: colors.text, flex: 1 },
  btn: {
    backgroundColor: colors.primary,
    padding: 14,
    borderRadius: 30,
    alignItems: 'center',
    marginTop: 12,
  },
  btnText: { color: '#fff', fontWeight: '600', fontSize: 16 },
});
