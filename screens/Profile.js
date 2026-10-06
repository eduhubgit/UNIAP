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
import Header from '../components/Header';
import SelectField from '../components/SelectField';
import { HORARIOS, PREFERENCIAS, FAIXAS_PRECO } from '../data/options';
import { labelPref, labelFaixa, reais } from '../utils/format';
import { maskPhone, maskCpf, onlyDigits } from '../utils/masks';
import { mostrarAlerta } from '../utils/alerta';
import { escolherFotoPerfil } from '../utils/foto';

export default function Profile({ navigation }) {
  const { currentUser: u, updateProfile, emailExists } = useApp();
  const [editando, setEditando] = useState(false);
  const [form, setForm] = useState({});
  const [mostrarSenha, setMostrarSenha] = useState(false);

  if (!u) return null;

  const setCampo = (k, v) => setForm((prev) => ({ ...prev, [k]: v }));

  const iniciarEdicao = () => {
    setForm({
      nome: u.nome,
      matricula: u.matricula,
      telefone: u.telefone,
      email: u.email,
      cpf: u.cpf,
      cidade: u.cidade,
      senha: u.senha,
      sobre: u.sobre || '',
      observacoes: u.observacoes || '',
      horarios: u.horarios || [],
      preferencias: u.preferencias || [],
      faixa: u.faixa || null,
      aluguelDigits: u.ap ? String(Math.round(u.ap.aluguel * 100)) : '',
      adendos: u.ap?.adendos || '',
    });
    setMostrarSenha(false);
    setEditando(true);
  };

    const trocarFoto = async () => {
    const uri = await escolherFotoPerfil();
    if (uri) updateProfile({ foto: uri });
  };

  const validar = () => {
    const f = form;
    if (
      !f.nome.trim() ||
      !f.matricula.trim() ||
      !f.telefone ||
      !f.email ||
      !f.cpf ||
      !f.cidade.trim() ||
      !f.senha
    ) {
      return 'Preencha todos os dados pessoais.';
    }
    if (!/^\S+@\S+\.\S+$/.test(f.email)) return 'E-mail inválido.';
    if (onlyDigits(f.cpf).length !== 11) return 'CPF deve ter 11 dígitos.';
    if (onlyDigits(f.telefone).length < 10) return 'Telefone inválido.';
    if (f.senha.length < 6) return 'A senha deve ter pelo menos 6 caracteres.';
    if (emailExists(f.email, u.id))
      return 'Já existe uma conta com esse e-mail.';
    if (f.sobre.trim().length < 10)
      return 'Conte um pouco mais sobre você (mínimo 10 caracteres).';
    if (f.horarios.length === 0) return 'Selecione pelo menos um horário.';
    if (f.preferencias.length === 0)
      return 'Selecione pelo menos uma preferência.';
    if (!f.faixa) return 'Selecione a faixa de preço.';
    if (u.ap && parseInt(f.aluguelDigits || '0', 10) <= 0)
      return 'Informe o preço do aluguel.';
    return null;
  };

  const salvar = () => {
    const erro = validar();
    if (erro) {
      mostrarAlerta('Atenção', erro);
      return;
    }
    const dados = {
      nome: form.nome.trim(),
      matricula: form.matricula.trim(),
      telefone: form.telefone,
      email: form.email.trim(),
      cpf: form.cpf,
      cidade: form.cidade.trim(),
      senha: form.senha,
      sobre: form.sobre.trim(),
      observacoes: form.observacoes.trim(),
      horarios: form.horarios,
      preferencias: form.preferencias,
      faixa: form.faixa,
    };
    if (u.ap) {
      dados.ap = {
        ...u.ap,
        aluguel: parseInt(form.aluguelDigits, 10) / 100,
        adendos: form.adendos.trim(),
      };
    }
    updateProfile(dados);
    setEditando(false);
    mostrarAlerta('Pronto!', 'Seu perfil foi atualizado.');
  };

  // linhas da lista "Informações" (modo visualização)
  const linhas = [
    { icone: '👤', label: 'Nome completo', valor: u.nome },
    { icone: '🎓', label: 'Matrícula', valor: u.matricula },
    { icone: '📞', label: 'Telefone', valor: u.telefone },
    { icone: '✉️', label: 'E-mail', valor: u.email },
    { icone: '🪪', label: 'CPF', valor: u.cpf },
    { icone: '📍', label: 'Cidade', valor: u.cidade },
    { icone: '🔒', label: 'Senha', valor: '••••••••' },
  ];

  const input = (label, key, extra = {}) => (
    <View>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.input}
        value={form[key]}
        placeholderTextColor={colors.muted}
        onChangeText={(t) => setCampo(key, extra.mask ? extra.mask(t) : t)}
        {...extra.props}
      />
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Header />
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 30 }}
        keyboardShouldPersistTaps="handled">
        {/* TOPO: FOTO + NOME + SOBRE */}
        <View style={styles.topo}>
          <TouchableOpacity onPress={trocarFoto}>
            {u.foto ? (
              <Image source={{ uri: u.foto }} style={styles.foto} />
            ) : (
              <View style={[styles.foto, styles.fotoVazia]}>
                <Text style={styles.inicial}>{u.nome?.[0]?.toUpperCase()}</Text>
              </View>
            )}
            <View style={styles.camera}>
              <Text style={{ fontSize: 14 }}>📷</Text>
            </View>
          </TouchableOpacity>
          <View style={{ flex: 1, marginLeft: 14 }}>
            <Text style={styles.nome}>{u.nome}</Text>
            <Text style={styles.matricula}>Mat. {u.matricula}</Text>
            <Text style={styles.sobre} numberOfLines={5}>
              {u.sobre}
            </Text>
          </View>
        </View>

        {!editando ? (
          <>
            {/* MINHAS PREFERÊNCIAS */}
            <View style={styles.card}>
              <Text style={styles.cardTitulo}>💜 Minhas preferências</Text>
              <Text style={styles.cardSub}>
                O que é importante para mim na convivência.
              </Text>
              <View style={styles.tags}>
                {(u.preferencias || []).map((id) => (
                  <View key={id} style={styles.tag}>
                    <Text style={styles.tagText}>{labelPref(id)}</Text>
                  </View>
                ))}
                <View style={[styles.tag, { backgroundColor: '#D9EAFB' }]}>
                  <Text style={styles.tagText}>💰 {labelFaixa(u.faixa)}</Text>
                </View>
              </View>
            </View>

            {/* MEU APARTAMENTO (só quem tem AP) */}
            {u.ap && (
              <View style={styles.card}>
                <Text style={styles.cardTitulo}>🏠 Meu apartamento</Text>
                <Text style={styles.cardSub}>
                  {reais(u.ap.aluguel)}/mês • {u.ap.bairro}, {u.ap.cidade}
                </Text>
              </View>
            )}

            {/* INFORMAÇÕES */}
            <View style={styles.card}>
              <Text style={styles.cardTitulo}>👤 Informações</Text>
              <Text style={styles.cardSub}>
                Seus dados cadastrados no UNI AP.
              </Text>
              {linhas.map((l) => (
                <TouchableOpacity
                  key={l.label}
                  style={styles.linha}
                  onPress={iniciarEdicao}>
                  <Text style={styles.linhaIcone}>{l.icone}</Text>
                  <Text style={styles.linhaLabel}>{l.label}</Text>
                  <Text style={styles.linhaValor} numberOfLines={1}>
                    {l.valor}
                  </Text>
                  <Text style={styles.chevron}>›</Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                style={styles.btnEditar}
                onPress={iniciarEdicao}>
                <Text style={styles.btnEditarText}>✏️ Editar</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.btnVoltar}
              onPress={() => navigation.navigate('Match')}>
              <Text style={styles.btnVoltarText}>← Voltar</Text>
            </TouchableOpacity>
          </>
        ) : (
          /* MODO EDIÇÃO */
          <View style={styles.card}>
            <Text style={styles.cardTitulo}>✏️ Editar perfil</Text>

            {input('Nome completo', 'nome')}
            {input('Matrícula', 'matricula', {
              props: { keyboardType: 'numeric' },
            })}
            {input('Telefone', 'telefone', {
              mask: maskPhone,
              props: { keyboardType: 'phone-pad' },
            })}
            {input('E-mail', 'email', {
              props: { autoCapitalize: 'none', keyboardType: 'email-address' },
            })}
            {input('CPF', 'cpf', {
              mask: maskCpf,
              props: { keyboardType: 'numeric' },
            })}
            {input('Cidade', 'cidade')}

            <Text style={styles.label}>Senha</Text>
            <View style={{ justifyContent: 'center' }}>
              <TextInput
                style={styles.input}
                value={form.senha}
                secureTextEntry={!mostrarSenha}
                onChangeText={(t) => setCampo('senha', t)}
              />
              <TouchableOpacity
                style={styles.olho}
                onPress={() => setMostrarSenha(!mostrarSenha)}>
                <Text>{mostrarSenha ? '🙈' : '👁️'}</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>Sobre você</Text>
            <TextInput
              style={[styles.input, styles.textarea]}
              multiline
              maxLength={300}
              value={form.sobre}
              onChangeText={(t) => setCampo('sobre', t)}
            />
            <Text style={styles.contador}>{form.sobre.length}/300</Text>

            <Text style={styles.label}>Horários</Text>
            <SelectField
              title="Sua rotina"
              placeholder="Selecione os horários"
              options={HORARIOS}
              multiple
              value={form.horarios}
              onChange={(v) => setCampo('horarios', v)}
            />

            <Text style={styles.label}>Preferências</Text>
            <SelectField
              title="Suas preferências"
              placeholder="Selecione as preferências"
              options={PREFERENCIAS}
              multiple
              value={form.preferencias}
              onChange={(v) => setCampo('preferencias', v)}
            />

            <Text style={styles.label}>Observações</Text>
            <TextInput
              style={[styles.input, styles.textarea]}
              multiline
              maxLength={200}
              value={form.observacoes}
              onChangeText={(t) => setCampo('observacoes', t)}
            />
            <Text style={styles.contador}>{form.observacoes.length}/200</Text>

            <Text style={styles.label}>Faixa de preço</Text>
            <SelectField
              title="Faixa de preço"
              placeholder="Selecione a faixa de preço"
              options={FAIXAS_PRECO}
              value={form.faixa}
              onChange={(v) => setCampo('faixa', v)}
            />

            {u.ap && (
              <>
                <Text style={[styles.cardTitulo, { marginTop: 22 }]}>
                  🏠 Meu apartamento
                </Text>
                <Text style={styles.label}>Preço do aluguel</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  placeholder="R$ 0,00"
                  placeholderTextColor={colors.muted}
                  value={
                    form.aluguelDigits
                      ? reais(parseInt(form.aluguelDigits, 10) / 100)
                      : ''
                  }
                  onChangeText={(t) =>
                    setCampo('aluguelDigits', t.replace(/\D/g, '').slice(0, 8))
                  }
                />
                <Text style={styles.label}>Adendos</Text>
                <TextInput
                  style={[styles.input, styles.textarea]}
                  multiline
                  maxLength={500}
                  value={form.adendos}
                  onChangeText={(t) => setCampo('adendos', t)}
                />
              </>
            )}

            <TouchableOpacity
              style={[styles.btnEditar, { marginTop: 22 }]}
              onPress={salvar}>
              <Text style={styles.btnEditarText}>✓ Salvar alterações</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setEditando(false)}>
              <Text style={styles.cancelar}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  topo: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  foto: { width: 100, height: 100, borderRadius: 50 },
  fotoVazia: {
    backgroundColor: '#E6D6F3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inicial: { fontSize: 38, fontWeight: 'bold', color: colors.primary },
  camera: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  nome: { fontSize: 24, fontWeight: 'bold', color: colors.primary },
  matricula: { color: colors.muted, marginTop: 2 },
  sobre: { color: colors.text, marginTop: 6, fontSize: 13 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
  },
  cardTitulo: { fontSize: 17, fontWeight: 'bold', color: colors.primary },
  cardSub: { color: colors.text, marginTop: 2, marginBottom: 8 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 4 },
  tag: {
    backgroundColor: '#EBDDF7',
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginRight: 8,
    marginBottom: 8,
  },
  tagText: { color: colors.primary, fontWeight: '600', fontSize: 13 },
  linha: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bg,
    borderRadius: 12,
    padding: 12,
    marginTop: 8,
  },
  linhaIcone: { fontSize: 18, width: 30 },
  linhaLabel: { width: 110, color: colors.primary, fontWeight: '600' },
  linhaValor: { flex: 1, color: colors.text },
  chevron: { color: colors.primary, fontSize: 22, marginLeft: 6 },
  btnEditar: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 30,
    alignItems: 'center',
    marginTop: 16,
  },
  btnEditarText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  btnVoltar: {
    borderWidth: 1.5,
    borderColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 30,
    alignItems: 'center',
  },
  btnVoltarText: { color: colors.primary, fontWeight: '700', fontSize: 16 },
  label: {
    fontWeight: '700',
    color: colors.primary,
    marginTop: 14,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 12,
    backgroundColor: colors.bg,
    color: colors.text,
  },
  textarea: { minHeight: 80, textAlignVertical: 'top' },
  contador: {
    alignSelf: 'flex-end',
    color: colors.muted,
    fontSize: 12,
    marginTop: 4,
  },
  olho: { position: 'absolute', right: 14 },
  cancelar: { textAlign: 'center', color: colors.muted, marginTop: 14 },
});
