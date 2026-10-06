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
import { TERMOS, POLITICA } from '../data/legal';

export default function TermsModal({
  visible,
  onClose,
  onAccept,
  initialTab = 'termos',
}) {
  const [aba, setAba] = useState(initialTab);
  const [aceito, setAceito] = useState(false);

  const fechar = () => {
    setAceito(false);
    onClose();
  };

  const aceitar = () => {
    setAceito(false);
    onAccept();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={fechar}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.tabs}>
            <TouchableOpacity
              style={[styles.tab, aba === 'termos' && styles.tabAtiva]}
              onPress={() => setAba('termos')}>
              <Text
                style={[
                  styles.tabText,
                  aba === 'termos' && styles.tabTextAtiva,
                ]}>
                Termos de Uso
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, aba === 'politica' && styles.tabAtiva]}
              onPress={() => setAba('politica')}>
              <Text
                style={[
                  styles.tabText,
                  aba === 'politica' && styles.tabTextAtiva,
                ]}>
                Privacidade
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.texto}>
            <Text style={styles.textoConteudo}>
              {aba === 'termos' ? TERMOS : POLITICA}
            </Text>
          </ScrollView>

          {onAccept ? (
            <>
              <TouchableOpacity
                style={styles.checkRow}
                onPress={() => setAceito(!aceito)}>
                <Text style={styles.check}>{aceito ? '☑' : '☐'}</Text>
                <Text style={styles.checkText}>
                  Li e aceito os Termos de Uso e a Política de Privacidade
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.btn, !aceito && { opacity: 0.4 }]}
                disabled={!aceito}
                onPress={aceitar}>
                <Text style={styles.btnText}>Continuar</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={fechar}>
                <Text style={styles.cancel}>Cancelar</Text>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity style={styles.btn} onPress={fechar}>
              <Text style={styles.btnText}>Fechar</Text>
            </TouchableOpacity>
          )}
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
    padding: 20,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
    maxHeight: '88%',
  },
  tabs: { flexDirection: 'row', marginBottom: 10 },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: colors.border,
  },
  tabAtiva: { borderBottomColor: colors.primary },
  tabText: { color: colors.muted, fontWeight: '600' },
  tabTextAtiva: { color: colors.primary },
  texto: { marginVertical: 8 },
  textoConteudo: { color: colors.text, lineHeight: 21 },
  checkRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 10 },
  check: { fontSize: 22, color: colors.primary, marginRight: 10 },
  checkText: { flex: 1, color: colors.text },
  btn: {
    backgroundColor: colors.primary,
    padding: 14,
    borderRadius: 30,
    alignItems: 'center',
  },
  btnText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  cancel: { textAlign: 'center', color: colors.muted, marginTop: 10 },
});
