import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  Modal,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { colors } from '../theme';
import { useApp } from '../context/AppContext';
import { useAnuncios } from '../context/AnunciosContext';
import ImagemAnuncio from './ImagemAnuncio';
import PersonModal from './PersonModal';
import { CATEGORIAS } from '../data/categorias';
import { reais } from '../utils/format';
import { tempoDecorrido } from '../utils/anuncios';
import { buscarPessoa } from '../utils/people';
import { perfilDeUsuario } from '../utils/perfil';

/*
  Props:
  - anuncio: anúncio a exibir (null = fechado)
  - onClose
  - navigation: para ir aos chats
*/
export default function AnuncioModal({ anuncio, onClose, navigation }) {
  const { currentUser, users, startChat } = useApp();
  const { ehFavorito, alternarFavorito, excluirAnuncio } = useAnuncios();
  const [fotoAtiva, setFotoAtiva] = useState(0);
  const [zoom, setZoom] = useState(false);
  const [etapa, setEtapa] = useState(null); // null | 'excluir' | 'chat' | 'indisponivel'
  const [perfilAberto, setPerfilAberto] = useState(false);

  if (!anuncio) return null;

  const fotos = anuncio.fotos || [];
  const categoria = CATEGORIAS.find((c) => c.id === anuncio.categoria);
  const vendedor = anuncio.vendedor;
  const meu = vendedor.id === currentUser?.id;
  const favorito = ehFavorito(anuncio.id);

  // perfil do vendedor: pessoa de teste ou usuário real deste aparelho
  const usuarioReal = users.find((u) => u.id === vendedor.id);
  const pessoaVendedor = vendedor.mock
    ? buscarPessoa(vendedor.id)
    : usuarioReal
    ? perfilDeUsuario(usuarioReal)
    : null;
  const podeVerPerfil = !meu && !!pessoaVendedor;

  const fechar = () => {
    setFotoAtiva(0);
    setZoom(false);
    setEtapa(null);
    setPerfilAberto(false);
    onClose();
  };

  const aoVoltar = () => {
    if (zoom) setZoom(false);
    else if (etapa) setEtapa(null);
    else fechar();
  };

  const mudarFoto = (passo) =>
    setFotoAtiva((i) => Math.min(Math.max(i + passo, 0), fotos.length - 1));

  const conversar = () => {
    if (!vendedor.mock) {
      setEtapa('indisponivel');
      return;
    }
    const pessoa = buscarPessoa(vendedor.id);
    if (pessoa) {
      startChat(
        pessoa,
        `Oi! Vi que você se interessou pelo meu anúncio "${anuncio.titulo}". Posso te ajudar com alguma dúvida? 😊`,
        { anuncio: { id: anuncio.id, titulo: anuncio.titulo } }
      );
    }
    setEtapa('chat');
  };

  const excluir = () => {
    excluirAnuncio(anuncio.id);
    fechar();
  };

  const irParaChats = () => {
    fechar();
    setTimeout(() => navigation.navigate('Chats'), 300);
  };

  return (
    <Modal visible transparent animationType="slide" onRequestClose={aoVoltar}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <ScrollView contentContainerStyle={{ paddingBottom: 16 }}>
            <View>
              {fotos.length > 0 ? (
                <TouchableOpacity activeOpacity={0.9} onPress={() => setZoom(true)}>
                  <Image source={{ uri: fotos[fotoAtiva] }} style={styles.foto} />
                </TouchableOpacity>
              ) : (
                <ImagemAnuncio anuncio={anuncio} style={styles.foto} emojiSize={96} />
              )}

              <TouchableOpacity style={styles.fechar} onPress={fechar}>
                <Text style={styles.fecharText}>✕</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.coracao} onPress={() => alternarFavorito(anuncio.id)}>
                <Text style={[styles.coracaoText, favorito && { color: colors.pink }]}>
                  {favorito ? '♥' : '♡'}
                </Text>
              </TouchableOpacity>

              {fotos.length > 0 && (
                <View style={styles.ampliar} pointerEvents="none">
                  <Text style={styles.ampliarText}>🔍 Ampliar</Text>
                </View>
              )}
            </View>

            {fotos.length > 1 && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={{ paddingHorizontal: 14, paddingTop: 10 }}
              >
                {fotos.map((uri, i) => (
                  <TouchableOpacity key={i} onPress={() => setFotoAtiva(i)}>
                    <Image
                      source={{ uri }}
                      style={[styles.mini, i === fotoAtiva && styles.miniAtiva]}
                    />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}

            <View style={styles.corpo}>
              <Text style={styles.preco}>{reais(anuncio.preco)}</Text>
              <Text style={styles.titulo}>{anuncio.titulo}</Text>

              <View style={styles.chips}>
                {!!categoria && (
                  <View style={styles.chip}>
                    <Text style={styles.chipText}>
                      {categoria.emoji} {categoria.label}
                    </Text>
                  </View>
                )}
                {!!anuncio.condicao && (
                  <View style={styles.chip}>
                    <Text style={styles.chipText}>✨ {anuncio.condicao}</Text>
                  </View>
                )}
              </View>

              <Text style={styles.meta}>
                📍 {anuncio.cidade} {'  '}🕒 {tempoDecorrido(anuncio.criadoEm)}
              </Text>

              <Text style={styles.secao}>Descrição</Text>
              <Text style={styles.texto}>{anuncio.detalhes || anuncio.descricao}</Text>

              <Text style={styles.secao}>Vendedor</Text>
              <TouchableOpacity
                style={styles.vendedor}
                activeOpacity={0.8}
                disabled={!podeVerPerfil}
                onPress={() => setPerfilAberto(true)}
              >
                {vendedor.foto ? (
                  <Image source={{ uri: vendedor.foto }} style={styles.avatar} />
                ) : (
                  <View style={[styles.avatar, styles.avatarVazio]}>
                    <Text style={styles.inicial}>{vendedor.nome?.[0]?.toUpperCase()}</Text>
                  </View>
                )}
                <View style={{ marginLeft: 12, flex: 1 }}>
                  <Text style={styles.vendedorNome}>
                    {vendedor.nome}
                    {meu ? ' (você)' : ''}
                  </Text>
                  <Text style={styles.vendedorSub}>{vendedor.subtitulo}</Text>
                </View>
                {podeVerPerfil && <Text style={styles.verPerfil}>Ver perfil ›</Text>}
              </TouchableOpacity>
            </View>
          </ScrollView>

          <View style={styles.rodape}>
            {meu ? (
              <TouchableOpacity
                style={[styles.btn, { backgroundColor: colors.error }]}
                onPress={() => setEtapa('excluir')}
              >
                <Text style={styles.btnText}>🗑️ Excluir anúncio</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.btn} onPress={conversar}>
                <Text style={styles.btnText}>💬 Conversar com o vendedor</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {etapa && (
          <View style={styles.camada}>
            <View style={styles.caixa}>
              {etapa === 'excluir' && (
                <>
                  <Text style={styles.caixaTitulo}>Excluir anúncio?</Text>
                  <Text style={styles.caixaTexto}>
                    Tem certeza que quer excluir "{anuncio.titulo}"? Essa ação não pode ser desfeita.
                  </Text>
                  <TouchableOpacity
                    style={[styles.btn, { backgroundColor: colors.error }]}
                    onPress={excluir}
                  >
                    <Text style={styles.btnText}>Sim, excluir</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setEtapa(null)}>
                    <Text style={styles.voltar}>Voltar</Text>
                  </TouchableOpacity>
                </>
              )}

              {etapa === 'chat' && (
                <>
                  <Text style={styles.caixaTitulo}>Conversa aberta! 💬</Text>
                  <Text style={styles.caixaTexto}>
                    A conversa com {vendedor.nome} está na sua aba de chats. Combinem o preço e a retirada por lá.
                  </Text>
                  <TouchableOpacity style={styles.btn} onPress={irParaChats}>
                    <Text style={styles.btnText}>Ir para os chats</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setEtapa(null)}>
                    <Text style={styles.voltar}>Continuar vendo o anúncio</Text>
                  </TouchableOpacity>
                </>
              )}

              {etapa === 'indisponivel' && (
                <>
                  <Text style={styles.caixaTitulo}>Chat indisponível</Text>
                  <Text style={styles.caixaTexto}>
                    A conversa com outros usuários reais será liberada quando o app for conectado a um servidor.
                  </Text>
                  <TouchableOpacity style={styles.btn} onPress={() => setEtapa(null)}>
                    <Text style={styles.btnText}>Entendi</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>
        )}

        {zoom && fotos.length > 0 && (
          <View style={styles.viewer}>
            <Image
              source={{ uri: fotos[fotoAtiva] }}
              style={styles.viewerImg}
              resizeMode="contain"
            />
            <TouchableOpacity style={styles.viewerVoltar} onPress={() => setZoom(false)}>
              <Text style={styles.viewerVoltarText}>← Voltar</Text>
            </TouchableOpacity>

            {fotos.length > 1 && (
              <>
                <TouchableOpacity
                  style={[styles.viewerSeta, { left: 10 }, fotoAtiva === 0 && { opacity: 0.3 }]}
                  disabled={fotoAtiva === 0}
                  onPress={() => mudarFoto(-1)}
                >
                  <Text style={styles.viewerSetaText}>‹</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.viewerSeta,
                    { right: 10 },
                    fotoAtiva === fotos.length - 1 && { opacity: 0.3 },
                  ]}
                  disabled={fotoAtiva === fotos.length - 1}
                  onPress={() => mudarFoto(1)}
                >
                  <Text style={styles.viewerSetaText}>›</Text>
                </TouchableOpacity>
                <Text style={styles.viewerContador}>
                  {fotoAtiva + 1} de {fotos.length}
                </Text>
              </>
            )}
          </View>
        )}

        {/* PERFIL DO VENDEDOR (aberto por cima do anúncio) */}
        <PersonModal
          person={perfilAberto ? pessoaVendedor : null}
          eu={currentUser}
          onClose={() => setPerfilAberto(false)}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: {
    height: '92%',
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  foto: { width: '100%', height: 280 },
  fechar: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fecharText: { color: '#fff', fontSize: 16 },
  coracao: {
    position: 'absolute',
    top: 14,
    left: 14,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  coracaoText: { fontSize: 24, color: colors.primary, marginTop: -2 },
  ampliar: {
    position: 'absolute',
    bottom: 12,
    right: 14,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  ampliarText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  mini: {
    width: 64,
    height: 64,
    borderRadius: 10,
    marginRight: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  miniAtiva: { borderColor: colors.primary },
  corpo: { padding: 18 },
  preco: { fontSize: 26, fontWeight: 'bold', color: colors.pink },
  titulo: { fontSize: 22, fontWeight: 'bold', color: colors.primary, marginTop: 2 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 10 },
  chip: {
    backgroundColor: '#EFE6F7',
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginRight: 8,
    marginBottom: 6,
  },
  chipText: { color: colors.primary, fontWeight: '600', fontSize: 13 },
  meta: { color: colors.muted, marginTop: 4 },
  secao: { fontSize: 16, fontWeight: '700', color: colors.primary, marginTop: 20, marginBottom: 6 },
  texto: { color: colors.text, lineHeight: 22 },
  vendedor: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bg,
    borderRadius: 16,
    padding: 12,
  },
  avatar: { width: 52, height: 52, borderRadius: 26 },
  avatarVazio: { backgroundColor: '#E6D6F3', alignItems: 'center', justifyContent: 'center' },
  inicial: { fontSize: 22, fontWeight: 'bold', color: colors.primary },
  vendedorNome: { fontSize: 16, fontWeight: 'bold', color: colors.primary },
  vendedorSub: { color: colors.text, fontSize: 13 },
  verPerfil: { color: colors.primary, fontWeight: '700', fontSize: 13 },
  rodape: { padding: 14, borderTopWidth: 1, borderTopColor: colors.bg, backgroundColor: '#fff' },
  btn: {
    backgroundColor: colors.pink,
    paddingVertical: 15,
    borderRadius: 30,
    alignItems: 'center',
  },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  camada: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    padding: 24,
  },
  caixa: { backgroundColor: '#fff', borderRadius: 22, padding: 22 },
  caixaTitulo: { fontSize: 20, fontWeight: 'bold', color: colors.primary, textAlign: 'center' },
  caixaTexto: { color: colors.text, textAlign: 'center', marginVertical: 14, lineHeight: 21 },
  voltar: { textAlign: 'center', color: colors.muted, marginTop: 14 },

  viewer: { ...StyleSheet.absoluteFillObject, backgroundColor: '#000', justifyContent: 'center' },
  viewerImg: { width: '100%', height: '100%' },
  viewerVoltar: {
    position: 'absolute',
    top: 40,
    left: 16,
    backgroundColor: colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 22,
  },
  viewerVoltarText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  viewerSeta: {
    position: 'absolute',
    top: '50%',
    marginTop: -38,
    width: 30,
    height: 76,
    borderRadius: 15,
    backgroundColor: 'rgba(123,63,160,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewerSetaText: { color: '#fff', fontSize: 34, fontWeight: 'bold', marginTop: -4 },
  viewerContador: {
    position: 'absolute',
    bottom: 36,
    alignSelf: 'center',
    color: '#fff',
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 14,
    overflow: 'hidden',
    fontWeight: '600',
  },
});