import React, { useState } from 'react';
import { Text, TouchableOpacity, StyleSheet, ScrollView, SafeAreaView } from 'react-native';
import { colors } from '../theme';
import { useApp } from '../context/AppContext';
import { mostrarAlerta } from '../utils/alerta';
import SelectField from '../components/SelectField';
import CampoTexto from '../components/CampoTexto';
import { HORARIOS, PREFERENCIAS, FAIXAS_PRECO } from '../data/options';

export default function Register2({ navigation }) {
  const { draft, updateDraft, finishRegister } = useApp();
  const [temAp] = useState(draft.temAp === true);

  const [sobre, setSobre] = useState('');
  const [horarios, setHorarios] = useState([]);
  const [preferencias, setPreferencias] = useState([]);
  const [observacoes, setObservacoes] = useState('');
  const [faixa, setFaixa] = useState(null);

  const concluir = () => {
    if (sobre.trim().length < 10) {
      mostrarAlerta('Atenção', 'Conte um pouco mais sobre você (mínimo 10 caracteres).');
      return;
    }
    if (horarios.length === 0) {
      mostrarAlerta('Atenção', 'Selecione pelo menos um horário da sua rotina.');
      return;
    }
    if (preferencias.length === 0) {
      mostrarAlerta('Atenção', 'Selecione pelo menos uma preferência.');
      return;
    }
    if (!temAp && !faixa) {
      mostrarAlerta('Atenção', 'Selecione a faixa de preço.');
      return;
    }

    const perfil = {
      sobre: sobre.trim(),
      horarios,
      preferencias,
      observacoes: observacoes.trim(),
    };

    if (temAp) {
      // quem tem AP segue para as telas do apartamento (o preço é definido lá)
      updateDraft(perfil);
      navigation.navigate('ApStep1');
    } else {
      // quem não tem AP informa quanto pode pagar e finaliza aqui
      finishRegister({ ...perfil, faixa, ap: null });
      mostrarAlerta('Cadastro concluído!', 'Sua conta foi criada. Bem-vindo(a) ao UNI AP!');
      navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={{ padding: 24 }} keyboardShouldPersistTaps="handled">
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>← Voltar</Text>
        </TouchableOpacity>

        <Text style={styles.title}>
          {temAp ? 'Conte sobre você' : 'Você ainda não tem um apartamento?'}
        </Text>
        <Text style={styles.subtitle}>
          Conte um pouco sobre você e suas preferências para encontrarmos os melhores matches!
        </Text>

        <CampoTexto
          label="Sobre você"
          dica="Fale sobre sua rotina, personalidade, interesses e o que procura em um colega de quarto."
          multiline
          maxLength={300}
          value={sobre}
          onChangeText={setSobre}
          contador={`${sobre.length}/300`}
        />

        <Text style={styles.label}>Horários</Text>
        <Text style={styles.dica}>Quando você costuma estudar, trabalhar, descansar e receber visitas?</Text>
        <SelectField
          title="Sua rotina"
          placeholder="Selecione os horários"
          options={HORARIOS}
          multiple
          value={horarios}
          onChange={setHorarios}
        />

        <Text style={[styles.label, { marginTop: 14 }]}>Preferências</Text>
        <Text style={styles.dica}>Quais são suas preferências de convivência, hábitos e estilo de vida?</Text>
        <SelectField
          title="Suas preferências"
          placeholder="Selecione as preferências"
          options={PREFERENCIAS}
          multiple
          value={preferencias}
          onChange={setPreferencias}
        />

        <CampoTexto
          style={{ marginTop: 14 }}
          label="Observações"
          dica="Algo mais que você gostaria de compartilhar?"
          multiline
          maxLength={200}
          value={observacoes}
          onChangeText={setObservacoes}
          contador={`${observacoes.length}/200`}
        />

        {/* só para quem NÃO tem apartamento */}
        {!temAp && (
          <>
            <Text style={styles.label}>Faixa de preço</Text>
            <Text style={styles.dica}>Qual o valor aproximado que você pode pagar por mês (aluguel + contas)?</Text>
            <SelectField
              title="Faixa de preço"
              placeholder="Selecione a faixa de preço"
              options={FAIXAS_PRECO}
              value={faixa}
              onChange={setFaixa}
            />
          </>
        )}

        <TouchableOpacity style={styles.btn} onPress={concluir}>
          <Text style={styles.btnText}>{temAp ? 'Continuar →' : 'Concluir'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  back: { color: colors.primary, fontSize: 16, marginBottom: 8 },
  title: { fontSize: 26, fontWeight: 'bold', color: colors.primary },
  subtitle: { color: colors.text, marginTop: 6, marginBottom: 16 },
  label: { fontWeight: '700', color: colors.primary, fontSize: 14, marginBottom: 4 },
  dica: { color: colors.muted, fontSize: 12, marginBottom: 6 },
  btn: {
    backgroundColor: colors.primary,
    padding: 16,
    borderRadius: 30,
    alignItems: 'center',
    marginTop: 28,
  },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
