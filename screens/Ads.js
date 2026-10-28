import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { colors } from '../theme';
import { useApp } from '../context/AppContext';
import { useAnuncios } from '../context/AnunciosContext';
import Header from '../components/Header';
import ImagemAnuncio from '../components/ImagemAnuncio';
import AnuncioModal from '../components/AnuncioModal';
import { CATEGORIAS } from '../data/categorias';
import { reais } from '../utils/format';
import { normalizar, tempoDecorrido } from '../utils/anuncios';

const FILTROS = [
  { id: 'todos', label: 'Todos' },
  { id: 'favoritos', label: '♥ Favoritos' },
  { id: 'meus', label: 'Meus anúncios' },
];

export default function Ads({ navigation }) {
  const { currentUser } = useApp();
  const { anuncios, favoritosIds, ehFavorito, alternarFavorito } = useAnuncios();
  const [busca, setBusca] = useState('');
  const [categoria, setCategoria] = useState(null);
  const [filtro, setFiltro] = useState('todos');
  const [aberto, setAberto] = useState(null);

  const lista = useMemo(() => {
    const q = normalizar(busca.trim());
    const meuId = currentUser?.id;
    return anuncios.filter((a) => {
      const meu = a.vendedor.id === meuId;
      if (filtro === 'meus' && !meu) return false;
      if (filtro === 'todos' && meu) return false; // "Todos" = anúncios dos outros
      if (filtro === 'favoritos' && !favoritosIds.includes(a.id)) return false;
      if (categoria && a.categoria !== categoria) return false;
      if (q && !normalizar(`${a.titulo} ${a.descricao}`).includes(q)) return false;
      return true;
    });
  }, [anuncios, busca, categoria, filtro, favoritosIds, currentUser]);

  const mensagemVazia =
    filtro === 'meus'
      ? 'Você ainda não postou nada. Toque no + para anunciar algo!'
      : filtro === 'favoritos'
      ? 'Você ainda não favoritou nenhum anúncio. Toque no ♡ para guardar.'
      : 'Nenhum anúncio encontrado. Tente outra busca ou categoria.';

  return (
    <SafeAreaView style={styles.container}>
      <Header />

      <ScrollView contentContainerStyle={{ paddingBottom: 110 }} keyboardShouldPersistTaps="handled">
        {/* BARRA DE PESQUISA */}
        <View style={styles.busca}>
          <Text style={styles.buscaIcone}>🔍</Text>
          <TextInput
            style={styles.buscaInput}
            placeholder="Buscar anúncios..."
            placeholderTextColor={colors.muted}
            value={busca}
            onChangeText={setBusca}
          />
          {busca.length > 0 && (
            <TouchableOpacity onPress={() => setBusca('')}>
              <Text style={styles.buscaLimpar}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* CATEGORIAS */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categorias}
        >
          {CATEGORIAS.map((c) => {
            const ativa = categoria === c.id;
            return (
              <TouchableOpacity
                key={c.id}
                style={styles.categoria}
                onPress={() => setCategoria(ativa ? null : c.id)}
              >
                <View
                  style={[
                    styles.categoriaCirculo,
                    { backgroundColor: c.cor },
                    ativa && styles.categoriaAtiva,
                  ]}
                >
                  <Text style={styles.categoriaEmoji}>{c.emoji}</Text>
                </View>
                <Text style={[styles.categoriaLabel, ativa && { fontWeight: '800' }]}>{c.label}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* FILTROS */}
        <View style={styles.filtros}>
          {FILTROS.map((f) => (
            <TouchableOpacity
              key={f.id}
              style={[styles.filtro, filtro === f.id && styles.filtroAtivo]}
              onPress={() => setFiltro(f.id)}
            >
              <Text style={[styles.filtroText, filtro === f.id && { color: '#fff' }]}>{f.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* LISTA */}
        <View style={{ paddingHorizontal: 16 }}>
          {lista.length === 0 ? (
            <View style={styles.vazio}>
              <Text style={styles.vazioEmoji}>🛍️</Text>
              <Text style={styles.vazioText}>{mensagemVazia}</Text>
            </View>
          ) : (
            lista.map((a) => {
              const fav = ehFavorito(a.id);
              return (
                <TouchableOpacity
                  key={a.id}
                  style={styles.card}
                  activeOpacity={0.9}
                  onPress={() => setAberto(a)}
                >
                  <ImagemAnuncio anuncio={a} style={styles.imagem} emojiSize={40} />

                  <View style={styles.info}>
                    <View style={styles.linhaTitulo}>
                      <Text style={styles.titulo} numberOfLines={1}>
                        {a.titulo}
                      </Text>
                      <TouchableOpacity
                        onPress={() => alternarFavorito(a.id)}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Text style={[styles.coracao, fav && { color: colors.pink }]}>
                          {fav ? '♥' : '♡'}
                        </Text>
                      </TouchableOpacity>
                    </View>

                    <Text style={styles.descricao} numberOfLines={3}>
                      {a.descricao}
                    </Text>

                    <View style={styles.rodape}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.meta}>📍 {a.cidade}</Text>
                        <Text style={styles.meta}>🕒 {tempoDecorrido(a.criadoEm)}</Text>
                      </View>
                      <View style={styles.preco}>
                        <Text style={styles.precoText}>{reais(a.preco)}</Text>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>
      </ScrollView>

      {/* BOTÃO + (NOVO ANÚNCIO) */}
      <TouchableOpacity
        style={styles.fab}
        activeOpacity={0.85}
        onPress={() => navigation.navigate('NovoAnuncio')}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      <AnuncioModal anuncio={aberto} onClose={() => setAberto(null)} navigation={navigation} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },

  busca: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 28,
    borderWidth: 1,
    borderColor: colors.border,
    marginHorizontal: 16,
    marginTop: 4,
    paddingHorizontal: 16,
    height: 52,
  },
  buscaIcone: { fontSize: 20, marginRight: 10 },
  buscaInput: { flex: 1, fontSize: 16, color: colors.text },
  buscaLimpar: { color: colors.muted, fontSize: 18, paddingLeft: 8 },

  categorias: { paddingHorizontal: 12, paddingVertical: 14 },
  categoria: { alignItems: 'center', marginHorizontal: 6, width: 86 },
  categoriaCirculo: {
    width: 70,
    height: 70,
    borderRadius: 35,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'transparent',
  },
  categoriaAtiva: { borderColor: colors.primary },
  categoriaEmoji: { fontSize: 32 },
  categoriaLabel: {
    marginTop: 6,
    fontSize: 12,
    color: colors.primary,
    fontWeight: '600',
    textAlign: 'center',
  },

  filtros: { flexDirection: 'row', paddingHorizontal: 16, marginBottom: 12 },
  filtro: {
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 14,
    marginRight: 8,
  },
  filtroAtivo: { backgroundColor: colors.primary },
  filtroText: { color: colors.primary, fontWeight: '700', fontSize: 13 },

  card: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 12,
    marginBottom: 12,
  },
  imagem: { width: 112, height: 112, borderRadius: 14 },
  info: { flex: 1, marginLeft: 12 },
  linhaTitulo: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  titulo: { flex: 1, fontSize: 16, fontWeight: 'bold', color: colors.primary },
  coracao: { fontSize: 24, color: colors.primary, marginLeft: 8 },
  descricao: { color: colors.text, fontSize: 13, marginTop: 4, lineHeight: 18 },
  rodape: { flexDirection: 'row', alignItems: 'flex-end', marginTop: 8 },
  meta: { color: colors.muted, fontSize: 12, marginTop: 1 },
  preco: {
    backgroundColor: '#F3E6FB',
    borderRadius: 18,
    paddingVertical: 8,
    paddingHorizontal: 14,
    marginLeft: 8,
  },
  precoText: { color: colors.primary, fontWeight: '800', fontSize: 14 },

  vazio: { alignItems: 'center', padding: 30 },
  vazioEmoji: { fontSize: 44 },
  vazioText: { color: colors.text, textAlign: 'center', marginTop: 10, lineHeight: 21 },

  fab: {
    position: 'absolute',
    right: 18,
    bottom: 18,
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    zIndex: 10,
  },
  fabText: { color: '#fff', fontSize: 38, lineHeight: 42, marginTop: -3 },
});