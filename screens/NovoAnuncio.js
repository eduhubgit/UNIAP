import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { colors } from '../theme';
import { useApp } from '../context/AppContext';
import { useAnuncios } from '../context/AnunciosContext';
import { CATEGORIAS, CONDICOES } from '../data/categorias';
import { reais } from '../utils/format';
import { mostrarAlerta } from '../utils/alerta';
import { escolherFotosAnuncio } from '../utils/fotosAnuncio';

const MAX_FOTOS = 3;

export default function NovoAnuncio({ navigation }) {
  const { currentUser } = useApp();
  const { criarAnuncio } = useAnuncios();

  const [fotos, setFotos] = useState([]);
  const [titulo, setTitulo] = useState('');
  const [categoria, setCategoria] = useState(null);
  const [condicao, setCondicao] = useState(null);
  const [precoDigits, setPrecoDigits] = useState('');
  const [descricao, setDescricao] = useState('');

  const adicionarFotos = async () => {
    const restante = MAX_FOTOS - fotos.length;
    if (restante <= 0) {
      mostrarAlerta('Limite', `Você pode adicionar até ${MAX_FOTOS} fotos.`);
      return;
    }
    const novas = await escolherFotosAnuncio(restante);
    if (novas.length) setFotos((prev) => [...prev, ...novas].slice(0, MAX_FOTOS));
  };

  const removerFoto = (indice) => setFotos((prev) => prev.filter((_, i) => i !== indice));

  const publicar = () => {
    const preco = parseInt(precoDigits || '0', 10) / 100;

    if (titulo.trim().length < 3) {
      mostrarAlerta('Atenção', 'Dê um título ao anúncio (mínimo 3 letras).');
      return;
    }
    if (!categoria) {
      mostrarAlerta('Atenção', 'Escolha uma categoria.');
      return;
    }
    if (!condicao) {
      mostrarAlerta('Atenção', 'Informe a condição do produto.');
      return;
    }
    if (preco <= 0) {
      mostrarAlerta('Atenção', 'Informe o preço.');
      return;
    }
    if (descricao.trim().length < 10) {
      mostrarAlerta('Atenção', 'Escreva uma descrição um pouco maior (mínimo 10 caracteres).');
      return;
    }

    criarAnuncio({
      titulo: titulo.trim(),
      categoria,
      condicao,
      preco,
      descricao: descricao.trim(),
      fotos,
    });

    mostrarAlerta(
      'Anúncio publicado!',
      'Seu anúncio já aparece para outros estudantes. Você pode vê-lo em "Meus anúncios".'
    );
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={{ padding: 20 }} keyboardShouldPersistTaps="handled">
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>← Voltar</Text>
        </TouchableOpacity>
        <Text style={styles.titulo}>Novo anúncio</Text>
        <Text style={styles.sub}>Conte o que você quer vender para outros estudantes.</Text>

        {/* FOTOS */}
        <Text style={styles.label}>Fotos (opcional, até {MAX_FOTOS})</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <TouchableOpacity style={styles.addFoto} onPress={adicionarFotos}>
            <Text style={{ fontSize: 28 }}>📷</Text>
            <Text style={styles.addFotoText}>Adicionar fotos</Text>
            <Text style={styles.addFotoSub}>
              {fotos.length}/{MAX_FOTOS}
            </Text>
          </TouchableOpacity>
          {fotos.map((uri, i) => (
            <View key={i} style={{ marginRight: 10 }}>
              <Image source={{ uri }} style={styles.thumb} />
              <TouchableOpacity style={styles.remover} onPress={() => removerFoto(i)}>
                <Text style={styles.removerText}>✕</Text>
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
        <Text style={styles.dica}>Sem foto, o anúncio mostra o ícone da categoria.</Text>

        {/* TÍTULO */}
        <Text style={styles.label}>Título</Text>
        <TextInput
          style={styles.input}
          placeholder="Ex.: Bicicleta aro 29"
          placeholderTextColor={colors.muted}
          maxLength={50}
          value={titulo}
          onChangeText={setTitulo}
        />

        {/* CATEGORIA */}
        <Text style={styles.label}>Categoria</Text>
        <View style={styles.chips}>
          {CATEGORIAS.map((c) => (
            <TouchableOpacity
              key={c.id}
              style={[styles.chip, categoria === c.id && styles.chipAtivo]}
              onPress={() => setCategoria(c.id)}
            >
              <Text style={[styles.chipText, categoria === c.id && { color: '#fff' }]}>
                {c.emoji} {c.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* CONDIÇÃO */}
        <Text style={styles.label}>Condição</Text>
        <View style={styles.chips}>
          {CONDICOES.map((c) => (
            <TouchableOpacity
              key={c}
              style={[styles.chip, condicao === c && styles.chipAtivo]}
              onPress={() => setCondicao(c)}
            >
              <Text style={[styles.chipText, condicao === c && { color: '#fff' }]}>{c}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* PREÇO */}
        <Text style={styles.label}>Preço</Text>
        <TextInput
          style={styles.input}
          placeholder="R$ 0,00"
          placeholderTextColor={colors.muted}
          keyboardType="numeric"
          value={precoDigits ? reais(parseInt(precoDigits, 10) / 100) : ''}
          onChangeText={(t) => setPrecoDigits(t.replace(/\D/g, '').slice(0, 7))}
        />

        {/* DESCRIÇÃO */}
        <Text style={styles.label}>Descrição</Text>
        <TextInput
          style={[styles.input, styles.textarea]}
          placeholder="Conte o estado do produto, tempo de uso, onde retirar..."
          placeholderTextColor={colors.muted}
          multiline
          maxLength={300}
          value={descricao}
          onChangeText={setDescricao}
        />
        <Text style={styles.contador}>{descricao.length}/300</Text>

        <Text style={styles.local}>📍 {currentUser?.cidade || 'Quixadá - CE'} (sua cidade)</Text>

        <TouchableOpacity style={styles.btn} onPress={publicar}>
          <Text style={styles.btnText}>Publicar anúncio</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  back: { color: colors.primary, fontSize: 16, marginBottom: 8 },
  titulo: { fontSize: 28, fontWeight: 'bold', color: colors.primary },
  sub: { color: colors.text, marginTop: 4, marginBottom: 6 },
  label: { fontWeight: '700', color: colors.primary, marginTop: 18, marginBottom: 8 },
  dica: { color: colors.muted, fontSize: 12, marginTop: 6 },

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
    backgroundColor: '#fff',
  },
  addFotoText: { color: colors.primary, fontWeight: '600', fontSize: 12, marginTop: 2 },
  addFotoSub: { color: colors.muted, fontSize: 11 },
  thumb: { width: 100, height: 100, borderRadius: 12 },
  remover: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removerText: { color: '#fff', fontSize: 12 },

  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 14,
    backgroundColor: '#fff',
    color: colors.text,
  },
  textarea: { minHeight: 100, textAlignVertical: 'top' },
  contador: { alignSelf: 'flex-end', color: colors.muted, fontSize: 12, marginTop: 4 },

  chips: { flexDirection: 'row', flexWrap: 'wrap' },
  chip: {
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 14,
    marginRight: 8,
    marginBottom: 8,
    backgroundColor: '#fff',
  },
  chipAtivo: { backgroundColor: colors.primary },
  chipText: { color: colors.primary, fontWeight: '600' },

  local: { color: colors.muted, marginTop: 14 },
  btn: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: 'center',
    marginTop: 22,
  },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});