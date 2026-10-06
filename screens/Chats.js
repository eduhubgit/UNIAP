import React, { useMemo, useState } from 'react';
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
import PersonModal from '../components/PersonModal';
import { buscarPessoa } from '../utils/people';
import LogoUniAp from '../components/LogoUniAp';

export default function Chats({ navigation }) {
  const { currentUser, chats } = useApp();
  const [info, setInfo] = useState(null);

  // conversas mais recentes primeiro
  const lista = useMemo(
    () =>
      chats
        .map((chat) => ({
          chat,
          pessoa: buscarPessoa(chat.personId),
          ultima: chat.mensagens[chat.mensagens.length - 1],
        }))
        .filter((x) => x.pessoa)
        .sort((a, b) => b.ultima.ts - a.ultima.ts),
    [chats]
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topo}>
        <TouchableOpacity
          style={styles.voltar}
          onPress={() => navigation.goBack()}>
          <Text style={styles.voltarText}>←</Text>
        </TouchableOpacity>
                <LogoUniAp tamanho={32} />
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Text style={styles.titulo}>Conversas</Text>
        <Text style={styles.subtitulo}>
          Seus matches e novas mensagens em um só lugar.
        </Text>

        {lista.length === 0 ? (
          <View style={styles.vazio}>
            <Text style={styles.vazioEmoji}>💬</Text>
            <Text style={styles.vazioText}>
              Você ainda não tem conversas. Marque interesse em alguém ou aceite
              quem se interessou por você!
            </Text>
          </View>
        ) : (
          lista.map(({ chat, pessoa, ultima }) => (
            <TouchableOpacity
              key={chat.personId}
              style={[styles.linha, chat.naoLidas > 0 && styles.linhaNova]}
              onPress={() =>
                navigation.navigate('Chat', { personId: pessoa.id })
              }>
              <TouchableOpacity onPress={() => setInfo(pessoa)}>
                <Image source={{ uri: pessoa.foto }} style={styles.foto} />
                {pessoa.online && <View style={styles.pontoOnline} />}
              </TouchableOpacity>

              <View style={styles.textos}>
                <Text style={styles.nome} numberOfLines={1}>
                  {pessoa.nome}
                </Text>
                <Text
                  style={[
                    styles.previa,
                    chat.naoLidas > 0 && {
                      color: colors.text,
                      fontWeight: '600',
                    },
                  ]}
                  numberOfLines={2}>
                  {ultima.de === 'eu' ? 'Você: ' : ''}
                  {ultima.texto}
                </Text>
              </View>

              <View style={styles.lado}>
                <Text style={styles.hora}>{ultima.hora}</Text>
                {chat.naoLidas > 0 ? (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{chat.naoLidas}</Text>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.btnInfo}
                    onPress={() => setInfo(pessoa)}>
                    <Text style={styles.btnInfoText}>i</Text>
                  </TouchableOpacity>
                )}
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      <PersonModal
        person={info}
        eu={currentUser}
        onClose={() => setInfo(null)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  topo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  voltar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  voltarText: { fontSize: 22, color: colors.primary },
  logo: { fontSize: 26, fontWeight: 'bold', color: colors.primary },
  titulo: { fontSize: 30, fontWeight: 'bold', color: colors.primary },
  subtitulo: { color: colors.muted, marginBottom: 14 },
  linha: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 12,
    marginBottom: 10,
  },
  linhaNova: { backgroundColor: '#F3E6FB' },
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
  textos: { flex: 1, marginHorizontal: 12 },
  nome: { fontSize: 16, fontWeight: 'bold', color: colors.primary },
  previa: { color: colors.muted, fontSize: 13, marginTop: 2 },
  lado: { alignItems: 'flex-end', minWidth: 44 },
  hora: { color: colors.muted, fontSize: 12 },
  badge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.pink,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
    paddingHorizontal: 5,
  },
  badgeText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  btnInfo: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1.5,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  btnInfoText: { color: colors.primary, fontWeight: 'bold', fontSize: 13 },
  vazio: { alignItems: 'center', padding: 30 },
  vazioEmoji: { fontSize: 44 },
  vazioText: {
    color: colors.text,
    textAlign: 'center',
    marginTop: 10,
    lineHeight: 21,
  },
});
