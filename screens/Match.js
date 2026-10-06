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
import { ladoOposto, comScore } from '../utils/people';
import { labelFaixa, labelHorario, labelPref, reais } from '../utils/format';

export default function Match({ navigation }) {
  const { currentUser, interests, rejected, chats, addInterest } = useApp();
  const euTemAp = !!currentUser?.ap;
  const [indice, setIndice] = useState(0);
  const [aberta, setAberta] = useState(null);

  // pessoas do lado oposto que ainda não foram marcadas, recusadas ou conversadas
  const fila = useMemo(
    () =>
      ladoOposto(currentUser)
        .filter(
          (p) =>
            !interests.includes(p.id) &&
            !rejected.includes(p.id) &&
            !chats.some((c) => c.personId === p.id)
        )
        .map((p) => comScore(p, currentUser))
        .sort((a, b) => b.score - a.score),
    [currentUser, interests, rejected, chats]
  );

  const pessoa = fila[indice];

  const proxima = () => setIndice((i) => Math.min(i + 1, fila.length));
  const anterior = () => setIndice((i) => Math.max(i - 1, 0));

  // clique em "Interessado?" no pop-up
  const interessar = (p) => {
    const resultado = addInterest(p);
    if (resultado === 'match') {
      return {
        titulo: 'Essa pessoa já está interessada em você! 🎉',
        texto: 'Boa sorte!!! Vocês já podem conversar na aba de chats.',
        botao: 'Ir para os chats',
        aoFechar: () => navigation.navigate('Chats'),
      };
    }
    return {
      titulo: 'Interesse enviado! 💜',
      texto:
        'Você demonstrou interesse em conversar com essa pessoa. Caso ela aceite, ela aparecerá nos seus chats e vocês poderão conversar. Boa sorte!!!',
      botao: 'Ok',
    };
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header />

      <Text style={styles.aviso}>
        {euTemAp
          ? '🔎 Pessoas que procuram apartamento'
          : '🏠 Pessoas que têm apartamento'}
      </Text>

      {pessoa ? (
        <ScrollView contentContainerStyle={{ padding: 16 }}>
          <View style={styles.card}>
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => setAberta(pessoa)}>
              <Image source={{ uri: pessoa.foto }} style={styles.foto} />
              {pessoa.online && (
                <View style={styles.online}>
                  <Text style={styles.onlineText}>● Online</Text>
                </View>
              )}
              <View style={styles.compat}>
                <Text style={styles.compatText}>
                  💜 {pessoa.score}% compatível
                </Text>
              </View>
              <View style={styles.infoFoto}>
                <Text style={styles.nome}>
                  {pessoa.nome}, {pessoa.idade}
                </Text>
                <Text style={styles.sub}>
                  📍 {pessoa.cidade} • {pessoa.curso}
                </Text>
              </View>
            </TouchableOpacity>

            <View style={styles.tags}>
              {pessoa.preferencias.slice(0, 4).map((id) => (
                <View key={id} style={styles.tag}>
                  <Text style={styles.tagText}>{labelPref(id)}</Text>
                </View>
              ))}
            </View>

            <View style={styles.linha}>
              <TouchableOpacity
                style={styles.btnSeta}
                onPress={anterior}
                disabled={indice === 0}>
                <Text style={[styles.seta, indice === 0 && { opacity: 0.3 }]}>
                  ‹
                </Text>
              </TouchableOpacity>

              <View style={styles.resumo}>
                <Text style={styles.resumoSobre} numberOfLines={3}>
                  {pessoa.sobre}
                </Text>
                <Text style={styles.resumoLinha} numberOfLines={1}>
                  💰 {labelFaixa(pessoa.faixa)}
                </Text>
                <Text style={styles.resumoLinha} numberOfLines={1}>
                  🕐 {pessoa.horarios.slice(0, 2).map(labelHorario).join(' • ')}
                </Text>
                {pessoa.ap && (
                  <Text style={styles.resumoAp} numberOfLines={1}>
                    🏠 {reais(pessoa.ap.aluguel)} • {pessoa.ap.bairro}
                  </Text>
                )}
                <TouchableOpacity onPress={() => setAberta(pessoa)}>
                  <Text style={styles.verMais}>Ver perfil completo ›</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity style={styles.btnSeta} onPress={proxima}>
                <Text style={styles.seta}>›</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.contador}>
              {Math.min(indice + 1, fila.length)} de {fila.length}
            </Text>
          </View>
        </ScrollView>
      ) : (
        <View style={styles.fim}>
          <Text style={styles.fimEmoji}>🎉</Text>
          <Text style={styles.fimTitulo}>Você viu todas as sugestões!</Text>
          <Text style={styles.fimSub}>
            Veja quem se interessou por você na aba Interessados ou volte mais
            tarde para novos perfis.
          </Text>
          {fila.length > 0 && (
            <TouchableOpacity
              style={styles.btnRecomecar}
              onPress={() => setIndice(0)}>
              <Text style={styles.btnRecomecarText}>Ver novamente</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      <PersonModal
        person={aberta}
        eu={currentUser}
        botao={{ label: '💜 Interessado?', onPress: interessar }}
        onClose={() => setAberta(null)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  aviso: { paddingHorizontal: 20, color: colors.primary, fontWeight: '700' },
  card: {
    backgroundColor: '#fff',
    borderRadius: 24,
    overflow: 'hidden',
    paddingBottom: 14,
  },
  foto: { width: '100%', height: 340 },
  online: {
    position: 'absolute',
    top: 14,
    right: 14,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  onlineText: { color: '#2A9D8F', fontWeight: '600', fontSize: 12 },
  compat: {
    position: 'absolute',
    top: 14,
    left: 14,
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  compatText: { color: '#fff', fontWeight: '700', fontSize: 12 },
  infoFoto: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 14,
    backgroundColor: 'rgba(59,30,90,0.55)',
  },
  nome: { color: '#fff', fontSize: 26, fontWeight: 'bold' },
  sub: { color: '#fff', marginTop: 2 },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 14,
    paddingBottom: 4,
  },
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
    paddingHorizontal: 10,
    marginTop: 4,
  },
  btnSeta: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EBDDF7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  seta: { fontSize: 30, color: colors.primary, marginTop: -4 },
  resumo: {
    flex: 1,
    backgroundColor: colors.bg,
    borderRadius: 16,
    padding: 10,
    marginHorizontal: 8,
  },
  resumoSobre: { color: colors.text, fontSize: 12, marginBottom: 6 },
  resumoLinha: { color: colors.text, fontSize: 12, marginBottom: 2 },
  resumoAp: {
    color: colors.pink,
    fontWeight: '700',
    fontSize: 12,
    marginBottom: 2,
  },
  verMais: {
    color: colors.primary,
    fontWeight: '700',
    fontSize: 12,
    marginTop: 6,
  },
  contador: { textAlign: 'center', color: colors.muted, marginTop: 10 },
  fim: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 30 },
  fimEmoji: { fontSize: 50 },
  fimTitulo: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.primary,
    marginTop: 10,
  },
  fimSub: {
    color: colors.text,
    marginTop: 6,
    marginBottom: 20,
    textAlign: 'center',
  },
  btnRecomecar: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 30,
    borderRadius: 30,
    marginTop: 10,
  },
  btnRecomecarText: { color: '#fff', fontWeight: '600', fontSize: 16 },
});
