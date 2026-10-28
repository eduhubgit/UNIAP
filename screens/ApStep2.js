import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Switch,
  SafeAreaView,
} from "react-native";
import { colors } from "../theme";
import { useApp } from "../context/AppContext";
import { mostrarAlerta } from "../utils/alerta";
import { reais } from "../utils/format";
import { faixaPorValor } from "../utils/perfil";
import CampoTexto from "../components/CampoTexto";

const DESPESAS = [
  { id: "agua", label: "💧  Água" },
  { id: "luz", label: "⚡  Luz" },
  { id: "internet", label: "📶  Internet" },
  { id: "condominio", label: "🏢  Condomínio" },
  { id: "gas", label: "🔥  Gás" },
];

export default function ApStep2({ navigation, route }) {
  const modo = route.params?.modo;
  const { draft, finishRegister, converterParaAp } = useApp();

  const [digits, setDigits] = useState("");
  const [vagasTexto, setVagasTexto] = useState("");
  const [despesas, setDespesas] = useState({
    agua: true,
    luz: true,
    internet: true,
    condominio: false,
    gas: false,
  });
  const [outras, setOutras] = useState("");
  const [adendos, setAdendos] = useState("");

  const alternar = (id) =>
    setDespesas((prev) => ({ ...prev, [id]: !prev[id] }));

  const valor = parseInt(digits || "0", 10) / 100;
  const vagas = parseInt(vagasTexto || "0", 10);

  const finalizar = () => {
    if (valor <= 0) {
      mostrarAlerta("Atenção", "Informe o preço do aluguel.");
      return;
    }
    if (vagas < 1 || vagas > 10) {
      mostrarAlerta(
        "Atenção",
        "Informe quantas vagas você oferece, sem contar com você (de 1 a 10).",
      );
      return;
    }

    const ap = {
      ...(draft.apStep1 || {}),
      aluguel: valor,
      vagasTotal: vagas, // vagas oferecidas, SEM contar com o dono
      vagas, // vagas ainda livres (muda no chat, em "Vaga ocupada?")
      despesas,
      outras: outras.trim(),
      adendos: adendos.trim(),
    };

    if (modo === "converter") {
      converterParaAp(ap);
      mostrarAlerta(
        "Perfil atualizado!",
        "Agora você é um perfil com apartamento e passa a ver pessoas que procuram colegas de quarto.",
      );
      navigation.reset({
        index: 0,
        routes: [
          { name: "Main", params: { screen: "Perfil", params: { aba: "ap" } } },
        ],
      });
    } else {
      // pessoas na casa = você + vagas; a divisão define a faixa usada na compatibilidade
      finishRegister({ ap, faixa: faixaPorValor(valor / (vagas + 1)) });
      mostrarAlerta(
        "Cadastro concluído!",
        "Seu apartamento foi cadastrado e passará por verificação.",
      );
      navigation.reset({ index: 0, routes: [{ name: "Main" }] });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={{ padding: 24 }}
        keyboardShouldPersistTaps="handled"
      >
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>← Voltar</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Detalhes do apartamento</Text>
        <Text style={styles.subtitle}>
          Conte um pouco mais sobre o seu imóvel para que os interessados saibam
          se é o lugar ideal para eles.
        </Text>

        {/* PREÇO E VAGAS */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Aluguel e vagas</Text>
          <CampoTexto
            style={{ marginTop: 12 }}
            label="Preço do aluguel"
            dica="Qual o valor mensal do aluguel?"
            placeholder="R$ 0,00"
            keyboardType="numeric"
            value={digits ? reais(valor) : ""}
            onChangeText={(t) => setDigits(t.replace(/\D/g, "").slice(0, 8))}
          />
          <CampoTexto
            label="Quantas vagas você oferece? (sem contar com você)"
            dica="Conte só as vagas para novos moradores. Ex.: aluguel de R$ 800 com 3 vagas = 4 pessoas na casa (você + 3), ou seja, R$ 200 para cada."
            placeholder="Ex.: 3"
            keyboardType="numeric"
            value={vagasTexto}
            onChangeText={(t) =>
              setVagasTexto(t.replace(/\D/g, "").slice(0, 2))
            }
          />
          {valor > 0 && vagas > 0 && (
            <Text style={styles.estimativa}>
              💡 {vagas + 1} pessoas na casa (você + {vagas}{" "}
              {vagas === 1 ? "vaga" : "vagas"}): com a casa cheia, cada um
              pagaria cerca de {reais(valor / (vagas + 1))} (só o aluguel, sem
              as despesas).
            </Text>
          )}
        </View>

        {/* DESPESAS */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Despesas da casa</Text>
          <Text style={styles.cardSub}>
            Quais despesas estão incluídas no aluguel? (Ligado = incluída,
            desligado = responsabilidade dos moradores)
          </Text>
          {DESPESAS.map((d) => (
            <View key={d.id} style={styles.switchRow}>
              <Text style={styles.switchLabel}>{d.label}</Text>
              <Switch
                value={despesas[d.id]}
                onValueChange={() => alternar(d.id)}
                trackColor={{ true: colors.primary, false: colors.border }}
                thumbColor="#fff"
              />
            </View>
          ))}
          <CampoTexto
            style={{ marginTop: 14 }}
            label="Outras (especifique)"
            placeholder="Ex.: IPTU, limpeza, etc."
            value={outras}
            onChangeText={setOutras}
          />
        </View>

        {/* ADENDOS */}
        <View style={styles.card}>
          <CampoTexto
            label="Adendos do apartamento"
            dica="Fale mais sobre o imóvel. Algum diferencial ou informação importante?"
            placeholder="Ex.: Tem móveis, é permitido animais, possui área de lazer, etc."
            multiline
            maxLength={500}
            value={adendos}
            onChangeText={setAdendos}
            contador={`${adendos.length}/500`}
          />
        </View>

        <View style={styles.dica}>
          <Text style={styles.dicaTitle}>
            🛡️ Mais informações = mais confiança!
          </Text>
          <Text style={styles.dicaText}>
            Quanto mais detalhes você compartilhar, mais chances de encontrar
            bons inquilinos.
          </Text>
        </View>

        <TouchableOpacity style={styles.btn} onPress={finalizar}>
          <Text style={styles.btnText}>✓ Finalizar cadastro</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  back: { color: colors.primary, fontSize: 16, marginBottom: 8 },
  title: { fontSize: 30, fontWeight: "bold", color: colors.primary },
  subtitle: { color: colors.text, marginTop: 6, marginBottom: 12 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
  },
  cardTitle: { fontSize: 17, fontWeight: "bold", color: colors.primary },
  cardSub: { color: colors.text, marginTop: 4 },
  estimativa: { color: colors.muted, fontSize: 12, lineHeight: 18 },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.bg,
  },
  switchLabel: { color: colors.text, fontSize: 15 },
  dica: {
    backgroundColor: "#EBDDF7",
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
  },
  dicaTitle: { fontWeight: "700", color: colors.primary },
  dicaText: { color: colors.text, marginTop: 4, fontSize: 13 },
  btn: {
    backgroundColor: colors.primary,
    padding: 16,
    borderRadius: 30,
    alignItems: "center",
  },
  btnText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});
