import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase, supabaseConfigurado } from '../lib/supabase';
import { carregarMundo, carregarChats, apParaLinha } from '../services/dados';
import { criarPerfilCompleto, garantirPerfil, chavePendente } from '../services/registro';
import { mensagemDeErro, publicarArquivo, publicarArquivos } from '../services/storage';
import { abrirLoginGitHub } from '../services/oauth';
import { mostrarAlerta } from '../utils/alerta';
import { faixaPorValor, vagasInfo } from '../utils/perfil';
import { registrarPessoas } from '../utils/people';

const AppContext = createContext();

export function AppProvider({ children }) {
  const [carregado, setCarregado] = useState(false);
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [interests, setInterests] = useState([]);
  const [rejected, setRejected] = useState([]);
  const [chats, setChats] = useState([]);
  const [settings, setSettings] = useState({ notificacoes: true, perfilVisivel: true });
  const [draft, setDraft] = useState({});
  const [avisoDispensado, setAvisoDispensado] = useState(false);
  // Conta criada pelo GitHub que ainda não tem perfil no banco.
  const [oauthPendente, setOauthPendente] = useState(null);

  const uidRef = useRef(null);
  const emailRef = useRef('');
  const recarregandoRef = useRef(false);
  const registrandoRef = useRef(false);
  const entrandoRef = useRef(false);

  // ---------- CARREGAR DADOS ----------
  const carregarUsuario = useCallback(async (sessaoUser) => {
    if (!sessaoUser?.id) return;

    uidRef.current = sessaoUser.id;
    emailRef.current = sessaoUser.email || '';

    await garantirPerfil(sessaoUser.id, sessaoUser.email);

    const [mundo, listaChats] = await Promise.all([
      carregarMundo(sessaoUser.id, sessaoUser.email),
      carregarChats(sessaoUser.id),
    ]);

    setUsers(mundo.users);
    setCurrentUser(mundo.currentUser);
    setInterests(mundo.interests);
    setRejected(mundo.rejected);
    setSettings(mundo.settings);
    setChats(listaChats);
    registrarPessoas(mundo.users);

    // Login pelo GitHub sem perfil: a pessoa precisa concluir o cadastro.
    if (mundo.currentUser) {
      setOauthPendente(null);
    } else if (sessaoUser.app_metadata?.provider === 'github') {
      setOauthPendente({
        id: sessaoUser.id,
        email: sessaoUser.email || '',
        nome:
          sessaoUser.user_metadata?.full_name ||
          sessaoUser.user_metadata?.name ||
          sessaoUser.user_metadata?.user_name ||
          '',
      });
    }

    return mundo.currentUser;
  }, []);

  const limparEstado = useCallback(() => {
    uidRef.current = null;
    emailRef.current = '';
    setUsers([]);
    setCurrentUser(null);
    setInterests([]);
    setRejected([]);
    setChats([]);
    setSettings({ notificacoes: true, perfilVisivel: true });
    setDraft({});
    setAvisoDispensado(false);
    setOauthPendente(null);
    registrarPessoas([]);
  }, []);

  const recarregar = useCallback(async () => {
    const uid = uidRef.current;
    if (!uid || recarregandoRef.current) return;

    recarregandoRef.current = true;
    try {
      const [mundo, listaChats] = await Promise.all([
        carregarMundo(uid, emailRef.current),
        carregarChats(uid),
      ]);

      setUsers(mundo.users);
      setCurrentUser(mundo.currentUser);
      setInterests(mundo.interests);
      setRejected(mundo.rejected);
      setSettings(mundo.settings);
      setChats(listaChats);
      registrarPessoas(mundo.users);
    } finally {
      recarregandoRef.current = false;
    }
  }, []);

  // ---------- SESSÃO ----------
  useEffect(() => {
    if (!supabaseConfigurado) {
      setCarregado(true);
      return undefined;
    }

    let ativo = true;

    const { data: assinatura } = supabase.auth.onAuthStateChange((evento, sessao) => {
      if (!ativo) return;

      if (evento === 'SIGNED_OUT') {
        limparEstado();
        setCarregado(true);
        return;
      }

      // INITIAL_SESSION é tratado pelo getSession abaixo (evita carregar 2x).
      if (evento === 'INITIAL_SESSION' || !sessao?.user) return;

      // Durante o cadastro/login, a própria ação cria o perfil e carrega os
      // dados. Evita uma corrida que deixaria a conta "sem perfil" ou duplicada.
      if (registrandoRef.current || entrandoRef.current) return;

      // Fora do callback para não travar o cliente do Supabase.
      setTimeout(async () => {
        try {
          await carregarUsuario(sessao.user);
        } catch (e) {
          console.warn('Erro ao carregar sessão:', e);
        } finally {
          if (ativo) setCarregado(true);
        }
      }, 0);
    });

    (async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session?.user) await carregarUsuario(session.user);
      } catch (e) {
        console.warn('Erro ao restaurar sessão:', e);
      } finally {
        if (ativo) setCarregado(true);
      }
    })();

    return () => {
      ativo = false;
      assinatura.subscription.unsubscribe();
    };
  }, [carregarUsuario, limparEstado]);

  // ---------- TEMPO REAL ----------
  useEffect(() => {
    const uid = currentUser?.id;
    if (!uid) return undefined;

    let timer = null;
    const agendar = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        recarregar().catch((e) => console.warn('Erro ao atualizar:', e));
      }, 250);
    };

    const canal = supabase
      .channel(`uniap-${uid}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'chats' }, agendar)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, agendar)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'interests' }, agendar)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, agendar)
      .subscribe();

    return () => {
      if (timer) clearTimeout(timer);
      supabase.removeChannel(canal);
    };
  }, [currentUser?.id, recarregar]);

  // ---------- BLOQUEIO DE MATCH E INTERESSADOS ----------
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

  const finishRegister = async (extra = {}) => {
    // "apStep1" é só rascunho (as fotos já vão dentro de "ap")
    const { apStep1, ...dados } = draft;
    const email = (dados.email || '').trim();
    const senha = dados.senha || '';

    registrandoRef.current = true;

    try {
      let usuario;
      let temSessao = false;

      if (oauthPendente) {
        // Veio do GitHub: a conta já existe, só falta o perfil.
        const {
          data: { user },
          error,
        } = await supabase.auth.getUser();
        if (error) throw new Error(mensagemDeErro(error));
        if (!user) throw new Error('Sua sessão do GitHub expirou. Entre novamente.');

        usuario = user;
        temSessao = true;
      } else {
        const { data, error } = await supabase.auth.signUp({ email, password: senha });
        if (error) throw new Error(mensagemDeErro(error));

        usuario = data.user;
        if (!usuario) throw new Error('Não foi possível criar a conta.');
        temSessao = !!data.session;
      }

      const payload = {
        nome: dados.nome,
        idade: null,
        cidade: dados.cidade,
        curso: 'Estudante',
        foto: dados.foto,
        sobre: extra.sobre,
        observacoes: extra.observacoes,
        horarios: extra.horarios,
        preferencias: extra.preferencias,
        faixa: extra.faixa ?? null,
        ap: extra.ap || null,
        matricula: dados.matricula,
        telefone: dados.telefone,
        cpf: dados.cpf,
        email,
      };

      // Confirmação de e-mail ligada: guarda o cadastro para terminar no 1º login.
      if (!temSessao) {
        await AsyncStorage.setItem(chavePendente(usuario.id), JSON.stringify(payload));
        setDraft({});
        return { pendente: true };
      }

      await criarPerfilCompleto(usuario.id, payload);
      setDraft({});
      await carregarUsuario(usuario);
      setOauthPendente(null);

      return { pendente: false, user: usuario };
    } finally {
      registrandoRef.current = false;
    }
  };

  // Login pelo GitHub (web redireciona; celular abre o navegador).
  const entrarComGitHub = async () => {
    entrandoRef.current = true;

    try {
      const resultado = await abrirLoginGitHub();

      if (resultado.status === 'cancelado') return { ok: false, motivo: 'cancelado' };
      if (resultado.status === 'redirecionando') return { ok: true, redirecionando: true };
      if (resultado.status !== 'ok') {
        return { ok: false, motivo: 'erro' };
      }

      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();
      if (error) throw new Error(mensagemDeErro(error));
      if (!user) throw new Error('Não foi possível obter a conta do GitHub.');

      const perfil = await carregarUsuario(user);

      if (!perfil) return { ok: true, precisaPerfil: true };

      setAvisoDispensado(false);
      return { ok: true };
    } catch (e) {
      mostrarAlerta('Erro', mensagemDeErro(e));
      return { ok: false, motivo: 'erro' };
    } finally {
      entrandoRef.current = false;
    }
  };

  const login = async (email, senha) => {
    entrandoRef.current = true;

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: senha,
      });

      if (error) {
        mostrarAlerta('Erro', mensagemDeErro(error));
        return false;
      }

      const perfil = await carregarUsuario(data.user);

      if (!perfil) {
        mostrarAlerta(
          'Perfil não encontrado',
          'Sua conta existe, mas o perfil não foi concluído. Crie a conta novamente ou fale com o suporte.'
        );
        await supabase.auth.signOut();
        return false;
      }

      setAvisoDispensado(false);
      return true;
    } catch (e) {
      mostrarAlerta('Erro', mensagemDeErro(e));
      await supabase.auth.signOut().catch(() => {});
      return false;
    } finally {
      entrandoRef.current = false;
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.warn('Erro ao sair:', e);
    }
    limparEstado();
  };

  const emailExists = async (email, ignoreId) => {
    if (ignoreId && currentUser?.email?.toLowerCase() === email.trim().toLowerCase()) {
      return false;
    }
    const { data, error } = await supabase.rpc('email_ja_existe', {
      p_email: email.trim(),
    });
    if (error) {
      console.warn('Erro ao verificar e-mail:', error.message);
      return false;
    }
    return !!data;
  };

  const updateProfile = async (data) => {
    const uid = currentUser?.id;
    if (!uid) return;

    try {
      if (data.senha) {
        const { error } = await supabase.auth.updateUser({ password: data.senha });
        if (error) throw error;
      }

      if (data.email && data.email.trim() !== currentUser.email) {
        const { error } = await supabase.auth.updateUser({ email: data.email.trim() });
        if (error) throw error;
      }

      let foto = data.foto;
      if (foto) foto = await publicarArquivo(foto, 'avatars');

      const campos = {};
      ['nome', 'idade', 'cidade', 'curso', 'sobre', 'observacoes', 'horarios', 'preferencias', 'faixa'].forEach(
        (k) => {
          if (data[k] !== undefined) campos[k] = data[k];
        }
      );
      if (foto !== undefined) campos.foto = foto;

      let ap = data.ap;
      if (ap) {
        const fotos = await publicarArquivos(ap.fotos || [], 'apartamentos');
        ap = { ...ap, fotos };
        if (!currentUser.temAp) campos.tem_ap = true;
      }

      if (Object.keys(campos).length) {
        const { error } = await supabase.from('profiles').update(campos).eq('id', uid);
        if (error) throw error;
      }

      const privado = {};
      ['matricula', 'telefone', 'cpf', 'email'].forEach((k) => {
        if (data[k] !== undefined) privado[k] = data[k];
      });

      if (Object.keys(privado).length) {
        const { error } = await supabase
          .from('profiles_private')
          .update(privado)
          .eq('id', uid);
        if (error) throw error;
      }

      if (ap) {
        const { error } = await supabase
          .from('apartments')
          .upsert({ user_id: uid, ...apParaLinha(ap) }, { onConflict: 'user_id' });
        if (error) throw error;

        if (data.faixa === undefined) {
          const total = Number(ap.vagasTotal ?? ap.vagas ?? 1);
          const faixa = faixaPorValor((Number(ap.aluguel) || 0) / (total + 1));
          await supabase.from('profiles').update({ faixa }).eq('id', uid);
        }
      }

      await recarregar();
    } catch (e) {
      mostrarAlerta('Erro', mensagemDeErro(e));
    }
  };

  // quem não tinha apartamento passa a ter (sem refazer o cadastro)
  const converterParaAp = async (ap) => {
    const uid = currentUser?.id;
    if (!uid) return;

    const { total } = vagasInfo(ap);
    const faixa = faixaPorValor((Number(ap.aluguel) || 0) / (total + 1));

    await updateProfile({ ap, faixa });

    await Promise.all([
      supabase.from('interests').delete().eq('from_user', uid),
      supabase.from('rejections').delete().eq('from_user', uid),
    ]);

    await recarregar();
  };

  const updateSettings = (data) => {
    setSettings((prev) => ({ ...prev, ...data }));

    const uid = currentUser?.id;
    if (!uid) return;

    const campos = {};
    if (data.notificacoes !== undefined) campos.notificacoes = data.notificacoes;
    if (data.perfilVisivel !== undefined) campos.perfil_visivel = data.perfilVisivel;

    if (Object.keys(campos).length) {
      supabase
        .from('profiles_private')
        .update(campos)
        .eq('id', uid)
        .then(({ error }) => {
          if (error) console.warn('Erro ao salvar preferências:', error.message);
        });
    }
  };

  const deleteAccount = async () => {
    const { error } = await supabase.rpc('excluir_minha_conta');
    if (error) {
      mostrarAlerta('Erro', mensagemDeErro(error));
      return;
    }

    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.warn('Erro ao sair:', e);
    }
    limparEstado();
  };

  // Limpa apenas os dados locais do aparelho (o banco fica intacto).
  const limparTudo = async () => {
    try {
      const chaves = await AsyncStorage.getAllKeys();
      const doApp = chaves.filter((k) => k.startsWith('uniap:'));
      if (doApp.length) await AsyncStorage.multiRemove(doApp);
    } catch (e) {
      console.warn('Erro ao limpar dados locais:', e);
    }

    await logout();
  };

  // ---------- INTERESSES E CHATS ----------
  const obterChat = (personId) => chats.find((c) => c.personId === personId);

  const startChat = async (person, primeira, extra = {}) => {
    const { data, error } = await supabase.rpc('iniciar_chat', {
      p_other: person.id,
      p_texto: primeira || null,
      p_produto: extra.anuncio || null,
    });

    if (error) {
      mostrarAlerta('Erro', mensagemDeErro(error));
      return null;
    }

    await recarregar();
    return data;
  };

  const addInterest = async (person) => {
    const { data, error } = await supabase.rpc('criar_interesse', {
      p_to: person.id,
    });

    if (error) {
      mostrarAlerta('Erro', mensagemDeErro(error));
      return 'erro';
    }

    if (data === 'match') {
      await recarregar();
      return 'match';
    }

    setInterests((prev) => (prev.includes(person.id) ? prev : [...prev, person.id]));
    return 'interesse';
  };

  const removeInterest = async (personId) => {
    setInterests((prev) => prev.filter((id) => id !== personId));
    const { error } = await supabase.rpc('desfazer_interesse', { p_to: personId });
    if (error) mostrarAlerta('Erro', mensagemDeErro(error));
  };

  const acceptIncoming = async (person) => {
    const { error } = await supabase.rpc('aceitar_interesse', { p_from: person.id });
    if (error) {
      mostrarAlerta('Erro', mensagemDeErro(error));
      return;
    }
    await recarregar();
  };

  const rejectIncoming = async (personId) => {
    setRejected((prev) => (prev.includes(personId) ? prev : [...prev, personId]));
    const { error } = await supabase.rpc('recusar_interesse', { p_from: personId });
    if (error) mostrarAlerta('Erro', mensagemDeErro(error));
  };

  // Área de demonstração: simula o aceite de um perfil de teste.
  const simulateAccept = async (person) => {
    const { error } = await supabase.rpc('simular_aceite', { p_person: person.id });
    if (error) {
      mostrarAlerta('Erro', mensagemDeErro(error));
      return;
    }
    await recarregar();
  };

  const sendMessage = async (personId, texto, extra = {}) => {
    const chat = obterChat(personId);
    if (!chat) return;

    const { error } = await supabase.rpc('enviar_mensagem', {
      p_chat: chat.id,
      p_texto: texto,
      p_tipo: extra.tipo || 'texto',
      p_ocupantes: extra.ocupantes || [],
    });

    if (error) {
      mostrarAlerta('Erro', mensagemDeErro(error));
      return;
    }

    await recarregar();
  };

  const markRead = async (personId) => {
    const chat = obterChat(personId);
    if (!chat || !chat.naoLidas) return;

    setChats((prev) =>
      prev.map((c) => (c.personId === personId ? { ...c, naoLidas: 0 } : c))
    );

    const { error } = await supabase.rpc('marcar_lidas', { p_chat: chat.id });
    if (error) console.warn('Erro ao marcar como lida:', error.message);
  };

  // "Vaga ocupada?" no chat de quem tem apartamento: ocupa ou libera uma vaga
  const alternarVagaOcupada = async (personId) => {
    const chat = obterChat(personId);
    if (!chat) return { ok: false, motivo: 'sem-chat' };
    if (!currentUser?.ap) return { ok: false, motivo: 'sem-ap' };

    const { data, error } = await supabase.rpc('alternar_vaga', { p_chat: chat.id });

    if (error) {
      const semVagas = /sem vagas/i.test(error.message || '');
      return { ok: false, motivo: semVagas ? 'sem-vagas' : 'erro' };
    }

    await recarregar();
    return { ok: true, ocupada: !!data };
  };

  // O aceite agora é controlado pelo dono do apartamento (via "Vaga ocupada?").
  const alternarAceitoNaVaga = async () => {};

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
        entrarComGitHub,
        oauthPendente,
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
