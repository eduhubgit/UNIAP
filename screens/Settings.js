import React from 'react';
import {
  View,
  Text,
  Switch,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { colors } from '../theme';
import { useApp } from '../context/AppContext';
import { confirmar } from '../utils/alerta';

export default function Settings({ navigation }) {
  const {
    currentUser,
    settings,
    updateSettings,
    logout,
    deleteAccount,
    limparTudo,
  } = useApp();

  const irParaInicio = () =>
    navigation.reset({ index: 0, routes: [{ name: 'Welcome' }] });

  const sair = () => {
    irParaInicio();
    logout();
  };

  const excluir = () =>
    confirmar(
      'Excluir conta',
      'Tem certeza? Seus dados e seu perfil serão apagados e essa ação não pode ser desfeita.',
      () => {
        irParaInicio();
        deleteAccount();
      },
      'Excluir'
    );

  const apagarTudo = () =>
    confirmar(
      'Apagar todos os dados',
      'Isso apaga TODAS as contas, interesses e conversas salvos neste aparelho. Use apenas para testes.',
      () => {
        irParaInicio();
        limparTudo();
      },
      'Apagar tudo'
    );

  const linhaSwitch = (label, descricao, chave) => (
    <View style={styles.linha}>
      <View style={{ flex: 1, paddingRight: 10 }}>
        <Text style={styles.linhaTitulo}>{label}</Text>
        <Text style={styles.linhaDesc}>{descricao}</Text>
      </View>
      <Switch
        value={settings[chave]}
        onValueChange={(v) => updateSettings({ [chave]: v })}
        trackColor={{ true: colors.primary, false: colors.border }}
        thumbColor="#fff"
      />
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>← Voltar</Text>
        </TouchableOpacity>
        <Text style={styles.titulo}>Configurações</Text>
        <Text style={styles.sub}>Conta: {currentUser?.email}</Text>

        <View style={styles.card}>
          <Text style={styles.secao}>Preferências do app</Text>
          {linhaSwitch(
            'Notificações',
            'Receber avisos de novos matches e mensagens.',
            'notificacoes'
          )}
          {linhaSwitch(
            'Perfil visível',
            'Permitir que outros universitários vejam seu perfil.',
            'perfilVisivel'
          )}
          <Text style={styles.nota}>
            Estas opções ficam salvas no aparelho e passarão a ter efeito
            completo quando conectarmos um servidor.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.secao}>Conta</Text>
          <TouchableOpacity style={styles.botao} onPress={sair}>
            <Text style={styles.botaoText}>🚪 Sair da conta</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.botao, styles.botaoPerigo]}
            onPress={excluir}>
            <Text style={[styles.botaoText, { color: colors.error }]}>
              🗑️ Excluir minha conta
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <Text style={styles.secao}>Área de testes</Text>
          <TouchableOpacity
            style={[styles.botao, styles.botaoPerigo]}
            onPress={apagarTudo}>
            <Text style={[styles.botaoText, { color: colors.error }]}>
              🧪 Apagar todos os dados do app
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.versao}>UNI AP • versão 1.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  back: { color: colors.primary, fontSize: 16, marginBottom: 8 },
  titulo: { fontSize: 28, fontWeight: 'bold', color: colors.primary },
  sub: { color: colors.muted, marginTop: 2, marginBottom: 14 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
  },
  secao: {
    fontSize: 17,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 6,
  },
  linha: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
  linhaTitulo: { color: colors.text, fontWeight: '700', fontSize: 15 },
  linhaDesc: { color: colors.muted, fontSize: 12, marginTop: 2 },
  nota: { color: colors.muted, fontSize: 12, marginTop: 6 },
  botao: {
    backgroundColor: colors.bg,
    borderRadius: 14,
    padding: 14,
    marginTop: 10,
    alignItems: 'center',
  },
  botaoText: { color: colors.primary, fontWeight: '700', fontSize: 15 },
  botaoPerigo: { backgroundColor: '#FDEBEF' },
  versao: { textAlign: 'center', color: colors.muted, marginTop: 8 },
});
