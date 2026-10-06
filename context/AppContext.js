import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
  const [settings, setSettings] = useState({
    notificacoes: true,
    perfilVisivel: true,
  });
  const [draft, setDraft] = useState({}); // cadastro em andamento (não precisa ser salvo)

  // ---------- CARREGAR AO ABRIR O APP ----------
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
    if (!carregado) return; // não salva antes de terminar de carregar
    AsyncStorage.setItem(
      CHAVE,
      JSON.stringify({ users, currentUserId, userData, settings })
    ).catch((e) => console.warn('Erro ao salvar dados:', e));
  }, [carregado, users, currentUserId, userData, settings]);

  // ---------- USUÁRIO ATUAL E SEUS DADOS ----------
  const currentUser = users.find((u) => u.id === currentUserId) || null;
  const dados = (currentUserId && userData[currentUserId]) || VAZIO;
  const { interests, rejected, chats } = dados;

  // altera os dados (interesses/recusados/chats) só do usuário logado
  const atualizarDados = (fn) => {
    if (!currentUserId) return;
    setUserData((prev) => ({
      ...prev,
      [currentUserId]: fn(prev[currentUserId] || VAZIO),
    }));
  };

  // ---------- CONTA ----------
  const updateDraft = (data) => setDraft((prev) => ({ ...prev, ...data }));

  const finishRegister = (extra = {}) => {
    const newUser = { id: Date.now().toString(), ...draft, ...extra };
    setUsers((prev) => [...prev, newUser]);
    setCurrentUserId(newUser.id);
    setDraft({});
    return newUser;
  };

  const login = (email, senha) => {
    const found = users.find(
      (u) =>
        u.email.toLowerCase() === email.trim().toLowerCase() &&
        u.senha === senha
    );
    if (found) {
      setCurrentUserId(found.id);
      return true;
    }
    return false;
  };

  const logout = () => setCurrentUserId(null);

  const emailExists = (email, ignoreId) =>
    users.some(
      (u) =>
        u.id !== ignoreId &&
        u.email.toLowerCase() === email.trim().toLowerCase()
    );

  const updateProfile = (data) => {
    if (!currentUserId) return;
    setUsers((prev) =>
      prev.map((u) => (u.id === currentUserId ? { ...u, ...data } : u))
    );
  };

  const updateSettings = (data) =>
    setSettings((prev) => ({ ...prev, ...data }));

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

  // TESTE: apaga tudo o que está salvo no aparelho
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
  };

  // ---------- INTERESSES E CHATS ----------
  const startChat = (person, primeira) => {
    const t = agora();
    atualizarDados((d) => ({
      ...d,
      chats: d.chats.some((c) => c.personId === person.id)
        ? d.chats
        : [
            ...d.chats,
            {
              personId: person.id,
              naoLidas: 1,
              mensagens: [
                {
                  id: `${t.ts}-${Math.random()}`,
                  de: 'ele',
                  texto:
                    primeira || person.msgInteresse || 'Oi! Vamos conversar?',
                  ...t,
                },
              ],
            },
          ],
      interests: d.interests.filter((id) => id !== person.id),
    }));
  };

  const addInterest = (person) => {
    if (person.likedYou) {
      startChat(person);
      return 'match';
    }
    atualizarDados((d) => ({
      ...d,
      interests: d.interests.includes(person.id)
        ? d.interests
        : [...d.interests, person.id],
    }));
    return 'interesse';
  };

  const removeInterest = (personId) =>
    atualizarDados((d) => ({
      ...d,
      interests: d.interests.filter((id) => id !== personId),
    }));

  const acceptIncoming = (person) => startChat(person);

  const rejectIncoming = (personId) =>
    atualizarDados((d) => ({
      ...d,
      rejected: d.rejected.includes(personId)
        ? d.rejected
        : [...d.rejected, personId],
    }));

  const simulateAccept = (person) =>
    startChat(person, 'Aceitei seu interesse! Vamos conversar? 😊');

  const sendMessage = (personId, texto) => {
    const t = agora();
    atualizarDados((d) => ({
      ...d,
      chats: d.chats.map((c) =>
        c.personId === personId
          ? {
              ...c,
              mensagens: [
                ...c.mensagens,
                { id: `${t.ts}-${Math.random()}`, de: 'eu', texto, ...t },
              ],
            }
          : c
      ),
    }));
  };

  const markRead = (personId) =>
    atualizarDados((d) => ({
      ...d,
      chats: d.chats.map((c) =>
        c.personId === personId && c.naoLidas ? { ...c, naoLidas: 0 } : c
      ),
    }));

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
        sendMessage,
        markRead,
      }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);
