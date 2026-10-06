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
import { colors } from '../theme';
import { useApp } from '../context/AppContext';
import PersonModal from '../components/PersonModal';
import { buscarPessoa } from '../utils/people';

export default function Chat({ route, navigation }) {
  const { personId } = route.params;
  const { currentUser, chats, sendMessage, markRead } = useApp();
  const [texto, setTexto] = useState('');
  const [info, setInfo] = useState(false);
  const listaRef = useRef(null);

  const pessoa = buscarPessoa(personId);
  const chat = chats.find((c) => c.personId === personId);
  const total = chat ? chat.mensagens.length : 0;

  // marca como lida ao abrir e sempre que chegar mensagem
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

  const renderMensagem = ({ item }) => {
    const minha = item.de === 'eu';
    return (
      <View
        style={[
          styles.linhaMsg,
          minha ? { alignItems: 'flex-end' } : { alignItems: 'flex-start' },
        ]}>
        <View
          style={[styles.balao, minha ? styles.balaoMeu : styles.balaoDele]}>
          <Text style={[styles.msgTexto, minha && { color: '#fff' }]}>
            {item.texto}
          </Text>
        </View>
        <Text style={styles.msgHora}>{item.hora}</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {/* TOPO */}
        <View style={styles.topo}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.voltar}>
            <Text style={styles.voltarText}>←</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.pessoa} onPress={() => setInfo(true)}>
            <Image source={{ uri: pessoa.foto }} style={styles.foto} />
            <View style={{ marginLeft: 10 }}>
              <Text style={styles.nome}>{pessoa.nome}</Text>
              <Text style={styles.status}>
                {pessoa.online ? '● Online' : 'Offline'}
              </Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.btnInfo}
            onPress={() => setInfo(true)}>
            <Text style={styles.btnInfoText}>i</Text>
          </TouchableOpacity>
        </View>

        {/* MENSAGENS */}
        <FlatList
          ref={listaRef}
          data={chat.mensagens}
          keyExtractor={(m) => m.id}
          renderItem={renderMensagem}
          contentContainerStyle={{ padding: 14 }}
          onContentSizeChange={() =>
            listaRef.current?.scrollToEnd({ animated: true })
          }
        />

        {/* CAMPO DE ESCREVER */}
        <View style={styles.barra}>
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
            <Text style={[styles.enviar, !texto.trim() && { opacity: 0.35 }]}>
              Enviar
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      <PersonModal
        person={info ? pessoa : null}
        eu={currentUser}
        onClose={() => setInfo(false)}
      />
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
  voltar: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  voltarText: { fontSize: 24, color: colors.primary },
  pessoa: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 4,
  },
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
  linhaMsg: { marginBottom: 10 },
  balao: {
    maxWidth: '78%',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 22,
  },
  balaoMeu: { backgroundColor: colors.primary, borderBottomRightRadius: 6 },
  balaoDele: { backgroundColor: '#EFE6F7', borderBottomLeftRadius: 6 },
  msgTexto: { color: colors.text, fontSize: 15 },
  msgHora: {
    fontSize: 10,
    color: colors.muted,
    marginTop: 3,
    marginHorizontal: 6,
  },
  barra: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: colors.bg,
  },
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
  enviar: {
    color: colors.primary,
    fontWeight: '700',
    fontSize: 16,
    marginLeft: 12,
  },
});
