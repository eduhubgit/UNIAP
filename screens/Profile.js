import React, { useCallback, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  SafeAreaView,
  Switch,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import * as DocumentPicker from 'expo-document-picker';
import { colors } from '../theme';
import { useApp } from '../context/AppContext';
import Header from '../components/Header';
import SelectField from '../components/SelectField';
import CampoTexto from '../components/CampoTexto';
import ConfirmModal from '../components/ConfirmModal';
import { HORARIOS, PREFERENCIAS, FAIXAS_PRECO } from '../data/options';
import { labelPref, labelFaixa, reais, DESPESAS_LABEL } from '../utils/format';
import { maskPhone, maskCpf, onlyDigits } from '../utils/masks';
import { mostrarAlerta } from '../utils/alerta';
import { escolherFotoPerfil } from '../utils/foto';
import { escolherFotosAnuncio } from '../utils/fotosAnuncio';
import { faixaPorValor, vagasInfo, textoDivisao } from '../utils/perfil';

const MAX_FOTOS_AP = 5;

const DESPESAS = [
  { id: 'agua', label: '💧  Água' },
  { id: 'luz', label: '⚡  Luz' },
  { id: 'internet', label: '📶  Internet' },
  { id: 'condominio', label: '🏢  Condomínio' },
  { id: 'gas', label: '🔥  Gás' },
];

export default function Profile({ navigation, route }) {
  const { currentUser: u, chats, updateProfile, emailExists } = useApp();

  const [visao, setVisao] = useState('minhas'); // 'minhas' | 'ap'
  const [editando, setEditando] = useState(false);
  const [form, setForm] = useState({});
  const [editandoAp, setEditandoAp] = useState(false);
  const [apForm, setApForm] = useState({});
  const [confirmaAp, setConfirmaAp] = useState(false);

  // sempre que o Perfil ganha foco, volta para "Minhas infos" (ou "AP Infos" logo após virar perfil com AP)
  const rotaRef = useRef(route);
  rotaRef.current = route;
  useFocusEffect(
    useCallback(() => {
      const aba = rotaRef.current.params?.aba;
      setVisao(aba === 'ap' ? 'ap' : 'minhas');
      setEditando(false);
      setEditandoAp(false);
      if (aba) navigation.setParams({ aba: undefined });
    }, [navigation])
  );

  if (!u) return null;

  const ap = u.ap;
  const verAp = visao === 'ap' && !!ap;
  const info = vagasInfo(ap);
  const ocupadas = chats.filter((c) => c.vagaOcupada).length;

  const setCampo = (k, v) => setForm((prev) => ({ ...prev, [k]: v }));
  const setApCampo = (k, v) => setApForm((prev) => ({ ...prev, [k]: v }));

  // ---------- INTERRUPTOR ----------
  const irParaMinhas = () => {
    setEditandoAp(false);
    setVisao('minhas');
  };

  const irParaAp = () => {
    if (ap) {
      setEditando(false);
      setVisao('ap');
    } else {
      setConfirmaAp(true); // quem não tem AP precisa confirmar
    }
  };

  const confirmarCadastroAp = () => {
    setConfirmaAp(false);
    setTimeout(() => navigation.navigate('ApStep1', { modo: 'converter' }), 300);
  };

  // ---------- MINHAS INFOS ----------
  const trocarFoto = async () => {
    const uri = await escolherFotoPerfil();
    if (uri) updateProfile({ foto: uri });
  };

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
    });
    setEditando(true);
  };

  const validar = () => {
    const f = form;
    if (!f.nome.trim() || !f.matricula.trim() || !f.telefone || !f.email || !f.cpf || !f.cidade.trim() || !f.senha) {
      return 'Preencha todos os dados pessoais.';
    }
    if (!/^\S+@\S+\.\S+$/.test(f.email)) return 'E-mail inválido.';
    if (onlyDigits(f.cpf).length !== 11) return 'CPF deve ter 11 dígitos.';
    if (onlyDigits(f.telefone).length < 10) return 'Telefone inválido.';
    if (f.senha.length < 6) return 'A senha deve ter pelo menos 6 caracteres.';
    if (emailExists(f.email, u.id)) return 'Já existe uma conta com esse e-mail.';
    if (f.sobre.trim().length < 10) return 'Conte um pouco mais sobre você (mínimo 10 caracteres).';
    if (f.horarios.length === 0) return 'Selecione pelo menos um horário.';
    if (f.preferencias.length === 0) return 'Selecione pelo menos uma preferência.';
    if (!ap && !f.faixa) return 'Selecione a faixa de preço.';
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
    };
    // quem tem AP tem a faixa calculada pelo aluguel, então só quem não tem edita aqui
    if (!ap) dados.faixa = form.faixa;
    updateProfile(dados);
    setEditando(false);
    mostrarAlerta('Pronto!', 'Seu perfil foi atualizado.');
  };

  // ---------- AP INFOS ----------
  const adicionarFotosAp = async () => {
    const restante = MAX_FOTOS_AP - (ap.fotos?.length || 0);
    if (restante <= 0) {
      mostrarAlerta('Limite', `Você pode ter até ${MAX_FOTOS_AP} fotos do apartamento.`);
      return;
    }
    const novas = await escolherFotosAnuncio(restante);
    if (novas.length) {
      updateProfile({ ap: { ...ap, fotos: [...(ap.fotos || []), ...novas].slice(0, MAX_FOTOS_AP) } });
    }
  };

  const removerFotoAp = (indice) => {
    if ((ap.fotos || []).length <= 1) {
      mostrarAlerta('Atenção', 'Mantenha pelo menos uma foto. Adicione outra antes de remover esta.');
      return;
    }
    updateProfile({ ap: { ...ap, fotos: ap.fotos.filter((_, i) => i !== indice) } });
  };

  const trocarDocumento = async () => {
    const res = await DocumentPicker.getDocumentAsync({
      type: ['application/pdf', 'image/*'],
      copyToCacheDirectory: true,
    });
    if (!res.canceled) {
      updateProfile({ ap: { ...ap, docNome: res.assets[0].name } });
      mostrarAlerta('Pronto!', 'Documento atualizado e enviado para verificação.');
    }
  };

  const iniciarEdicaoAp = () => {
    setApForm({
      endereco: ap.endereco || '',
      bairro: ap.bairro || '',
      cidade: ap.cidade || '',
      referencia: ap.referencia || '',
      aluguelDigits: String(Math.round((ap.aluguel || 0) * 100)),
      vagasTexto: String(info.total),
      despesas: { agua: false, luz: false, internet: false, condominio: false, gas: false, ...(ap.despesas || {}) },
      outras: ap.outras || '',
      adendos: ap.adendos || '',
    });
    setEditandoAp(true);
  };

  const salvarAp = () => {
    const f = apForm;
    const valor = parseInt(f.aluguelDigits || '0', 10) / 100;
    const vagasTotal = parseInt(f.vagasTexto || '0', 10);

    if (!f.endereco.trim() || !f.bairro.trim() || !f.cidade.trim()) {
      mostrarAlerta('Atenção', 'Preencha endereço, bairro e cidade.');
      return;
    }
    if (valor <= 0) {
      mostrarAlerta('Atenção', 'Informe o preço do aluguel.');
      return;
    }
    if (vagasTotal < 1 || vagasTotal > 10) {
      mostrarAlerta('Atenção', 'Informe quantas pessoas você pensa em ter com você (de 1 a 10).');
      return;
    }
    if (vagasTotal < ocupadas) {
      mostrarAlerta(
        'Atenção',
        `Você já marcou ${ocupadas} ${ocupadas === 1 ? 'vaga' : 'vagas'} como ocupada${
          ocupadas === 1 ? '' : 's'
        } nos chats. O total não pode ser menor que isso.`
      );
      return;
    }

    updateProfile({
      ap: {
        ...ap,
        endereco: f.endereco.trim(),
        bairro: f.bairro.trim(),
        cidade: f.cidade.trim(),
        referencia: f.referencia.trim(),
        aluguel: valor,
        vagasTotal,
        vagas: vagasTotal - ocupadas, // vagas livres = total menos as já ocupadas
        despesas: f.despesas,
        outras: f.outras.trim(),
        adendos: f.adendos.trim(),
      },
      faixa: faixaPorValor(valor / (vagasTotal + 1)),
    });
    setEditandoAp(false);
    mostrarAlerta('Pronto!', 'As informações do apartamento foram atualizadas.');
  };

  const incluidas = ap
    ? Object.keys(DESPESAS_LABEL).filter((k) => ap.despesas?.[k]).map((k) => DESPESAS_LABEL[k])
    : [];

  const linhas = [
    { icone: '👤', label: 'Nome completo', valor: u.nome },
    { icone: '🎓', label: 'Matrícula', valor: u.matricula },
    { icone: '📞', label: 'Telefone', valor: u.telefone },
    { icone: '✉️', label: 'E-mail', valor: u.email },
    { icone: '🪪', label: 'CPF', valor: u.cpf },
    { icone: '📍', label: 'Cidade', valor: u.cidade },
    { icone: '🔒', label: 'Senha', valor: '••••••••' },
  ];

  const campo = (label, key, extra = {}) => (
    <CampoTexto
      label={label}
      value={form[key]}
      onChangeText={(t) => setCampo(key, extra.mask ? extra.mask(t) : t)}
      {...extra.props}
    />
  );

  const linhaAp = (icone, titulo, valor) => (
    <TouchableOpacity style={styles.linhaAp} onPress={iniciarEdicaoAp}>
      <Text style={styles.linhaApIcone}>{icone}</Text>
      <View style={{ flex: 1 }}>
        <Text style={styles.linhaApTitulo}>{titulo}</Text>
        <Text style={styles.linhaApValor} numberOfLines={2}>{valor}</Text>
      </View>
      <Text style={styles.chevron}>›</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Header />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 30 }} keyboardShouldPersistTaps="handled">
        {/* INTERRUPTOR: MINHAS INFOS | AP INFOS */}
        <View style={styles.interruptorLinha}>
          <View style={styles.interruptor}>
            <TouchableOpacity
              style={[styles.seg, !verAp && styles.segAtivo]}
              onPress={irParaMinhas}
            >
              <Text style={[styles.segText, !verAp && styles.segTextAtivo]}>👤 Minhas infos</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.seg, verAp && styles.segAtivo]}
              onPress={irParaAp}
            >
              <Text style={[styles.segText, verAp && styles.segTextAtivo]}>🏠 AP Infos</Text>
            </TouchableOpacity>
          </View>
        </View>

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
            <Text style={styles.sobre} numberOfLines={5}>{u.sobre}</Text>
          </View>
        </View>

        {/* ================= MINHAS INFOS ================= */}
        {!verAp && !editando && (
          <>
            <View style={styles.card}>
              <Text style={styles.cardTitulo}>💜 Minhas preferências</Text>
              <Text style={styles.cardSub}>O que é importante para mim na convivência.</Text>
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

            <View style={styles.card}>
              <Text style={styles.cardTitulo}>👤 Informações</Text>
              <Text style={styles.cardSub}>Seus dados cadastrados no UNI AP.</Text>
              {linhas.map((l) => (
                <TouchableOpacity key={l.label} style={styles.linha} onPress={iniciarEdicao}>
                  <Text style={styles.linhaIcone}>{l.icone}</Text>
                  <Text style={styles.linhaLabel}>{l.label}</Text>
                  <Text style={styles.linhaValor} numberOfLines={1}>{l.valor}</Text>
                  <Text style={styles.chevron}>›</Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity style={styles.btnEditar} onPress={iniciarEdicao}>
                <Text style={styles.btnEditarText}>✏️ Editar</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.btnVoltar} onPress={() => navigation.navigate('Match')}>
              <Text style={styles.btnVoltarText}>← Voltar</Text>
            </TouchableOpacity>
          </>
        )}

        {!verAp && editando && (
          <View style={styles.card}>
            <Text style={[styles.cardTitulo, { marginBottom: 12 }]}>✏️ Editar perfil</Text>

            {campo('Nome completo', 'nome')}
            {campo('Matrícula', 'matricula', { props: { keyboardType: 'numeric' } })}
            {campo('Telefone', 'telefone', { mask: maskPhone, props: { keyboardType: 'phone-pad' } })}
            {campo('E-mail', 'email', { props: { autoCapitalize: 'none', keyboardType: 'email-address' } })}
            {campo('CPF', 'cpf', { mask: maskCpf, props: { keyboardType: 'numeric' } })}
            {campo('Cidade', 'cidade')}
            <CampoTexto
              label="Senha"
              senha
              value={form.senha}
              onChangeText={(t) => setCampo('senha', t)}
            />

            <CampoTexto
              label="Sobre você"
              multiline
              maxLength={300}
              value={form.sobre}
              onChangeText={(t) => setCampo('sobre', t)}
              contador={`${form.sobre.length}/300`}
            />

            <Text style={styles.label}>Horários</Text>
            <SelectField
              title="Sua rotina"
              placeholder="Selecione os horários"
              options={HORARIOS}
              multiple
              value={form.horarios}
              onChange={(v) => setCampo('horarios', v)}
            />

            <Text style={[styles.label, { marginTop: 14 }]}>Preferências</Text>
            <SelectField
              title="Suas preferências"
              placeholder="Selecione as preferências"
              options={PREFERENCIAS}
              multiple
              value={form.preferencias}
              onChange={(v) => setCampo('preferencias', v)}
            />

            <CampoTexto
              style={{ marginTop: 14 }}
              label="Observações"
              multiline
              maxLength={200}
              value={form.observacoes}
              onChangeText={(t) => setCampo('observacoes', t)}
              contador={`${form.observacoes.length}/200`}
            />

            {!ap && (
              <>
                <Text style={styles.label}>Faixa de preço</Text>
                <SelectField
                  title="Faixa de preço"
                  placeholder="Selecione a faixa de preço"
                  options={FAIXAS_PRECO}
                  value={form.faixa}
                  onChange={(v) => setCampo('faixa', v)}
                />
              </>
            )}

            <TouchableOpacity style={[styles.btnEditar, { marginTop: 22 }]} onPress={salvar}>
              <Text style={styles.btnEditarText}>✓ Salvar alterações</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setEditando(false)}>
              <Text style={styles.cancelar}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ================= AP INFOS ================= */}
        {verAp && !editandoAp && (
          <View style={styles.card}>
            <Text style={styles.cardTitulo}>🏠 AP Infos</Text>
            <Text style={styles.cardSub}>Informações sobre o apartamento que você possui.</Text>

            {/* FOTOS */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 10 }}>
              {(ap.fotos || []).map((uri, i) => (
                <View key={i} style={{ marginRight: 10 }}>
                  <Image source={{ uri }} style={styles.apFoto} />
                  <TouchableOpacity style={styles.remover} onPress={() => removerFotoAp(i)}>
                    <Text style={styles.removerText}>✕</Text>
                  </TouchableOpacity>
                </View>
              ))}
              <TouchableOpacity style={styles.addFoto} onPress={adicionarFotosAp}>
                <Text style={{ fontSize: 24 }}>🖼️</Text>
                <Text style={styles.addFotoText}>Adicionar fotos do apartamento</Text>
                <Text style={styles.addFotoSub}>Até {MAX_FOTOS_AP} fotos</Text>
              </TouchableOpacity>
            </ScrollView>

            {/* DOCUMENTO */}
            <View style={styles.linhaAp}>
              <Text style={styles.linhaApIcone}>📄</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.linhaApTitulo}>Documentos de comprovação</Text>
                <Text style={styles.linhaApValor} numberOfLines={2}>
                  {ap.docNome ? `Você já enviou: ${ap.docNome}` : 'Nenhum documento enviado.'}
                </Text>
              </View>
              <TouchableOpacity style={styles.btnPequeno} onPress={trocarDocumento}>
                <Text style={styles.btnPequenoText}>Trocar</Text>
              </TouchableOpacity>
            </View>

            {linhaAp('📍', 'Localização exata', `${ap.endereco} - ${ap.bairro}, ${ap.cidade}`)}
            {linhaAp('💰', 'Valor do aluguel', reais(ap.aluguel))}
            {linhaAp('🧮', 'Divisão do aluguel', textoDivisao(ap))}
            {linhaAp(
              '👥',
              'Vagas (sem contar com você)',
              `${info.livres} ${info.livres === 1 ? 'livre' : 'livres'} de ${info.total}`
            )}
            {linhaAp(
              '🚿',
              'Despesas da casa',
              incluidas.length ? `Incluso: ${incluidas.join(', ')}` : 'Nenhuma despesa incluída'
            )}
            {linhaAp('📝', 'Adendos do apartamento', ap.adendos || 'Nenhum adendo informado')}

            <TouchableOpacity style={styles.btnEditar} onPress={iniciarEdicaoAp}>
              <Text style={styles.btnEditarText}>✏️ Editar</Text>
            </TouchableOpacity>
          </View>
        )}

        {verAp && editandoAp && (
          <View style={styles.card}>
            <Text style={[styles.cardTitulo, { marginBottom: 12 }]}>✏️ Editar apartamento</Text>

            <CampoTexto
              label="Endereço completo"
              value={apForm.endereco}
              onChangeText={(t) => setApCampo('endereco', t)}
            />
            <CampoTexto label="Bairro" value={apForm.bairro} onChangeText={(t) => setApCampo('bairro', t)} />
            <CampoTexto label="Cidade" value={apForm.cidade} onChangeText={(t) => setApCampo('cidade', t)} />
            <CampoTexto
              label="Ponto de referência (opcional)"
              value={apForm.referencia}
              onChangeText={(t) => setApCampo('referencia', t)}
            />
            <CampoTexto
              label="Preço do aluguel"
              keyboardType="numeric"
              placeholder="R$ 0,00"
              value={apForm.aluguelDigits ? reais(parseInt(apForm.aluguelDigits, 10) / 100) : ''}
              onChangeText={(t) => setApCampo('aluguelDigits', t.replace(/\D/g, '').slice(0, 8))}
            />
            <CampoTexto
              label="Quantas vagas você oferece? (sem contar com você)"
              dica={
                ocupadas > 0
                  ? `Você já marcou ${ocupadas} ${ocupadas === 1 ? 'vaga' : 'vagas'} como ocupada${
                      ocupadas === 1 ? '' : 's'
                    } nos chats.`
                  : 'Número de colegas de quarto que você quer receber.'
              }
              keyboardType="numeric"
              value={apForm.vagasTexto}
              onChangeText={(t) => setApCampo('vagasTexto', t.replace(/\D/g, '').slice(0, 2))}
            />

            <Text style={styles.label}>Despesas incluídas no aluguel</Text>
            {DESPESAS.map((d) => (
              <View key={d.id} style={styles.switchRow}>
                <Text style={styles.switchLabel}>{d.label}</Text>
                <Switch
                  value={!!apForm.despesas[d.id]}
                  onValueChange={(v) => setApCampo('despesas', { ...apForm.despesas, [d.id]: v })}
                  trackColor={{ true: colors.primary, false: colors.border }}
                  thumbColor="#fff"
                />
              </View>
            ))}

            <CampoTexto
              style={{ marginTop: 14 }}
              label="Outras despesas"
              placeholder="Ex.: IPTU, limpeza, etc."
              value={apForm.outras}
              onChangeText={(t) => setApCampo('outras', t)}
            />
            <CampoTexto
              label="Adendos do apartamento"
              multiline
              maxLength={500}
              value={apForm.adendos}
              onChangeText={(t) => setApCampo('adendos', t)}
              contador={`${apForm.adendos.length}/500`}
            />

            <TouchableOpacity style={[styles.btnEditar, { marginTop: 10 }]} onPress={salvarAp}>
              <Text style={styles.btnEditarText}>✓ Salvar alterações</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setEditandoAp(false)}>
              <Text style={styles.cancelar}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* QUEM NÃO TEM AP: CONFIRMAÇÃO ANTES DE CADASTRAR O APARTAMENTO */}
      <ConfirmModal
        visible={confirmaAp}
        emoji="🏠"
        titulo="Você não tem um apartamento"
        texto="Encontrou algum e agora deseja mudar seu perfil para pessoa com apartamento procurando colegas?"
        textoSim="Sim, cadastrar apartamento"
        onSim={confirmarCadastroAp}
        onCancelar={() => setConfirmaAp(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },

  interruptorLinha: { alignItems: 'flex-end', marginBottom: 12 },
  interruptor: {
    flexDirection: 'row',
    backgroundColor: '#EBDDF7',
    borderRadius: 22,
    padding: 3,
  },
  seg: { paddingVertical: 7, paddingHorizontal: 12, borderRadius: 19 },
  segAtivo: { backgroundColor: colors.primary },
  segText: { color: colors.primary, fontWeight: '700', fontSize: 12 },
  segTextAtivo: { color: '#fff' },

  topo: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  foto: { width: 100, height: 100, borderRadius: 50 },
  fotoVazia: { backgroundColor: '#E6D6F3', alignItems: 'center', justifyContent: 'center' },
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

  card: { backgroundColor: '#fff', borderRadius: 18, padding: 16, marginBottom: 14 },
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

  linhaAp: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bg,
    borderRadius: 12,
    padding: 12,
    marginTop: 8,
  },
  linhaApIcone: { fontSize: 20, width: 34 },
  linhaApTitulo: { color: colors.primary, fontWeight: '700', fontSize: 13 },
  linhaApValor: { color: colors.text, fontSize: 12, marginTop: 2 },
  btnPequeno: {
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  btnPequenoText: { color: colors.primary, fontWeight: '700', fontSize: 12 },

  apFoto: { width: 130, height: 100, borderRadius: 12 },
  remover: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removerText: { color: '#fff', fontSize: 12 },
  addFoto: {
    width: 130,
    height: 100,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.primary,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 6,
    backgroundColor: colors.bg,
  },
  addFotoText: { color: colors.primary, fontWeight: '600', fontSize: 11, textAlign: 'center', marginTop: 2 },
  addFotoSub: { color: colors.muted, fontSize: 10 },

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
  label: { fontWeight: '700', color: colors.primary, fontSize: 14, marginBottom: 6 },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.bg,
  },
  switchLabel: { color: colors.text, fontSize: 15 },
  cancelar: { textAlign: 'center', color: colors.muted, marginTop: 14 },
});
