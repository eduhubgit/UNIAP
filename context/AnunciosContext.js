import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { carregarAnuncios, carregarFavoritos } from '../services/dados';
import { mensagemDeErro, publicarArquivos } from '../services/storage';
import { CATEGORIAS } from '../data/categorias';
import { mostrarAlerta } from '../utils/alerta';
import { useApp } from './AppContext';

const AnunciosContext = createContext();

const emojiDaCategoria = (id) => CATEGORIAS.find((c) => c.id === id)?.emoji || '📦';

export function AnunciosProvider({ children }) {
  const { currentUser } = useApp();
  const [anuncios, setAnuncios] = useState([]);
  const [favoritosPorUsuario, setFavoritosPorUsuario] = useState({});

  const uid = currentUser?.id;

  const carregar = useCallback(async () => {
    if (!uid) {
      setAnuncios([]);
      setFavoritosPorUsuario({});
      return;
    }

    const [lista, favoritos] = await Promise.all([carregarAnuncios(), carregarFavoritos(uid)]);
    setAnuncios(lista);
    setFavoritosPorUsuario({ [uid]: favoritos });
  }, [uid]);

  // carrega ao entrar / trocar de conta
  useEffect(() => {
    carregar().catch((e) => console.warn('Erro ao carregar anúncios:', e));
  }, [carregar]);

  // tempo real: novos anúncios e favoritos
  useEffect(() => {
    if (!uid) return undefined;

    let timer = null;
    const agendar = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        carregar().catch((e) => console.warn('Erro ao atualizar anúncios:', e));
      }, 250);
    };

    const canal = supabase
      .channel(`uniap-anuncios-${uid}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ads' }, agendar)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'favorites', filter: `user_id=eq.${uid}` },
        agendar
      )
      .subscribe();

    return () => {
      if (timer) clearTimeout(timer);
      supabase.removeChannel(canal);
    };
  }, [uid, carregar]);

  const favoritosIds = (uid && favoritosPorUsuario[uid]) || [];
  const ehFavorito = (id) => favoritosIds.includes(id);

  const alternarFavorito = async (id) => {
    if (!uid) return;

    const eraFavorito = favoritosIds.includes(id);

    setFavoritosPorUsuario((prev) => {
      const atuais = prev[uid] || [];
      return {
        ...prev,
        [uid]: eraFavorito ? atuais.filter((x) => x !== id) : [...atuais, id],
      };
    });

    const resposta = eraFavorito
      ? await supabase.from('favorites').delete().eq('user_id', uid).eq('ad_id', id)
      : await supabase.from('favorites').insert({ user_id: uid, ad_id: id });

    if (resposta.error) {
      mostrarAlerta('Erro', mensagemDeErro(resposta.error));
      carregar().catch(() => {});
    }
  };

  const criarAnuncio = async (dados) => {
    if (!uid || !currentUser) return null;

    try {
      const fotos = await publicarArquivos(dados.fotos || [], 'anuncios');

      const { data, error } = await supabase
        .from('ads')
        .insert({
          vendedor: uid,
          titulo: dados.titulo,
          categoria: dados.categoria,
          condicao: dados.condicao,
          preco: dados.preco,
          emoji: dados.emoji || emojiDaCategoria(dados.categoria),
          descricao: dados.descricao,
          detalhes: dados.detalhes || '',
          fotos,
          cidade: currentUser.cidade || 'Quixadá - CE',
        })
        .select('id')
        .maybeSingle();

      if (error) throw error;
      await carregar();
      return data;
    } catch (e) {
      mostrarAlerta('Erro', mensagemDeErro(e));
      return null;
    }
  };

  const excluirAnuncio = async (id) => {
    if (!uid) return;

    setAnuncios((prev) => prev.filter((a) => a.id !== id));

    const { error } = await supabase.from('ads').delete().eq('id', id).eq('vendedor', uid);

    if (error) {
      mostrarAlerta('Erro', mensagemDeErro(error));
      carregar().catch(() => {});
    }
  };

  return (
    <AnunciosContext.Provider
      value={{ anuncios, favoritosIds, ehFavorito, alternarFavorito, criarAnuncio, excluirAnuncio }}
    >
      {children}
    </AnunciosContext.Provider>
  );
}

export const useAnuncios = () => useContext(AnunciosContext);
