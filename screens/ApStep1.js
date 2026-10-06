import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  SafeAreaView,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { colors } from '../theme';
import { useApp } from '../context/AppContext';
import { mostrarAlerta } from '../utils/alerta';

const MAX_FOTOS = 10;

export default function ApStep1({ navigation }) {
  const { draft, updateDraft } = useApp();
  const [fotos, setFotos] = useState([]);
  const [doc, setDoc] = useState(null);
  const [endereco, setEndereco] = useState('');
  const [bairro, setBairro] = useState('');
  const [cidade, setCidade] = useState(draft.cidade || '');
  const [referencia, setReferencia] = useState('');

  const adicionarFotos = async () => {
    const restante = MAX_FOTOS - fotos.length;
    if (restante <= 0) {
      mostrarAlerta('Limite', `Você pode adicionar até ${MAX_FOTOS} fotos.`);
      return;
    }
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      mostrarAlerta('Permissão', 'Precisamos de acesso às suas fotos.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      selectionLimit: restante,
      quality: 0.7,
    });
    if (!result.canceled) {
      const novas = result.assets.map((a) => a.uri).slice(0, restante);
      setFotos((prev) => [...prev, ...novas]);
    }
  };

  const removerFoto = (uri) =>
    setFotos((prev) => prev.filter((f) => f !== uri));

  const escolherDocumento = async () => {
    const res = await DocumentPicker.getDocumentAsync({
      type: ['application/pdf', 'image/*'],
      copyToCacheDirectory: true,
    });
    if (!res.canceled) {
      const a = res.assets[0];
      setDoc({ name: a.name, uri: a.uri });
    }
  };

  const continuar = () => {
    if (fotos.length === 0) {
      mostrarAlerta('Atenção', 'Adicione pelo menos uma foto do apartamento.');
      return;
    }
    if (!doc) {
      mostrarAlerta(
        'Atenção',
        'Envie um documento que comprove que você é o responsável pelo imóvel.'
      );
      return;
    }
    if (!endereco.trim() || !bairro.trim() || !cidade.trim()) {
      mostrarAlerta('Atenção', 'Preencha endereço, bairro e cidade.');
      return;
    }
    updateDraft({
      apStep1: {
        fotos,
        doc,
        endereco: endereco.trim(),
        bairro: bairro.trim(),
        cidade: cidade.trim(),
        referencia: referencia.trim(),
      },
    });
    navigation.navigate('ApStep2');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={{ padding: 24 }}
        keyboardShouldPersistTaps="handled">
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>← Voltar</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Tem um apartamento?</Text>
        <Text style={styles.subtitle}>
          Cadastre seu imóvel e conecte-se a universitários que estão procurando
          um lugar para morar!
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
            style={{ marginTop: 10 }}>
            <TouchableOpacity style={styles.addFoto} onPress={adicionarFotos}>
              <Text style={{ fontSize: 26 }}>📷</Text>
              <Text style={styles.addFotoText}>Adicionar fotos</Text>
              <Text style={styles.addFotoSub}>
                {fotos.length}/{MAX_FOTOS}
              </Text>
            </TouchableOpacity>
            {fotos.map((uri) => (
              <View key={uri} style={styles.thumbBox}>
                <Image source={{ uri }} style={styles.thumb} />
                <TouchableOpacity
                  style={styles.remover}
                  onPress={() => removerFoto(uri)}>
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
                {doc ? doc.name : 'Adicionar documento'}
              </Text>
              <Text style={styles.docSub}>
                {doc
                  ? 'Toque para trocar o arquivo'
                  : 'Ex.: escritura, contrato de aluguel ou comprovante em seu nome.'}
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
          <Text style={styles.cardSub}>
            Informe o endereço completo para que os interessados possam ver a
            região.
          </Text>
          <TextInput
            style={styles.input}
            placeholder="Endereço completo"
            placeholderTextColor={colors.muted}
            value={endereco}
            onChangeText={setEndereco}
          />
          <View style={{ flexDirection: 'row' }}>
            <TextInput
              style={[styles.input, { flex: 1, marginRight: 8 }]}
              placeholder="Bairro"
              placeholderTextColor={colors.muted}
              value={bairro}
              onChangeText={setBairro}
            />
            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder="Cidade"
              placeholderTextColor={colors.muted}
              value={cidade}
              onChangeText={setCidade}
            />
          </View>
          <TextInput
            style={styles.input}
            placeholder="Ponto de referência (opcional)"
            placeholderTextColor={colors.muted}
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
  addFoto: {
    width: 120,
    height: 100,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.primary,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    backgroundColor: colors.bg,
  },
  addFotoText: {
    color: colors.primary,
    fontWeight: '600',
    fontSize: 12,
    marginTop: 2,
  },
  addFotoSub: { color: colors.muted, fontSize: 11 },
  thumbBox: { marginRight: 10 },
  thumb: { width: 100, height: 100, borderRadius: 12 },
  remover: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.6)',
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removerText: { color: '#fff', fontSize: 12 },
  docBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.primary,
    borderRadius: 12,
    padding: 14,
    marginTop: 10,
    backgroundColor: colors.bg,
  },
  docTitle: { fontWeight: '700', color: colors.text },
  docSub: { color: colors.muted, fontSize: 12, marginTop: 2 },
  info: { color: colors.muted, fontSize: 12, marginTop: 8 },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 14,
    marginTop: 10,
    backgroundColor: colors.bg,
    color: colors.text,
  },
  btn: {
    backgroundColor: colors.primary,
    padding: 16,
    borderRadius: 30,
    alignItems: 'center',
    marginTop: 8,
  },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
