import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useApp } from './AppContext';
import { ANUNCIOS_MOCK } from '../data/mockAds';

const AnunciosContext = createContext();
const CHAVE = 'uniap:anuncios:v1';

export function AnunciosProvider({ children }) {
  const { currentUser, users, carregado: appCarregado } = useApp();
  const [carregado, setCarregado] = useState(false);
  const [criados, setCriados] = useState([]); // anúncios postados por usuários
  const [favoritosPorUsuario, setFavoritosPorUsuario] = useState({}); // { idDoUsuario: [idsDeAnuncios] }

  // carregar ao abrir
  useEffect(() => {
    (async () => {
      try {
        const bruto = await AsyncStorage.getItem(CHAVE);
        if (bruto) {
          const salvo = JSON.parse(bruto);
          setCriados(Array.isArray(salvo.criados) ? salvo.criados : []);
          setFavoritosPorUsuario(salvo.favoritosPorUsuario || {});
        }
      } catch (e) {
        console.warn('Erro ao carregar anúncios:', e);
      }
      setCarregado(true);
    })();
  }, []);

  // limpeza: some o que pertence a contas que não existem mais (apagar tudo / excluir conta)
  useEffect(() => {
    if (!carregado || !appCarregado) return;
    const ids = new Set(users.map((u) => u.id));

    setCriados((prev) => {
      const restantes = prev.filter((a) => ids.has(a.vendedor.id));
      return restantes.length === prev.length ? prev : restantes;
    });

    setFavoritosPorUsuario((prev) => {
      const chaves = Object.keys(prev);
      const vivas = chaves.filter((id) => ids.has(id));
      if (vivas.length === chaves.length) return prev;
      const novo = {};
      vivas.forEach((id) => {
        novo[id] = prev[id];
      });
      return novo;
    });
  }, [users, carregado, appCarregado]);

  // salvar a cada mudança
  useEffect(() => {
    if (!carregado) return;
    AsyncStorage.setItem(CHAVE, JSON.stringify({ criados, favoritosPorUsuario })).catch((e) =>
      console.warn('Erro ao salvar anúncios:', e)
    );
  }, [carregado, criados, favoritosPorUsuario]);

  // mais novos primeiro
  const anuncios = [...criados, ...ANUNCIOS_MOCK].sort((a, b) => b.criadoEm - a.criadoEm);

  const favoritosIds = (currentUser && favoritosPorUsuario[currentUser.id]) || [];
  const ehFavorito = (id) => favoritosIds.includes(id);

  const alternarFavorito = (id) => {
    if (!currentUser) return;
    setFavoritosPorUsuario((prev) => {
      const atuais = prev[currentUser.id] || [];
      return {
        ...prev,
        [currentUser.id]: atuais.includes(id) ? atuais.filter((x) => x !== id) : [...atuais, id],
      };
    });
  };

  const criarAnuncio = (dados) => {
    const novo = {
      id: `u-${Date.now()}`,
      criadoEm: Date.now(),
      cidade: currentUser.cidade || 'Quixadá - CE',
      vendedor: {
        id: currentUser.id,
        nome: currentUser.nome,
        foto: currentUser.foto || null,
        subtitulo: 'Estudante',
        mock: false,
      },
      ...dados,
    };
    setCriados((prev) => [novo, ...prev]);
    return novo;
  };

  const excluirAnuncio = (id) =>
    setCriados((prev) => prev.filter((a) => !(a.id === id && a.vendedor.id === currentUser?.id)));

  return (
    <AnunciosContext.Provider
      value={{ anuncios, favoritosIds, ehFavorito, alternarFavorito, criarAnuncio, excluirAnuncio }}
    >
      {children}
    </AnunciosContext.Provider>
  );
}

export const useAnuncios = () => useContext(AnunciosContext);