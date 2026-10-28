import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  SafeAreaView,
} from "react-native";
import * as DocumentPicker from "expo-document-picker";
import { colors } from "../theme";
import { useApp } from "../context/AppContext";
import { mostrarAlerta } from "../utils/alerta";
import { escolherFotosAnuncio } from "../utils/fotosAnuncio";
import CampoTexto from "../components/CampoTexto";

const MAX_FOTOS = 5;

export default function ApStep1({ navigation, route }) {
  const modo = route.params?.modo; // 'converter' = quem já tem conta e só cadastra o apartamento
  const { draft, updateDraft, currentUser } = useApp();

  const [fotos, setFotos] = useState([]);
  const [docNome, setDocNome] = useState(null);
  const [endereco, setEndereco] = useState("");
  const [bairro, setBairro] = useState("");
  const [cidade, setCidade] = useState(
    (modo === "converter" ? currentUser?.cidade : draft.cidade) || "",
  );
  const [referencia, setReferencia] = useState("");

  const adicionarFotos = async () => {
    const restante = MAX_FOTOS - fotos.length;
    if (restante <= 0) {
      mostrarAlerta("Limite", `Você pode adicionar até ${MAX_FOTOS} fotos.`);
      return;
    }
    const novas = await escolherFotosAnuncio(restante);
    if (novas.length)
      setFotos((prev) => [...prev, ...novas].slice(0, MAX_FOTOS));
  };

  const removerFoto = (indice) =>
    setFotos((prev) => prev.filter((_, i) => i !== indice));

  const escolherDocumento = async () => {
    const res = await DocumentPicker.getDocumentAsync({
      type: ["application/pdf", "image/*"],
      copyToCacheDirectory: true,
    });
    if (!res.canceled) setDocNome(res.assets[0].name);
  };

  const continuar = () => {
    if (fotos.length === 0) {
      mostrarAlerta("Atenção", "Adicione pelo menos uma foto do apartamento.");
      return;
    }
    if (!docNome) {
      mostrarAlerta(
        "Atenção",
        "Envie um documento que comprove que você é o responsável pelo imóvel.",
      );
      return;
    }
    if (!endereco.trim() || !bairro.trim() || !cidade.trim()) {
      mostrarAlerta("Atenção", "Preencha endereço, bairro e cidade.");
      return;
    }
    updateDraft({
      apStep1: {
        fotos,
        docNome,
        endereco: endereco.trim(),
        bairro: bairro.trim(),
        cidade: cidade.trim(),
        referencia: referencia.trim(),
      },
    });
    navigation.navigate("ApStep2", { modo });
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
        <Text style={styles.title}>Tem um apartamento?</Text>
        <Text style={styles.subtitle}>
          {modo === "converter"
            ? "Cadastre só os dados do seu apartamento para mudar o seu perfil. Você não precisa refazer o seu cadastro."
            : "Cadastre seu imóvel e conecte-se a universitários que estão procurando um lugar para morar!"}
        </Text>

        {/* FOTOS */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Fotos do apartamento</Text>
          <Text style={styles.cardSub}>
            Adicione algumas fotos para mostrar o espaço e os ambientes.
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ marginTop: 10 }}
          >
            <TouchableOpacity style={styles.addFoto} onPress={adicionarFotos}>
              <Text style={{ fontSize: 26 }}>📷</Text>
              <Text style={styles.addFotoText}>Adicionar fotos</Text>
              <Text style={styles.addFotoSub}>
                {fotos.length}/{MAX_FOTOS}
              </Text>
            </TouchableOpacity>
            {fotos.map((uri, i) => (
              <View key={i} style={styles.thumbBox}>
                <Image source={{ uri }} style={styles.thumb} />
                <TouchableOpacity
                  style={styles.remover}
                  onPress={() => removerFoto(i)}
                >
                  <Text style={styles.removerText}>✕</Text>
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        </View>

        {/* DOCUMENTO */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Comprovação do imóvel</Text>
          <Text style={styles.cardSub}>
            Envie um documento que comprove que você é o responsável pelo
            apartamento.
          </Text>
          <TouchableOpacity style={styles.docBox} onPress={escolherDocumento}>
            <Text style={{ fontSize: 24, marginRight: 10 }}>📄</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.docTitle}>
                {docNome || "Adicionar documento"}
              </Text>
              <Text style={styles.docSub}>
                {docNome
                  ? "Toque para trocar o arquivo"
                  : "Ex.: escritura, contrato de aluguel ou comprovante em seu nome."}
              </Text>
            </View>
          </TouchableOpacity>
          <Text style={styles.info}>
            ℹ️ Os documentos passam por uma verificação para garantir a
            segurança de todos.
          </Text>
        </View>

        {/* LOCALIZAÇÃO */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Localização exata do apartamento</Text>
          <Text style={[styles.cardSub, { marginBottom: 12 }]}>
            Informe o endereço completo para que os interessados possam ver a
            região.
          </Text>
          <CampoTexto
            label="Endereço completo"
            placeholder="Ex.: Rua das Flores, 123"
            value={endereco}
            onChangeText={setEndereco}
          />
          <CampoTexto label="Bairro" value={bairro} onChangeText={setBairro} />
          <CampoTexto label="Cidade" value={cidade} onChangeText={setCidade} />
          <CampoTexto
            label="Ponto de referência (opcional)"
            placeholder="Ex.: Perto da praça"
            value={referencia}
            onChangeText={setReferencia}
          />
        </View>

        <TouchableOpacity style={styles.btn} onPress={continuar}>
          <Text style={styles.btnText}>Continuar →</Text>
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
  addFoto: {
    width: 120,
    height: 100,
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: colors.primary,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
    backgroundColor: colors.bg,
  },
  addFotoText: {
    color: colors.primary,
    fontWeight: "600",
    fontSize: 12,
    marginTop: 2,
  },
  addFotoSub: { color: colors.muted, fontSize: 11 },
  thumbBox: { marginRight: 10 },
  thumb: { width: 100, height: 100, borderRadius: 12 },
  remover: {
    position: "absolute",
    top: 4,
    right: 4,
    backgroundColor: "rgba(0,0,0,0.6)",
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  removerText: { color: "#fff", fontSize: 12 },
  docBox: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: colors.primary,
    borderRadius: 12,
    padding: 14,
    marginTop: 10,
    backgroundColor: colors.bg,
  },
  docTitle: { fontWeight: "700", color: colors.text },
  docSub: { color: colors.muted, fontSize: 12, marginTop: 2 },
  info: { color: colors.muted, fontSize: 12, marginTop: 8 },
  btn: {
    backgroundColor: colors.primary,
    padding: 16,
    borderRadius: 30,
    alignItems: "center",
    marginTop: 8,
  },
  btnText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});
