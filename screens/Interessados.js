import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { colors } from '../theme';
import { useApp } from '../context/AppContext';
import Header from '../components/Header';
import PersonModal from '../components/PersonModal';
import ConfirmModal from '../components/ConfirmModal';
import { buscarPessoa, recebidosPendentes } from '../utils/people';

export default function Interessados({ navigation }) {
  const {
    currentUser,
    interests,
    rejected,
    chats,
    acceptIncoming,
    rejectIncoming,
    removeInterest,
    simulateAccept,
  } = useApp();

  const [aba, setAba] = useState('recebidos'); // 'recebidos' | 'enviados'
  const [info, setInfo] = useState(null);
  const [confirmacao, setConfirmacao] = useState(null); // { tipo, pessoa }

  const recebidos = useMemo(
    () => recebidosPendentes(currentUser, rejected, chats),
    [currentUser, rejected, chats]
  );
  const enviados = useMemo(
    () => interests.map(buscarPessoa).filter(Boolean),
    [interests]
  );
  const lista = aba === 'recebidos' ? recebidos : enviados;

  // textos de cada pop-up de confirmação
  const textosConfirmacao = (tipo, p) => {
    if (tipo === 'aceitar') {
      return {
        emoji: '💬',
        titulo: `Conversar com ${p.nome}?`,
        texto:
          'Você realmente quer conversar com essa pessoa? A conversa será aberta na sua aba de chats.',
        textoSim: 'Sim, conversar',
        perigo: false,
      };
    }
    if (tipo === 'recusar') {
      return {
        emoji: '🙅',
        titulo: `Recusar ${p.nome}?`,
        texto: 'Essa pessoa não aparecerá mais para você.',
        textoSim: 'Sim, recusar',
        perigo: true,
      };
    }
    return {
      emoji: '↩️',
      titulo: 'Desmarcar interesse?',
      texto: `Você realmente quer desmarcar seu interesse em ${p.nome}? Essa pessoa voltará para as sugestões da tela inicial.`,
      textoSim: 'Sim, desmarcar',
      perigo: true,
    };
  };

  const executarConfirmacao = () => {
    const { tipo, pessoa } = confirmacao;
    setConfirmacao(null);
    if (tipo === 'aceitar') {
      acceptIncoming(pessoa);
      setTimeout(() => navigation.navigate('Chats'), 300);
    } else if (tipo === 'recusar') {
      rejectIncoming(pessoa.id);
    } else {
      removeInterest(pessoa.id);
    }
  };

  const conf = confirmacao
    ? textosConfirmacao(confirmacao.tipo, confirmacao.pessoa)
    : {};

  const linha = (p) => (
    <View key={p.id} style={styles.linha}>
      <TouchableOpacity onPress={() => setInfo(p)}>
        <Image source={{ uri: p.foto }} style={styles.foto} />
        {p.online && <View style={styles.pontoOnline} />}
      </TouchableOpacity>

      <View style={styles.textos}>
        <Text style={styles.nome} numberOfLines={1}>
          {p.nome}
        </Text>
        <Text style={styles.idade}>{p.idade} anos</Text>
        <Text style={styles.msg} numberOfLines={2}>
          {aba === 'recebidos'
            ? p.msgInteresse || 'Vamos conversar?'
            : 'Aguardando resposta ⏳'}
        </Text>
        {aba === 'enviados' && (
          <TouchableOpacity
            onPress={() => {
              simulateAccept(p);
              setTimeout(() => navigation.navigate('Chats'), 200);
            }}>
            <Text style={styles.teste}>🧪 Simular aceite (teste)</Text>
          </TouchableOpacity>
        )}
      </View>

      <TouchableOpacity style={styles.btnInfo} onPress={() => setInfo(p)}>
        <Text style={styles.btnInfoText}>i</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.btnRedondo, { backgroundColor: colors.pink }]}
        onPress={() =>
          setConfirmacao({
            tipo: aba === 'recebidos' ? 'recusar' : 'desmarcar',
            pessoa: p,
          })
        }>
        <Text style={styles.btnRedondoText}>✕</Text>
      </TouchableOpacity>
      {aba === 'recebidos' && (
        <TouchableOpacity
          style={[styles.btnRedondo, { backgroundColor: colors.primary }]}
          onPress={() => setConfirmacao({ tipo: 'aceitar', pessoa: p })}>
          <Text style={styles.btnRedondoText}>✓</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Header />

      <View style={styles.abas}>
        <TouchableOpacity
          style={[styles.aba, aba === 'recebidos' && styles.abaAtiva]}
          onPress={() => setAba('recebidos')}>
          <Text
            style={[styles.abaText, aba === 'recebidos' && { color: '#fff' }]}>
            Interessados em você ({recebidos.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.aba, aba === 'enviados' && styles.abaAtiva]}
          onPress={() => setAba('enviados')}>
          <Text
            style={[styles.abaText, aba === 'enviados' && { color: '#fff' }]}>
            Seus interesses ({enviados.length})
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Text style={styles.titulo}>
          {aba === 'recebidos' ? 'Pessoas interessadas' : 'Quem você marcou'}
        </Text>
        <Text style={styles.subtitulo}>
          {aba === 'recebidos'
            ? 'Essas pessoas se interessaram pelo seu perfil.'
            : 'Pessoas em quem você demonstrou interesse e aguardam resposta.'}
        </Text>

        {lista.length === 0 ? (
          <View style={styles.vazio}>
            <Text style={styles.vazioEmoji}>
              {aba === 'recebidos' ? '💌' : '🔎'}
            </Text>
            <Text style={styles.vazioText}>
              {aba === 'recebidos'
                ? 'Ninguém novo por aqui ainda. Continue explorando!'
                : 'Você ainda não marcou interesse em ninguém. Toque em "Interessado?" no perfil de alguém na tela inicial.'}
            </Text>
          </View>
        ) : (
          lista.map(linha)
        )}
      </ScrollView>

      <PersonModal
        person={info}
        eu={currentUser}
        onClose={() => setInfo(null)}
      />

      <ConfirmModal
        visible={!!confirmacao}
        {...conf}
        onSim={executarConfirmacao}
        onCancelar={() => setConfirmacao(null)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  abas: { flexDirection: 'row', paddingHorizontal: 16, marginTop: 4 },
  aba: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 20,
    paddingVertical: 8,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  abaAtiva: { backgroundColor: colors.primary },
  abaText: { color: colors.primary, fontWeight: '700', fontSize: 12 },
  titulo: { fontSize: 22, fontWeight: 'bold', color: colors.primary },
  subtitulo: { color: colors.text, marginBottom: 14, marginTop: 2 },
  linha: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 12,
    marginBottom: 10,
  },
  foto: { width: 58, height: 58, borderRadius: 29 },
  pontoOnline: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#2EC4A6',
    borderWidth: 2,
    borderColor: '#fff',
  },
  textos: { flex: 1, marginHorizontal: 10 },
  nome: { fontSize: 16, fontWeight: 'bold', color: colors.primary },
  idade: { color: colors.muted, fontSize: 12 },
  msg: { color: colors.text, fontSize: 13, marginTop: 2 },
  teste: { color: colors.pink, fontSize: 11, fontWeight: '700', marginTop: 4 },
  btnInfo: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1.5,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  btnInfoText: { color: colors.primary, fontWeight: 'bold', fontSize: 16 },
  btnRedondo: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
  },
  btnRedondoText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  vazio: { alignItems: 'center', padding: 30 },
  vazioEmoji: { fontSize: 44 },
  vazioText: {
    color: colors.text,
    textAlign: 'center',
    marginTop: 10,
    lineHeight: 21,
  },
});
