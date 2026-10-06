import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
} from "react-native";
import { colors } from "../theme";
import { useApp } from "../context/AppContext";
import Header from "../components/Header";
import PersonModal from "../components/PersonModal";
import { ladoOposto, comScore } from "../utils/people";
import { labelFaixa, labelHorario, labelPref, reais } from "../utils/format";

const FOTO_H = 360; // altura da foto
const SETA_ALTURA = 100; // altura das setas (maior = mais comprida)
const SETA_LARGURA = 26; // largura das setas (mantida estreita para não cortar a foto)
const FAIXA_CONTADOR = 36; // altura da faixa do "1 de 2", logo abaixo da foto

export default function Match({ navigation }) {
  const { currentUser, interests, rejected, chats, addInterest } = useApp();
  const [indice, setIndice] = useState(0);
  const [aberta, setAberta] = useState(null);

  // quem tem AP vê só quem não tem; quem não tem vê só quem tem
  const fila = useMemo(
    () =>
      ladoOposto(currentUser)
        .filter(
          (p) =>
            !interests.includes(p.id) &&
            !rejected.includes(p.id) &&
            !chats.some((c) => c.personId === p.id),
        )
        .map((p) => comScore(p, currentUser))
        .sort((a, b) => b.score - a.score),
    [currentUser, interests, rejected, chats],
  );

  const pessoa = fila[indice];

  const proxima = () => setIndice((i) => Math.min(i + 1, fila.length));
  const anterior = () => setIndice((i) => Math.max(i - 1, 0));

  const interessar = (p) => {
    const resultado = addInterest(p);
    if (resultado === "match") {
      return {
        titulo: "Essa pessoa já está interessada em você! 🎉",
        texto: "Boa sorte!!! Vocês já podem conversar na aba de chats.",
        botao: "Ir para os chats",
        aoFechar: () => navigation.navigate("Chats"),
      };
    }
    return {
      titulo: "Interesse enviado! 💜",
      texto:
        "Você demonstrou interesse em conversar com essa pessoa. Caso ela aceite, ela aparecerá nos seus chats e vocês poderão conversar. Boa sorte!!!",
      botao: "Ok",
    };
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header />

      {pessoa ? (
        <ScrollView contentContainerStyle={{ padding: 16 }}>
          <View style={styles.card}>
            {/* FOTO + BARRA DO NOME */}
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => setAberta(pessoa)}
            >
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
                <Text style={styles.sub} numberOfLines={1}>
                  📍 {pessoa.cidade} • {pessoa.curso}
                </Text>
              </View>
            </TouchableOpacity>

            {/* SETAS: altas, estreitas, coloridas, grudadas nas laterais */}
            <TouchableOpacity
              style={[
                styles.seta,
                styles.setaEsq,
                indice === 0 && { opacity: 0.35 },
              ]}
              onPress={anterior}
              disabled={indice === 0}
            >
              <Text style={styles.setaText}>‹</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.seta, styles.setaDir]}
              onPress={proxima}
            >
              <Text style={styles.setaText}>›</Text>
            </TouchableOpacity>

            {/* CONTADOR NO MEIO, ENTRE AS SETAS */}
            <Text style={styles.contador}>
              {Math.min(indice + 1, fila.length)} de {fila.length}
            </Text>

            {/* TAGS */}
            <View style={styles.tags}>
              {pessoa.preferencias.slice(0, 4).map((id) => (
                <View key={id} style={styles.tag}>
                  <Text style={styles.tagText}>{labelPref(id)}</Text>
                </View>
              ))}
            </View>

            {/* RESUMO COM A LARGURA TODA */}
            <View style={styles.resumo}>
              <Text style={styles.resumoSobre} numberOfLines={4}>
                {pessoa.sobre}
              </Text>
              <Text style={styles.resumoLinha}>
                💰 {labelFaixa(pessoa.faixa)}
              </Text>
              <Text style={styles.resumoLinha}>
                🕐 {pessoa.horarios.slice(0, 3).map(labelHorario).join(" • ")}
              </Text>
              {pessoa.ap && (
                <Text style={styles.resumoAp}>
                  🏠 {reais(pessoa.ap.aluguel)} • {pessoa.ap.bairro}
                </Text>
              )}
              <TouchableOpacity onPress={() => setAberta(pessoa)}>
                <Text style={styles.verMais}>Ver perfil completo ›</Text>
              </TouchableOpacity>
            </View>
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
              onPress={() => setIndice(0)}
            >
              <Text style={styles.btnRecomecarText}>Ver novamente</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      <PersonModal
        person={aberta}
        eu={currentUser}
        botao={{ label: "💜 Interessado?", onPress: interessar }}
        onClose={() => setAberta(null)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  card: {
    backgroundColor: "#fff",
    borderRadius: 24,
    overflow: "hidden",
    paddingBottom: 16,
  },

  foto: { width: "100%", height: FOTO_H },
  online: {
    position: "absolute",
    top: 14,
    right: 14,
    backgroundColor: "rgba(255,255,255,0.9)",
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  onlineText: { color: "#2A9D8F", fontWeight: "600", fontSize: 12 },
  compat: {
    position: "absolute",
    top: 14,
    left: 14,
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  compatText: { color: "#fff", fontWeight: "700", fontSize: 12 },

  // barra do nome (a margem lateral maior deixa o texto longe das setas)
  infoFoto: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 34,
    paddingTop: 6,
    paddingBottom: 12,
    backgroundColor: "rgba(59,30,90,0.42)",
  },
  nome: { color: "#fff", fontSize: 22, fontWeight: "bold" },
  sub: { color: "#fff", fontSize: 12, marginTop: 1 },

  // setas: compridas, estreitas, na cor principal e coladas nas bordas do cartão
  seta: {
    position: "absolute",
    top: FOTO_H - (SETA_ALTURA - FAIXA_CONTADOR),
    width: SETA_LARGURA,
    height: SETA_ALTURA,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
    elevation: 2,
  },
  setaEsq: {
    left: 0,
    borderTopRightRadius: 16,
    borderBottomRightRadius: 16,
  },
  setaDir: {
    right: 0,
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
  },
  setaText: { fontSize: 34, color: "#fff", fontWeight: "bold", marginTop: -4 },

  contador: {
    textAlign: "center",
    color: colors.muted,
    fontSize: 12,
    paddingTop: 10,
    height: FAIXA_CONTADOR,
  },

  tags: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 14,
    paddingTop: 4,
  },
  tag: {
    backgroundColor: "#EBDDF7",
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginRight: 8,
    marginBottom: 8,
  },
  tagText: { color: colors.primary, fontWeight: "600", fontSize: 13 },

  resumo: {
    backgroundColor: colors.bg,
    borderRadius: 16,
    padding: 14,
    marginHorizontal: 14,
    marginTop: 4,
  },
  resumoSobre: {
    color: colors.text,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  resumoLinha: { color: colors.text, fontSize: 13, marginBottom: 4 },
  resumoAp: {
    color: colors.pink,
    fontWeight: "700",
    fontSize: 13,
    marginBottom: 4,
  },
  verMais: {
    color: colors.primary,
    fontWeight: "700",
    fontSize: 13,
    marginTop: 6,
  },

  fim: { flex: 1, alignItems: "center", justifyContent: "center", padding: 30 },
  fimEmoji: { fontSize: 50 },
  fimTitulo: {
    fontSize: 20,
    fontWeight: "bold",
    color: colors.primary,
    marginTop: 10,
  },
  fimSub: {
    color: colors.text,
    marginTop: 6,
    marginBottom: 20,
    textAlign: "center",
  },
  btnRecomecar: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 30,
    borderRadius: 30,
    marginTop: 10,
  },
  btnRecomecarText: { color: "#fff", fontWeight: "600", fontSize: 16 },
});
