import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  SafeAreaView,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { colors } from '../theme';
import { useApp } from '../context/AppContext';
import { mostrarAlerta } from '../utils/alerta';
import { escolherFotoPerfil } from '../utils/foto';
import AskApModal from '../components/AskApModal';
import TermsModal from '../components/TermsModal';

const onlyDigits = (t) => t.replace(/\D/g, '');

const maskPhone = (t) => {
  const d = onlyDigits(t).slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
};

const maskCpf = (t) => {
  const d = onlyDigits(t).slice(0, 11);
  return d
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
};

export default function Register({ navigation }) {
  const { updateDraft, emailExists } = useApp();
  const [foto, setFoto] = useState(null);
  const [form, setForm] = useState({
    nome: '',
    matricula: '',
    telefone: '',
    email: '',
    cpf: '',
    cidade: '',
    senha: '',
  });
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [apVisible, setApVisible] = useState(false);
  const [termsVisible, setTermsVisible] = useState(false);

  const setField = (campo, valor) =>
    setForm((prev) => ({ ...prev, [campo]: valor }));

    const escolherFoto = async () => {
    const uri = await escolherFotoPerfil();
    if (uri) setFoto(uri);
  };

  const validar = () => {
    const { nome, matricula, telefone, email, cpf, cidade, senha } = form;
    if (
      !nome.trim() ||
      !matricula.trim() ||
      !telefone ||
      !email ||
      !cpf ||
      !cidade.trim() ||
      !senha
    ) {
      return 'Preencha todos os campos.';
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) return 'E-mail inválido.';
    if (onlyDigits(cpf).length !== 11) return 'CPF deve ter 11 dígitos.';
    if (onlyDigits(telefone).length < 10) return 'Telefone inválido.';
    if (senha.length < 6) return 'A senha deve ter pelo menos 6 caracteres.';
    if (emailExists(email)) return 'Já existe uma conta com esse e-mail.';
    return null;
  };

  // 1) valida e abre o pop-up "tem AP?"
  const handleCadastrar = () => {
    const erro = validar();
    if (erro) {
      mostrarAlerta('Atenção', erro);
      return;
    }
    updateDraft({ ...form, foto });
    setApVisible(true);
  };

  // 2) guarda a resposta e abre os Termos
  const escolheuAp = (temAp) => {
    updateDraft({ temAp });
    setApVisible(false);
    // pequena pausa para o iOS conseguir fechar um modal e abrir outro
    setTimeout(() => setTermsVisible(true), 400);
  };

  // 3) aceitou os termos: segue para o Cadastro 2
  const aceitouTermos = () => {
    updateDraft({ aceitouTermos: true });
    setTermsVisible(false);
    navigation.navigate('Register2');
  };

  const campo = (label, key, extra = {}) => (
    <TextInput
      style={styles.input}
      placeholder={label}
      placeholderTextColor={colors.muted}
      value={form[key]}
      onChangeText={(t) => setField(key, extra.mask ? extra.mask(t) : t)}
      {...extra.props}
    />
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={{ padding: 24 }}
        keyboardShouldPersistTaps="handled">
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>← Voltar</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Crie sua conta</Text>
        <Text style={styles.subtitle}>
          Vamos começar? Preencha seus dados para se conectar com outros
          universitários.
        </Text>

        <TouchableOpacity style={styles.fotoBox} onPress={escolherFoto}>
          {foto ? (
            <Image source={{ uri: foto }} style={styles.fotoImg} />
          ) : (
            <Text style={styles.fotoText}>📷{'\n'}Foto</Text>
          )}
        </TouchableOpacity>

        {campo('Nome completo', 'nome')}
        {campo('Matrícula', 'matricula', {
          props: { keyboardType: 'numeric' },
        })}
        {campo('Telefone', 'telefone', {
          mask: maskPhone,
          props: { keyboardType: 'phone-pad' },
        })}
        {campo('E-mail', 'email', {
          props: { autoCapitalize: 'none', keyboardType: 'email-address' },
        })}
        {campo('CPF', 'cpf', {
          mask: maskCpf,
          props: { keyboardType: 'numeric' },
        })}
        {campo('Cidade', 'cidade')}

        <View style={styles.senhaRow}>
          <TextInput
            style={[styles.input, { flex: 1, marginBottom: 0 }]}
            placeholder="Senha"
            placeholderTextColor={colors.muted}
            secureTextEntry={!mostrarSenha}
            value={form.senha}
            onChangeText={(t) => setField('senha', t)}
          />
          <TouchableOpacity
            onPress={() => setMostrarSenha(!mostrarSenha)}
            style={styles.olho}>
            <Text>{mostrarSenha ? '🙈' : '👁️'}</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.btn} onPress={handleCadastrar}>
          <Text style={styles.btnText}>Cadastrar</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.jaTem}>
            Já tem uma conta?{' '}
            <Text style={{ color: colors.primary, fontWeight: '600' }}>
              Entrar
            </Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>

      <AskApModal
        visible={apVisible}
        onChoose={escolheuAp}
        onClose={() => setApVisible(false)}
      />
      <TermsModal
        visible={termsVisible}
        onAccept={aceitouTermos}
        onClose={() => setTermsVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  back: { color: colors.primary, fontSize: 16, marginBottom: 8 },
  title: { fontSize: 30, fontWeight: 'bold', color: colors.primary },
  subtitle: { color: colors.text, marginTop: 6, marginBottom: 16 },
  fotoBox: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: '#E6D6F3',
    alignSelf: 'center',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    overflow: 'hidden',
  },
  fotoImg: { width: '100%', height: '100%' },
  fotoText: { textAlign: 'center', color: colors.primary },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    backgroundColor: '#fff',
    color: colors.text,
  },
  senhaRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  olho: { position: 'absolute', right: 14 },
  btn: {
    backgroundColor: colors.primary,
    padding: 16,
    borderRadius: 30,
    alignItems: 'center',
  },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  jaTem: { textAlign: 'center', marginTop: 16, color: colors.muted },
});
