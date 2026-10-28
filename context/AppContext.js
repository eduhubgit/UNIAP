import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { mostrarAlerta } from '../utils/alerta';
import { faixaPorValor, vagasInfo } from '../utils/perfil';

const AppContext = createContext();

const CHAVE = 'uniap:dados:v1';
const VAZIO = { interests: [], rejected: [], chats: [] };

const agora = () => {
  const d = new Date();
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return { ts: d.getTime(), hora: `${hh}:${mm}` };
};

export function AppProvider({ children }) {
  const [carregado, setCarregado] = useState(false);
  const [users, setUsers] = useState([]);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [userData, setUserData] = useState({}); // { [idDoUsuario]: { interests, rejected, chats } }
  const [settings, setSettings] = useState({ notificacoes: true, perfilVisivel: true });
  const [draft, setDraft] = useState({});
  const [avisoDispensado, setAvisoDispensado] = useState(false);
  const avisouErro = useRef(false);

  // ---------- CARREGAR AO ABRIR ----------
  useEffect(() => {
    (async () => {
      try {
        const bruto = await AsyncStorage.getItem(CHAVE);
        if (bruto) {
          const salvo = JSON.parse(bruto);
          setUsers(salvo.users || []);
          setCurrentUserId(salvo.currentUserId || null);
          setUserData(salvo.userData || {});
          if (salvo.settings) setSettings(salvo.settings);
        }
      } catch (e) {
        console.warn('Erro ao carregar dados:', e);
      }
      setCarregado(true);
    })();
  }, []);

  // ---------- SALVAR A CADA MUDANÇA ----------
  useEffect(() => {
    if (!carregado) return;
    AsyncStorage.setItem(CHAVE, JSON.stringify({ users, currentUserId, userData, settings })).catch(
      (e) => {
        console.warn('Erro ao salvar dados:', e);
        if (!avisouErro.current) {
          avisouErro.current = true;
          mostrarAlerta(
            'Espaço cheio',
            'Não foi possível salvar os dados neste aparelho. Isso costuma acontecer com fotos grandes demais: use menos fotos ou fotos menores.'
          );
        }
      }
    );
  }, [carregado, users, currentUserId, userData, settings]);

  // ---------- USUÁRIO ATUAL E SEUS DADOS ----------
  const currentUser = users.find((u) => u.id === currentUserId) || null;
  const dados = (currentUserId && userData[currentUserId]) || VAZIO;
  const { interests, rejected, chats } = dados;

  const atualizarDados = (fn) => {
    if (!currentUserId) return;
    setUserData((prev) => ({ ...prev, [currentUserId]: fn(prev[currentUserId] || VAZIO) }));
  };

  // ---------- BLOQUEIO DE MATCH E INTERESSADOS ----------
  // 'limite': quem tem apê e não tem mais vagas livres
  // 'aceito': quem procura apê e já foi aceito em uma casa (até clicar em "Ok")
  let bloqueio = null;
  if (currentUser?.ap) {
    if (vagasInfo(currentUser.ap).livres === 0) bloqueio = 'limite';
  } else if (currentUser && chats.some((c) => c.aceitoNaVaga) && !avisoDispensado) {
    bloqueio = 'aceito';
  }
  const dispensarAviso = () => setAvisoDispensado(true);
  const resetarAviso = () => setAvisoDispensado(false);

  // ---------- CONTA ----------
  const updateDraft = (data) => setDraft((prev) => ({ ...prev, ...data }));

  const finishRegister = (extra = {}) => {
    // "apStep1" é só rascunho (as fotos já vão dentro de "ap"), então não guardamos de novo
    const { apStep1, ...resto } = draft;
    const newUser = { id: Date.now().toString(), ...resto, ...extra };
    setUsers((prev) => [...prev, newUser]);
    setCurrentUserId(newUser.id);
    setDraft({});
    return newUser;
  };

  const login = (email, senha) => {
    const found = users.find(
      (u) => u.email.toLowerCase() === email.trim().toLowerCase() && u.senha === senha
    );
    if (found) {
      setCurrentUserId(found.id);
      setAvisoDispensado(false);
      return true;
    }
    return false;
  };

  const logout = () => {
    setCurrentUserId(null);
    setAvisoDispensado(false);
  };

  const emailExists = (email, ignoreId) =>
    users.some((u) => u.id !== ignoreId && u.email.toLowerCase() === email.trim().toLowerCase());

  const updateProfile = (data) => {
    if (!currentUserId) return;
    setUsers((prev) => prev.map((u) => (u.id === currentUserId ? { ...u, ...data } : u)));
  };

  // quem não tinha apartamento passa a ter (sem refazer o cadastro)
  const converterParaAp = (ap) => {
    if (!currentUserId) return;
    const { total } = vagasInfo(ap);
    const faixa = faixaPorValor(ap.aluguel / (total + 1));
    setUsers((prev) =>
      prev.map((u) => (u.id === currentUserId ? { ...u, ap, faixa, temAp: true } : u))
    );
    atualizarDados((d) => ({ ...d, interests: [], rejected: [] }));
    setDraft({});
  };

  const updateSettings = (data) => setSettings((prev) => ({ ...prev, ...data }));

  const deleteAccount = () => {
    if (currentUserId) {
      setUsers((prev) => prev.filter((u) => u.id !== currentUserId));
      setUserData((prev) => {
        const copia = { ...prev };
        delete copia[currentUserId];
        return copia;
      });
    }
    setCurrentUserId(null);
  };

  const limparTudo = async () => {
    try {
      await AsyncStorage.removeItem(CHAVE);
    } catch (e) {
      console.warn('Erro ao limpar dados:', e);
    }
    setUsers([]);
    setCurrentUserId(null);
    setUserData({});
    setSettings({ notificacoes: true, perfilVisivel: true });
    setDraft({});
    setAvisoDispensado(false);
  };

  // ---------- INTERESSES E CHATS ----------

  // extra.anuncio = { id, titulo } quando a conversa começa por causa de um produto
  const startChat = (person, primeira, extra = {}) => {
    const t = agora();
    atualizarDados((d) => {
      const semInteresse = d.interests.filter((id) => id !== person.id);
      const existente = d.chats.find((c) => c.personId === person.id);

      if (existente) {
        return {
          ...d,
          interests: semInteresse,
          chats: d.chats.map((c) =>
            c.personId === person.id && extra.anuncio && !c.produto
              ? { ...c, produto: extra.anuncio }
              : c
          ),
        };
      }

      const mensagens = [
        {
          id: `${t.ts}-${Math.random()}`,
          de: 'ele',
          texto: primeira || person.msgInteresse || 'Oi! Vamos conversar?',
          ...t,
        },
      ];

      // quem tem apê já manda quem mora com ele (as vagas que ele marcou como ocupadas)
      const ocupantes = person.ap?.ocupantes || [];
      if (!extra.anuncio && ocupantes.length > 0) {
        mensagens.push({
          id: `${t.ts + 1}-${Math.random()}`,
          de: 'ele',
          tipo: 'ocupantes',
          texto: 'Esses são os atuais moradores do apê:',
          ocupantes,
          ts: t.ts + 1,
          hora: t.hora,
        });
      }

      return {
        ...d,
        interests: semInteresse,
        chats: [
          ...d.chats,
          {
            personId: person.id,
            naoLidas: mensagens.length,
            vagaOcupada: false,
            aceitoNaVaga: false,
            produto: extra.anuncio || null,
            mensagens,
          },
        ],
      };
    });
  };

  const addInterest = (person) => {
    if (person.likedYou) {
      startChat(person);
      return 'match';
    }
    atualizarDados((d) => ({
      ...d,
      interests: d.interests.includes(person.id) ? d.interests : [...d.interests, person.id],
    }));
    return 'interesse';
  };

  const removeInterest = (personId) =>
    atualizarDados((d) => ({ ...d, interests: d.interests.filter((id) => id !== personId) }));

  const acceptIncoming = (person) => startChat(person);

  const rejectIncoming = (personId) =>
    atualizarDados((d) => ({
      ...d,
      rejected: d.rejected.includes(personId) ? d.rejected : [...d.rejected, personId],
    }));

  const simulateAccept = (person) =>
    startChat(person, 'Aceitei seu interesse! Vamos conversar? 😊');

  // extra permite mensagens especiais, ex.: { tipo: 'ocupantes', ocupantes: [ids] }
  const sendMessage = (personId, texto, extra = {}) => {
    const t = agora();
    atualizarDados((d) => ({
      ...d,
      chats: d.chats.map((c) =>
        c.personId === personId
          ? {
              ...c,
              mensagens: [
                ...c.mensagens,
                { id: `${t.ts}-${Math.random()}`, de: 'eu', texto, ...extra, ...t },
              ],
            }
          : c
      ),
    }));
  };

  const markRead = (personId) =>
    atualizarDados((d) => ({
      ...d,
      chats: d.chats.map((c) => (c.personId === personId && c.naoLidas ? { ...c, naoLidas: 0 } : c)),
    }));

  // "Vaga ocupada?" no chat de quem tem apartamento: ocupa ou libera uma vaga
  const alternarVagaOcupada = (personId) => {
    const ap = currentUser?.ap;
    const chat = chats.find((c) => c.personId === personId);
    if (!ap || !chat) return { ok: false, motivo: 'sem-ap' };

    const { total, livres } = vagasInfo(ap);
    const marcarChat = (valor) =>
      atualizarDados((d) => ({
        ...d,
        chats: d.chats.map((c) => (c.personId === personId ? { ...c, vagaOcupada: valor } : c)),
      }));

    if (!chat.vagaOcupada) {
      if (livres <= 0) return { ok: false, motivo: 'sem-vagas' };
      updateProfile({ ap: { ...ap, vagasTotal: total, vagas: livres - 1 } });
      marcarChat(true);
      return { ok: true, ocupada: true, livres: livres - 1 };
    }

    const novasLivres = Math.min(total, livres + 1);
    updateProfile({ ap: { ...ap, vagasTotal: total, vagas: novasLivres } });
    marcarChat(false);
    return { ok: true, ocupada: false, livres: novasLivres };
  };

  // TESTE: simula o dono do apê marcando você como "vaga ocupada" (círculo verde no seu chat)
  const alternarAceitoNaVaga = (personId) => {
    atualizarDados((d) => ({
      ...d,
      chats: d.chats.map((c) =>
        c.personId === personId ? { ...c, aceitoNaVaga: !c.aceitoNaVaga } : c
      ),
    }));
    setAvisoDispensado(false);
  };

  return (
    <AppContext.Provider
      value={{
        carregado,
        users,
        currentUser,
        draft,
        updateDraft,
        finishRegister,
        login,
        logout,
        emailExists,
        updateProfile,
        converterParaAp,
        settings,
        updateSettings,
        deleteAccount,
        limparTudo,
        interests,
        rejected,
        chats,
        addInterest,
        removeInterest,
        acceptIncoming,
        rejectIncoming,
        simulateAccept,
        startChat,
        sendMessage,
        markRead,
        alternarVagaOcupada,
        alternarAceitoNaVaga,
        bloqueio,
        dispensarAviso,
        resetarAviso,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);