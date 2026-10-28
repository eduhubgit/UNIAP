import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  Image,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme';
import { useApp } from '../context/AppContext';
import PersonModal from '../components/PersonModal';
import { buscarPessoa } from '../utils/people';
import { buscarPerfil } from '../utils/ocupantes';
import { vagasInfo } from '../utils/perfil';
import { mostrarAlerta } from '../utils/alerta';

export default function Chat({ route, navigation }) {
  const { personId } = route.params;
  const {
    currentUser,
    chats,
    sendMessage,
    markRead,
    alternarVagaOcupada,
    alternarAceitoNaVaga,
  } = useApp();
  const insets = useSafeAreaInsets();
  const [texto, setTexto] = useState('');
  const [perfil, setPerfil] = useState(null); // pessoa com o perfil aberto
  const listaRef = useRef(null);

  const pessoa = buscarPessoa(personId);
  const chat = chats.find((c) => c.personId === personId);
  const total = chat ? chat.mensagens.length : 0;

  useEffect(() => {
    markRead(personId);
  }, [total]);

  const enviar = () => {
    const msg = texto.trim();
    if (!msg) return;
    sendMessage(personId, msg);
    setTexto('');
  };

  if (!pessoa || !chat) return null;

  // qual botão aparece no canto direito do topo
  let modo = 'info';
  if (currentUser?.ap && !pessoa.ap) modo = 'dono'; // tem apê, conversa com quem procura
  else if (currentUser && !currentUser.ap && pessoa.ap) modo = 'procurando'; // procura apê, conversa com dono

  const livres = vagasInfo(currentUser?.ap).livres;

  const alternarVaga = () => {
    const r = alternarVagaOcupada(personId);
    if (!r.ok && r.motivo === 'sem-vagas') {
      mostrarAlerta(
        'Sem vagas disponíveis',
        'Todas as suas vagas já estão ocupadas. Para aumentar, vá em Perfil → AP Infos e edite a quantidade de vagas.'
      );
    }
  };

  const tocouNasMalas = () => {
    if (chat.aceitoNaVaga) {
      mostrarAlerta('Você foi aceito(a)! 🎉', 'O dono do apê te marcou como "Vaga ocupada". Pode ajeitar as malas!');
    } else {
      mostrarAlerta(
        'Ainda não',
        'Quando o dono do apê te marcar como "Vaga ocupada", este círculo fica verde e significa que você foi aceito(a).'
      );
    }
  };

  // envia ao interlocutor quem já mora com você (as vagas que você marcou como ocupadas)
  const enviarOcupantes = () => {
    const ids = chats
      .filter((c) => c.vagaOcupada && c.personId !== personId)
      .map((c) => c.personId);

    if (ids.length === 0) {
      mostrarAlerta(
        'Nenhum ocupante',
        'Você ainda não marcou nenhuma vaga como ocupada. Marque "Vaga ocupada?" no chat de quem vai morar com você para poder mostrar quem já mora aí.'
      );
      return;
    }
    sendMessage(personId, 'Esses são os atuais moradores do meu apê:', {
      tipo: 'ocupantes',
      ocupantes: ids,
    });
  };

  const renderMensagem = ({ item }) => {
    const minha = item.de === 'eu';
    const alinhamento = minha ? { alignItems: 'flex-end' } : { alignItems: 'flex-start' };

    // mensagem especial: mini perfis dos moradores
    if (item.tipo === 'ocupantes') {
      return (
        <View style={[styles.linhaMsg, alinhamento]}>
          <View style={[styles.balao, minha ? styles.balaoMeu : styles.balaoDele]}>
            <Text style={[styles.msgTexto, minha && { color: '#fff' }]}>{item.texto}</Text>
            <View style={styles.ocupLinha}>
              {(item.ocupantes || []).map((id) => {
                const p = buscarPerfil(id);
                if (!p) return null;
                return (
                  <TouchableOpacity key={id} style={styles.ocup} onPress={() => setPerfil(p)}>
                    <Image source={{ uri: p.foto }} style={styles.ocupFoto} />
                    <Text
                      style={[styles.ocupNome, minha && { color: '#fff' }]}
                      numberOfLines={1}
                    >
                      {p.nome}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <Text style={[styles.ocupDica, minha && { color: '#E6D6F3' }]}>
              Toque para ver o perfil
            </Text>
          </View>
          <Text style={styles.msgHora}>{item.hora}</Text>
        </View>
      );
    }

    return (
      <View style={[styles.linhaMsg, alinhamento]}>
        <View style={[styles.balao, minha ? styles.balaoMeu : styles.balaoDele]}>
          <Text style={[styles.msgTexto, minha && { color: '#fff' }]}>{item.texto}</Text>
        </View>
        <Text style={styles.msgHora}>{item.hora}</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {/* TOPO */}
        <View style={styles.topo}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.voltar}>
            <Text style={styles.voltarText}>←</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.pessoa} onPress={() => setPerfil(pessoa)}>
            <Image source={{ uri: pessoa.foto }} style={styles.foto} />
            <View style={{ marginLeft: 10, flex: 1 }}>
              <Text style={styles.nome} numberOfLines={1}>
                {pessoa.nome}
                {chat.produto ? ' 🛒' : ''}
              </Text>
              <Text style={styles.status} numberOfLines={1}>
                {chat.produto
                  ? `Sobre: ${chat.produto.titulo}`
                  : pessoa.online
                  ? '● Online'
                  : 'Offline'}
              </Text>
            </View>
          </TouchableOpacity>

          {modo === 'dono' && (
            <View style={styles.vaga}>
              <View style={{ marginRight: 8 }}>
                <Text style={styles.vagaLabel}>Vaga ocupada?</Text>
                <Text style={styles.vagaSub}>
                  {livres} {livres === 1 ? 'livre' : 'livres'}
                </Text>
              </View>
              <TouchableOpacity
                style={[styles.circulo, chat.vagaOcupada && styles.circuloVerde]}
                onPress={alternarVaga}
              >
                {chat.vagaOcupada && <Text style={styles.check}>✓</Text>}
              </TouchableOpacity>
            </View>
          )}

          {modo === 'procurando' && (
            <View style={styles.vaga}>
              <Text style={[styles.vagaLabel, { marginRight: 8, maxWidth: 96 }]}>
                Posso ajeitar as malas?
              </Text>
              <TouchableOpacity
                style={[styles.circulo, chat.aceitoNaVaga && styles.circuloVerde]}
                onPress={tocouNasMalas}
              >
                {chat.aceitoNaVaga && <Text style={styles.check}>✓</Text>}
              </TouchableOpacity>
            </View>
          )}

          {modo === 'info' && (
            <TouchableOpacity style={styles.btnInfo} onPress={() => setPerfil(pessoa)}>
              <Text style={styles.btnInfoText}>i</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* TESTE: simular o aceite do dono do apê */}
        {modo === 'procurando' && (
          <TouchableOpacity style={styles.teste} onPress={() => alternarAceitoNaVaga(personId)}>
            <Text style={styles.testeText}>
              🧪 Teste:{' '}
              {chat.aceitoNaVaga
                ? 'desfazer o aceite'
                : 'simular que o dono do apê me marcou como "Vaga ocupada"'}
            </Text>
          </TouchableOpacity>
        )}

        {/* MENSAGENS */}
        <FlatList
          ref={listaRef}
          data={chat.mensagens}
          keyExtractor={(m) => m.id}
          renderItem={renderMensagem}
          contentContainerStyle={{ padding: 14 }}
          onContentSizeChange={() => listaRef.current?.scrollToEnd({ animated: true })}
        />

        {/* CAMPO DE ESCREVER */}
        <View
          style={[
            styles.barra,
            { paddingBottom: 10 + (Platform.OS === 'android' ? insets.bottom : 0) },
          ]}
        >
          {modo === 'dono' && (
            <TouchableOpacity style={styles.btnOcupantes} onPress={enviarOcupantes}>
              <Text style={styles.ocupIcone}>👥</Text>
              <Text style={styles.ocupLabel}>Ocupantes</Text>
            </TouchableOpacity>
          )}
          <TextInput
            style={styles.input}
            placeholder="Mensagem..."
            placeholderTextColor={colors.muted}
            value={texto}
            onChangeText={setTexto}
            onSubmitEditing={enviar}
            returnKeyType="send"
          />
          <TouchableOpacity onPress={enviar} disabled={!texto.trim()}>
            <Text style={[styles.enviar, !texto.trim() && { opacity: 0.35 }]}>Enviar</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      <PersonModal person={perfil} eu={currentUser} onClose={() => setPerfil(null)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  topo: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.bg,
  },
  voltar: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  voltarText: { fontSize: 24, color: colors.primary },
  pessoa: { flex: 1, flexDirection: 'row', alignItems: 'center', marginLeft: 4 },
  foto: { width: 42, height: 42, borderRadius: 21 },
  nome: { fontSize: 16, fontWeight: 'bold', color: colors.primary },
  status: { fontSize: 12, color: '#2A9D8F' },
  btnInfo: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnInfoText: { color: colors.primary, fontWeight: 'bold' },

  vaga: { flexDirection: 'row', alignItems: 'center', marginLeft: 8 },
  vagaLabel: { color: colors.primary, fontWeight: '700', fontSize: 12, textAlign: 'right' },
  vagaSub: { color: colors.muted, fontSize: 11, textAlign: 'right' },
  circulo: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  circuloVerde: { backgroundColor: '#2EC4A6', borderColor: '#2EC4A6' },
  check: { color: '#fff', fontWeight: 'bold', fontSize: 18, marginTop: -2 },

  teste: { backgroundColor: '#FCE4F1', paddingVertical: 6, paddingHorizontal: 12 },
  testeText: { color: colors.pink, fontWeight: '700', fontSize: 11, textAlign: 'center' },

  linhaMsg: { marginBottom: 10 },
  balao: { maxWidth: '82%', paddingVertical: 10, paddingHorizontal: 14, borderRadius: 22 },
  balaoMeu: { backgroundColor: colors.primary, borderBottomRightRadius: 6 },
  balaoDele: { backgroundColor: '#EFE6F7', borderBottomLeftRadius: 6 },
  msgTexto: { color: colors.text, fontSize: 15 },
  msgHora: { fontSize: 10, color: colors.muted, marginTop: 3, marginHorizontal: 6 },

  ocupLinha: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 10 },
  ocup: { alignItems: 'center', marginRight: 12, marginBottom: 4, width: 60 },
  ocupFoto: { width: 48, height: 48, borderRadius: 24, borderWidth: 2, borderColor: '#fff' },
  ocupNome: { fontSize: 11, color: colors.primary, fontWeight: '700', marginTop: 3 },
  ocupDica: { fontSize: 10, color: colors.muted, marginTop: 2 },

  barra: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.bg,
  },
  btnOcupantes: { alignItems: 'center', marginRight: 10, minWidth: 56 },
  ocupIcone: { fontSize: 22 },
  ocupLabel: { fontSize: 10, color: colors.primary, fontWeight: '700' },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 24,
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: colors.bg,
    color: colors.text,
  },
  enviar: { color: colors.primary, fontWeight: '700', fontSize: 16, marginLeft: 12 },
});