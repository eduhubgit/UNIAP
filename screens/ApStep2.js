import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Switch,
  SafeAreaView,
} from 'react-native';
import { colors } from '../theme';
import { useApp } from '../context/AppContext';
import { mostrarAlerta } from '../utils/alerta';

const DESPESAS = [
  { id: 'agua', label: '💧  Água' },
  { id: 'luz', label: '⚡  Luz' },
  { id: 'internet', label: '📶  Internet' },
  { id: 'condominio', label: '🏢  Condomínio' },
  { id: 'gas', label: '🔥  Gás' },
];

// "120000" -> "1.200,00"
const formatarReais = (digits) => {
  if (!digits) return '';
  const [inteiro, dec] = (parseInt(digits, 10) / 100).toFixed(2).split('.');
  return `${inteiro.replace(/\B(?=(\d{3})+(?!\d))/g, '.')},${dec}`;
};

export default function ApStep2({ navigation }) {
  const { draft, finishRegister } = useApp();
  const [digits, setDigits] = useState('');
  const [despesas, setDespesas] = useState({
    agua: true,
    luz: true,
    internet: true,
    condominio: false,
    gas: false,
  });
  const [outras, setOutras] = useState('');
  const [adendos, setAdendos] = useState('');

  const alternar = (id) =>
    setDespesas((prev) => ({ ...prev, [id]: !prev[id] }));

  const finalizar = () => {
    const valor = parseInt(digits || '0', 10) / 100;
    if (valor <= 0) {
      mostrarAlerta('Atenção', 'Informe o preço do aluguel.');
      return;
    }
    const ap = {
      ...draft.apStep1, // fotos, doc, endereco, bairro, cidade, referencia
      aluguel: valor,
      despesas,
      outras: outras.trim(),
      adendos: adendos.trim(),
    };
    finishRegister({ ap });
    mostrarAlerta(
      'Cadastro concluído!',
      'Seu apartamento foi cadastrado e passará por verificação.'
    );
    navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={{ padding: 24 }}
        keyboardShouldPersistTaps="handled">
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>← Voltar</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Detalhes do apartamento</Text>
        <Text style={styles.subtitle}>
          Conte um pouco mais sobre o seu imóvel para que os interessados saibam
          se é o lugar ideal para eles.
        </Text>

        {/* PREÇO */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Preço do aluguel</Text>
          <Text style={styles.cardSub}>Qual o valor mensal do aluguel?</Text>
          <TextInput
            style={styles.input}
            placeholder="R$ 0,00"
            placeholderTextColor={colors.muted}
            keyboardType="numeric"
            value={digits ? `R$ ${formatarReais(digits)}` : ''}
            onChangeText={(t) => setDigits(t.replace(/\D/g, '').slice(0, 8))}
          />
          <Text style={styles.hint}>Ex.: 1.200,00</Text>
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
          <Text style={[styles.switchLabel, { marginTop: 12 }]}>
            Outras (especifique)
          </Text>
          <TextInput
            style={styles.input}
            placeholder="Ex.: IPTU, limpeza, etc."
            placeholderTextColor={colors.muted}
            value={outras}
            onChangeText={setOutras}
          />
        </View>

        {/* ADENDOS */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Adendos do apartamento</Text>
          <Text style={styles.cardSub}>
            Fale mais sobre o imóvel. Algum diferencial ou informação
            importante?
          </Text>
          <TextInput
            style={[styles.input, { minHeight: 100, textAlignVertical: 'top' }]}
            placeholder="Ex.: Tem móveis, é permitido animais, possui área de lazer, etc."
            placeholderTextColor={colors.muted}
            multiline
            maxLength={500}
            value={adendos}
            onChangeText={setAdendos}
          />
          <Text style={styles.counter}>{adendos.length}/500</Text>
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
  title: { fontSize: 30, fontWeight: 'bold', color: colors.primary },
  subtitle: { color: colors.text, marginTop: 6, marginBottom: 12 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
  },
  cardTitle: { fontSize: 17, fontWeight: 'bold', color: colors.primary },
  cardSub: { color: colors.text, marginTop: 4 },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 14,
    marginTop: 10,
    backgroundColor: colors.bg,
    color: colors.text,
  },
  hint: { color: colors.muted, fontSize: 12, marginTop: 4 },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.bg,
  },
  switchLabel: { color: colors.text, fontSize: 15 },
  counter: {
    alignSelf: 'flex-end',
    color: colors.muted,
    fontSize: 12,
    marginTop: 4,
  },
  dica: {
    backgroundColor: '#EBDDF7',
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
  },
  dicaTitle: { fontWeight: '700', color: colors.primary },
  dicaText: { color: colors.text, marginTop: 4, fontSize: 13 },
  btn: {
    backgroundColor: colors.primary,
    padding: 16,
    borderRadius: 30,
    alignItems: 'center',
  },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
