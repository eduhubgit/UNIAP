import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TextInput,
  Alert,
  SafeAreaView,
} from 'react-native';
import { colors } from '../theme';
import { useApp } from '../context/AppContext';
import { mostrarAlerta } from '../utils/alerta';

export default function Welcome({ navigation }) {
  const { login } = useApp();
  const [loginVisible, setLoginVisible] = useState(false);
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');

    const handleLogin = () => {
    if (!email || !senha) {
      mostrarAlerta('Atenção', 'Preencha e-mail e senha.');
      return;
    }
    if (login(email, senha)) {
      setLoginVisible(false);
      setEmail('');
      setSenha('');
      navigation.replace('Main');
    } else {
      mostrarAlerta('Erro', 'E-mail ou senha incorretos.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.top}>
        <Text style={styles.logo}>
          UNI <Text style={{ color: colors.pink }}>AP</Text>
        </Text>
        <Text style={styles.slogan}>
          Mais do que um quarto,{'\n'}o lugar certo para você.
        </Text>
      </View>

      <View style={styles.bottom}>
        <TouchableOpacity
          style={styles.btnPrimary}
          onPress={() => setLoginVisible(true)}>
          <Text style={styles.btnPrimaryText}>Entrar</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.btnOutline}
          onPress={() => navigation.navigate('Register')}>
          <Text style={styles.btnOutlineText}>Criar conta</Text>
        </TouchableOpacity>
      </View>

      <Modal
        visible={loginVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setLoginVisible(false)}>
        <View style={styles.overlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Entrar</Text>
            <TextInput
              style={styles.input}
              placeholder="E-mail"
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
            />
            <TextInput
              style={styles.input}
              placeholder="Senha"
              secureTextEntry
              value={senha}
              onChangeText={setSenha}
            />
            <TouchableOpacity style={styles.btnPrimary} onPress={handleLogin}>
              <Text style={styles.btnPrimaryText}>Entrar</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setLoginVisible(false)}>
              <Text style={styles.cancel}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    justifyContent: 'space-between',
    padding: 24,
  },
  top: { alignItems: 'center', marginTop: 80 },
  logo: { fontSize: 56, fontWeight: 'bold', color: colors.primary },
  slogan: {
    fontSize: 18,
    color: colors.text,
    textAlign: 'center',
    marginTop: 12,
  },
  bottom: { marginBottom: 30 },
  btnPrimary: {
    backgroundColor: colors.primary,
    padding: 16,
    borderRadius: 30,
    alignItems: 'center',
    marginBottom: 12,
  },
  btnPrimaryText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  btnOutline: {
    borderColor: colors.primary,
    borderWidth: 1.5,
    padding: 16,
    borderRadius: 30,
    alignItems: 'center',
  },
  btnOutlineText: { color: colors.primary, fontSize: 16, fontWeight: '600' },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: { backgroundColor: '#fff', borderRadius: 20, padding: 20 },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    backgroundColor: colors.bg,
  },
  cancel: { textAlign: 'center', color: colors.muted, marginTop: 4 },
});
