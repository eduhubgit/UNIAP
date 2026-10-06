import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { colors } from '../theme';
import { useApp } from '../context/AppContext';
import { mostrarAlerta } from '../utils/alerta';
import SelectField from '../components/SelectField';
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
      mostrarAlerta(
        'Atenção',
        'Conte um pouco mais sobre você (mínimo 10 caracteres).'
      );
      return;
    }
    if (horarios.length === 0) {
      mostrarAlerta(
        'Atenção',
        'Selecione pelo menos um horário da sua rotina.'
      );
      return;
    }
    if (preferencias.length === 0) {
      mostrarAlerta('Atenção', 'Selecione pelo menos uma preferência.');
      return;
    }
    if (!faixa) {
      mostrarAlerta('Atenção', 'Selecione a faixa de preço.');
      return;
    }

    const perfil = {
      sobre: sobre.trim(),
      horarios,
      preferencias,
      observacoes: observacoes.trim(),
      faixa,
    };

    if (temAp) {
      // dono de apartamento: guarda o perfil e segue para as telas do AP
      updateDraft(perfil);
      navigation.navigate('ApStep1');
    } else {
      // sem AP: finaliza o cadastro e entra no app
      finishRegister({ ...perfil, ap: null });
      mostrarAlerta(
        'Cadastro concluído!',
        'Sua conta foi criada. Bem-vindo(a) ao UNI AP!'
      );
      navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={{ padding: 24 }}
        keyboardShouldPersistTaps="handled">
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>← Voltar</Text>
        </TouchableOpacity>

        <Text style={styles.title}>
          {temAp ? 'Conte sobre você' : 'Você ainda não tem um apartamento?'}
        </Text>
        <Text style={styles.subtitle}>
          Conte um pouco sobre você e suas preferências para encontrarmos os
          melhores matches!
        </Text>

        <Text style={styles.label}>Sobre você</Text>
        <TextInput
          style={[styles.input, styles.textarea]}
          placeholder="Fale sobre sua rotina, personalidade, interesses e o que procura em um colega de quarto."
          placeholderTextColor={colors.muted}
          multiline
          maxLength={300}
          value={sobre}
          onChangeText={setSobre}
        />
        <Text style={styles.counter}>{sobre.length}/300</Text>

        <Text style={styles.label}>Horários</Text>
        <SelectField
          title="Sua rotina"
          placeholder="Selecione os horários"
          options={HORARIOS}
          multiple
          value={horarios}
          onChange={setHorarios}
        />

        <Text style={styles.label}>Preferências</Text>
        <SelectField
          title="Suas preferências"
          placeholder="Selecione as preferências"
          options={PREFERENCIAS}
          multiple
          value={preferencias}
          onChange={setPreferencias}
        />

        <Text style={styles.label}>Observações</Text>
        <TextInput
          style={[styles.input, styles.textarea]}
          placeholder="Algo mais que você gostaria de compartilhar?"
          placeholderTextColor={colors.muted}
          multiline
          maxLength={200}
          value={observacoes}
          onChangeText={setObservacoes}
        />
        <Text style={styles.counter}>{observacoes.length}/200</Text>

        <Text style={styles.label}>
          {temAp
            ? 'Quanto cada morador pagaria (aluguel + contas)'
            : 'Faixa de preço (aluguel + contas)'}
        </Text>
        <SelectField
          title="Faixa de preço"
          placeholder="Selecione a faixa de preço"
          options={FAIXAS_PRECO}
          value={faixa}
          onChange={setFaixa}
        />

        <TouchableOpacity style={styles.btn} onPress={concluir}>
          <Text style={styles.btnText}>
            {temAp ? 'Continuar →' : 'Concluir'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  back: { color: colors.primary, fontSize: 16, marginBottom: 8 },
  title: { fontSize: 26, fontWeight: 'bold', color: colors.primary },
  subtitle: { color: colors.text, marginTop: 6, marginBottom: 8 },
  label: {
    fontWeight: '700',
    color: colors.primary,
    marginTop: 16,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 14,
    backgroundColor: '#fff',
    color: colors.text,
  },
  textarea: { minHeight: 90, textAlignVertical: 'top' },
  counter: {
    alignSelf: 'flex-end',
    color: colors.muted,
    fontSize: 12,
    marginTop: 4,
  },
  btn: {
    backgroundColor: colors.primary,
    padding: 16,
    borderRadius: 30,
    alignItems: 'center',
    marginTop: 28,
  },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
