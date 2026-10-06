import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { colors } from '../theme';
import { useApp } from '../context/AppContext';
import { mostrarAlerta } from '../utils/alerta';

const FAQ = [
  {
    p: 'Como funciona a compatibilidade?',
    r: 'Comparamos suas preferências de convivência, seus horários e sua faixa de preço com os de outras pessoas. Quanto mais itens em comum, maior a porcentagem.',
  },
  {
    p: 'Por que só vejo pessoas com (ou sem) apartamento?',
    r: 'Quem tem apartamento vê quem procura um lugar, e quem procura vê quem tem apartamento. Assim os perfis mostrados sempre se complementam.',
  },
  {
    p: 'O que acontece ao tocar em "Conversar"?',
    r: 'Pedimos uma confirmação e, ao confirmar, o match é efetivado e vocês podem conversar sobre morar juntos.',
  },
  {
    p: 'Como altero meus dados e preferências?',
    r: 'Na aba Perfil, toque em Editar. Ao salvar, suas sugestões de match são recalculadas.',
  },
  {
    p: 'Meus dados ficam visíveis para todos?',
    r: 'Nome, foto e preferências aparecem para outros usuários. CPF, telefone e senha não são exibidos. Veja a Política de Privacidade no menu.',
  },
];

const ASSUNTOS = ['Dúvida', 'Problema técnico', 'Denúncia', 'Sugestão'];

export default function Support({ navigation }) {
  const { currentUser } = useApp();
  const [aberta, setAberta] = useState(null);
  const [assunto, setAssunto] = useState(null);
  const [mensagem, setMensagem] = useState('');

  const enviar = () => {
    if (!assunto) {
      mostrarAlerta('Atenção', 'Escolha um assunto.');
      return;
    }
    if (mensagem.trim().length < 10) {
      mostrarAlerta(
        'Atenção',
        'Escreva uma mensagem com pelo menos 10 caracteres.'
      );
      return;
    }
    mostrarAlerta(
      'Mensagem enviada!',
      `Responderemos em até 2 dias úteis no e-mail ${currentUser?.email}.`
    );
    setAssunto(null);
    setMensagem('');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={{ padding: 20 }}
        keyboardShouldPersistTaps="handled">
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>← Voltar</Text>
        </TouchableOpacity>
        <Text style={styles.titulo}>Suporte</Text>
        <Text style={styles.sub}>Estamos aqui para ajudar.</Text>

        <View style={styles.card}>
          <Text style={styles.secao}>Perguntas frequentes</Text>
          {FAQ.map((item, i) => (
            <TouchableOpacity
              key={item.p}
              style={styles.faq}
              onPress={() => setAberta(aberta === i ? null : i)}>
              <View style={styles.faqTopo}>
                <Text style={styles.faqP}>{item.p}</Text>
                <Text style={styles.chevron}>{aberta === i ? '−' : '+'}</Text>
              </View>
              {aberta === i && <Text style={styles.faqR}>{item.r}</Text>}
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.card}>
          <Text style={styles.secao}>Fale com a gente</Text>
          <View style={styles.chips}>
            {ASSUNTOS.map((a) => (
              <TouchableOpacity
                key={a}
                style={[styles.chip, assunto === a && styles.chipAtivo]}
                onPress={() => setAssunto(a)}>
                <Text
                  style={[styles.chipText, assunto === a && { color: '#fff' }]}>
                  {a}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <TextInput
            style={styles.input}
            placeholder="Descreva sua dúvida ou problema..."
            placeholderTextColor={colors.muted}
            multiline
            maxLength={500}
            value={mensagem}
            onChangeText={setMensagem}
          />
          <Text style={styles.contador}>{mensagem.length}/500</Text>
          <TouchableOpacity style={styles.btn} onPress={enviar}>
            <Text style={styles.btnText}>Enviar mensagem</Text>
          </TouchableOpacity>
          <Text style={styles.contato}>
            📧 suporte@uniap.app (e-mail de exemplo)
          </Text>
        </View>
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
  faq: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.bg,
  },
  faqTopo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  faqP: { flex: 1, color: colors.text, fontWeight: '700' },
  chevron: { color: colors.primary, fontSize: 22, marginLeft: 8 },
  faqR: { color: colors.text, marginTop: 8, lineHeight: 20 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 8 },
  chip: {
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 18,
    paddingVertical: 6,
    paddingHorizontal: 14,
    marginRight: 8,
    marginBottom: 8,
  },
  chipAtivo: { backgroundColor: colors.primary },
  chipText: { color: colors.primary, fontWeight: '600' },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 12,
    minHeight: 100,
    textAlignVertical: 'top',
    backgroundColor: colors.bg,
    color: colors.text,
  },
  contador: {
    alignSelf: 'flex-end',
    color: colors.muted,
    fontSize: 12,
    marginTop: 4,
  },
  btn: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 30,
    alignItems: 'center',
    marginTop: 8,
  },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  contato: {
    textAlign: 'center',
    color: colors.muted,
    marginTop: 12,
    fontSize: 12,
  },
});
