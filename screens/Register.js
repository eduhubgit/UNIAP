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
import { colors } from "../theme";
import { useApp } from "../context/AppContext";
import { mostrarAlerta } from "../utils/alerta";
import { escolherFotoPerfil } from "../utils/foto";
import { maskPhone, maskCpf, onlyDigits } from "../utils/masks";
import CampoTexto from "../components/CampoTexto";
import AskApModal from "../components/AskApModal";
import TermsModal from "../components/TermsModal";

export default function Register({ navigation }) {
  const { updateDraft, emailExists, oauthPendente, logout } = useApp();
  const viaGitHub = !!oauthPendente;
  const [foto, setFoto] = useState(null);
  const [form, setForm] = useState({
    nome: oauthPendente?.nome || "",
    idade: "",
    matricula: "",
    telefone: "",
    email: oauthPendente?.email || "",
    cpf: "",
    cidade: "",
    senha: "",
  });
  const [apVisible, setApVisible] = useState(false);
  const [termsVisible, setTermsVisible] = useState(false);

  const setField = (campo, valor) =>
    setForm((prev) => ({ ...prev, [campo]: valor }));

  const escolherFoto = async () => {
    const uri = await escolherFotoPerfil();
    if (uri) setFoto(uri);
  };

  const validar = async () => {
    const { nome, idade, matricula, telefone, email, cpf, cidade, senha } = form;
    if (
      !nome.trim() ||
      !matricula.trim() ||
      !telefone ||
      !email ||
      !cpf ||
      !cidade.trim() ||
      (!viaGitHub && !senha)
    ) {
      return "Preencha todos os campos.";
    }
    if (!idade) return "Informe sua idade.";
    const anos = Number(idade);
    if (!Number.isFinite(anos) || anos < 16 || anos > 100) {
      return "Idade inválida (entre 16 e 100 anos).";
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) return "E-mail inválido.";
    if (onlyDigits(cpf).length !== 11) return "CPF deve ter 11 dígitos.";
    if (onlyDigits(telefone).length < 10) return "Telefone inválido.";
    if (!viaGitHub && senha.length < 6) {
      return "A senha deve ter pelo menos 6 caracteres.";
    }
    // Conta do GitHub já tem e-mail próprio: não precisa checar duplicidade.
    if (!viaGitHub && (await emailExists(email))) {
      return "Já existe uma conta com esse e-mail.";
    }
    return null;
  };

  // 1) valida e abre o pop-up "tem AP?"
  const handleCadastrar = async () => {
    const erro = await validar();
    if (erro) {
      mostrarAlerta("Atenção", erro);
      return;
    }
    updateDraft({ ...form, foto });
    setApVisible(true);
  };

  // 2) guarda a resposta e abre os Termos
  const escolheuAp = (temAp) => {
    updateDraft({ temAp });
    setApVisible(false);
    setTimeout(() => setTermsVisible(true), 400);
  };

  // 3) aceitou os termos: segue para o Cadastro 2
  const aceitouTermos = () => {
    updateDraft({ aceitouTermos: true });
    setTermsVisible(false);
    navigation.navigate("Register2");
  };

  // Quem entrou pelo GitHub pode desistir: encerra a sessão e volta.
  const voltar = async () => {
    if (viaGitHub) {
      await logout();
      navigation.navigate("Welcome");
      return;
    }
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={{ padding: 24 }}
        keyboardShouldPersistTaps="handled"
      >
        <TouchableOpacity onPress={voltar}>
          <Text style={styles.back}>← Voltar</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Crie sua conta</Text>
        <Text style={styles.subtitle}>
          {viaGitHub
            ? "Sua conta do GitHub está conectada. Complete seus dados para usar o UNI AP."
            : "Vamos começar? Preencha seus dados para se conectar com outros universitários."}
        </Text>

        <TouchableOpacity style={styles.fotoBox} onPress={escolherFoto}>
          {foto ? (
            <Image source={{ uri: foto }} style={styles.fotoImg} />
          ) : (
            <Text style={styles.fotoText}>📷{"\n"}Foto</Text>
          )}
        </TouchableOpacity>

        <CampoTexto
          label="Nome completo"
          placeholder="Ex.: Maria da Silva"
          value={form.nome}
          onChangeText={(t) => setField("nome", t)}
        />
        <CampoTexto
          label="Idade"
          placeholder="Ex.: 20"
          keyboardType="numeric"
          maxLength={3}
          value={form.idade}
          onChangeText={(t) => setField("idade", onlyDigits(t))}
        />
        <CampoTexto
          label="Matrícula"
          keyboardType="numeric"
          value={form.matricula}
          onChangeText={(t) => setField("matricula", t)}
        />
        <CampoTexto
          label="Telefone"
          placeholder="(88) 99999-9999"
          keyboardType="phone-pad"
          value={form.telefone}
          onChangeText={(t) => setField("telefone", maskPhone(t))}
        />
        <CampoTexto
          label="E-mail"
          placeholder="seuemail@exemplo.com"
          autoCapitalize="none"
          keyboardType="email-address"
          value={form.email}
          editable={!viaGitHub}
          onChangeText={(t) => setField("email", t)}
        />
        <CampoTexto
          label="CPF"
          placeholder="000.000.000-00"
          keyboardType="numeric"
          value={form.cpf}
          onChangeText={(t) => setField("cpf", maskCpf(t))}
        />
        <CampoTexto
          label="Cidade"
          placeholder="Ex.: Quixadá - CE"
          value={form.cidade}
          onChangeText={(t) => setField("cidade", t)}
        />
        {!viaGitHub && (
          <CampoTexto
            label="Senha"
            dica="Mínimo de 6 caracteres."
            senha
            value={form.senha}
            onChangeText={(t) => setField("senha", t)}
          />
        )}

        <TouchableOpacity style={styles.btn} onPress={handleCadastrar}>
          <Text style={styles.btnText}>Cadastrar</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={voltar}>
          <Text style={styles.jaTem}>
            {viaGitHub ? "Cancelar cadastro" : "Já tem uma conta? "}
            {!viaGitHub && (
              <Text style={{ color: colors.primary, fontWeight: "600" }}>
                Entrar
              </Text>
            )}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      <AskApModal
        visible={apVisible}
        onChoose={escolheuAp}
        onClose={() => setApVisible(false)}
      />
      <TermsModal
        visible={termsVisible}
        onAccept={aceitouTermos}
        onClose={() => setTermsVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  back: { color: colors.primary, fontSize: 16, marginBottom: 8 },
  title: { fontSize: 30, fontWeight: "bold", color: colors.primary },
  subtitle: { color: colors.text, marginTop: 6, marginBottom: 16 },
  fotoBox: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: "#E6D6F3",
    alignSelf: "center",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    overflow: "hidden",
  },
  fotoImg: { width: "100%", height: "100%" },
  fotoText: { textAlign: "center", color: colors.primary },
  btn: {
    backgroundColor: colors.primary,
    padding: 16,
    borderRadius: 30,
    alignItems: "center",
    marginTop: 6,
  },
  btnText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  jaTem: { textAlign: "center", marginTop: 16, color: colors.muted },
});
