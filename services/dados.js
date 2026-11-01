import { supabase } from '../lib/supabase';

// ---------------------------------------------------------------------------
// Conversões banco -> formato usado pelas telas
// ---------------------------------------------------------------------------

export const horaDe = (iso) => {
  const d = new Date(iso);
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
};

export const apParaApp = (ap) =>
  ap
    ? {
        vagasTotal: ap.vagas_total,
        vagas: ap.vagas,
        endereco: ap.endereco,
        bairro: ap.bairro,
        cidade: ap.cidade,
        referencia: ap.referencia,
        aluguel: Number(ap.aluguel) || 0,
        despesas: ap.despesas || {},
        outras: ap.outras || '',
        adendos: ap.adendos || '',
        fotos: ap.fotos || [],
        docNome: ap.doc_nome || null,
      }
    : null;

export const apParaLinha = (ap) => ({
  endereco: ap.endereco || '',
  bairro: ap.bairro || '',
  cidade: ap.cidade || '',
  referencia: ap.referencia || '',
  aluguel: Number(ap.aluguel) || 0,
  vagas_total: Number(ap.vagasTotal ?? ap.vagas ?? 1),
  vagas: Number(ap.vagas ?? ap.vagasTotal ?? 1),
  despesas: ap.despesas || {},
  outras: ap.outras || '',
  adendos: ap.adendos || '',
  fotos: ap.fotos || [],
  doc_nome: ap.docNome || null,
});

export const usuarioParaApp = ({ perfil, ap, privado, curtida }) => ({
  id: perfil.id,
  nome: perfil.nome,
  idade: perfil.idade,
  cidade: perfil.cidade,
  curso: perfil.curso,
  foto: perfil.foto,
  sobre: perfil.sobre || '',
  observacoes: perfil.observacoes || '',
  horarios: perfil.horarios || [],
  preferencias: perfil.preferencias || [],
  faixa: perfil.faixa,
  temAp: !!perfil.tem_ap,
  online: !!perfil.online,
  isMock: !!perfil.is_mock,
  likedYou: !!curtida,
  msgInteresse: curtida?.mensagem || undefined,
  ap: apParaApp(ap),
  ...(privado
    ? {
        matricula: privado.matricula || '',
        telefone: privado.telefone || '',
        cpf: privado.cpf || '',
        email: privado.email || '',
      }
    : {}),
});

export const mensagemParaApp = (m, uid) => ({
  id: m.id,
  de: m.sender === uid ? 'eu' : 'ele',
  texto: m.texto || '',
  tipo: m.tipo || 'texto',
  ocupantes: m.ocupantes || [],
  ts: new Date(m.criado_em).getTime(),
  hora: horaDe(m.criado_em),
});

export const chatParaApp = (chat, uid, mensagens) => {
  const souA = chat.user_a === uid;
  const outro = souA ? chat.user_b : chat.user_a;

  return {
    id: chat.id,
    personId: outro,
    naoLidas: souA ? chat.nao_lidas_a : chat.nao_lidas_b,
    vagaOcupada: !!chat.vaga_ocupada,
    aceitoNaVaga: !!chat.vaga_ocupada,
    produto: chat.produto || null,
    mensagens,
  };
};

// ---------------------------------------------------------------------------
// Leituras
// ---------------------------------------------------------------------------

export async function carregarMundo(uid, emailAuth) {
  const [perfis, apartamentos, interesses, recusas, privado] = await Promise.all([
    supabase.from('profiles').select('*').order('nome'),
    supabase.from('apartments').select('*'),
    supabase
      .from('interests')
      .select('*')
      .or(`from_user.eq.${uid},to_user.eq.${uid}`),
    supabase.from('rejections').select('*').eq('from_user', uid),
    supabase.from('profiles_private').select('*').eq('id', uid).maybeSingle(),
  ]);

  const erro =
    perfis.error || apartamentos.error || interesses.error || recusas.error || privado.error;
  if (erro) throw erro;

  const mapaAps = new Map((apartamentos.data || []).map((ap) => [ap.user_id, ap]));

  const recebidas = new Map();
  const enviadas = [];
  (interesses.data || []).forEach((i) => {
    if (i.to_user === uid) recebidas.set(i.from_user, i);
    if (i.from_user === uid) enviadas.push(i.to_user);
  });

  const users = (perfis.data || []).map((perfil) =>
    usuarioParaApp({
      perfil,
      ap: mapaAps.get(perfil.id),
      privado: perfil.id === uid ? privado.data || { email: emailAuth } : null,
      curtida: recebidas.get(perfil.id),
    })
  );

  const currentUser =
    users.find((u) => u.id === uid) || null;

  if (currentUser && !currentUser.email) {
    currentUser.email = emailAuth || '';
  }

  return {
    users,
    currentUser,
    interests: enviadas,
    rejected: (recusas.data || []).map((r) => r.to_user),
    settings: {
      notificacoes: privado.data?.notificacoes ?? true,
      perfilVisivel: privado.data?.perfil_visivel ?? true,
    },
  };
}

export async function carregarChats(uid) {
  const { data: chats, error } = await supabase
    .from('chats')
    .select('*')
    .or(`user_a.eq.${uid},user_b.eq.${uid}`);

  if (error) throw error;
  if (!chats || chats.length === 0) return [];

  const ids = chats.map((c) => c.id);
  const { data: mensagens, error: erroMsgs } = await supabase
    .from('messages')
    .select('*')
    .in('chat_id', ids)
    .order('criado_em', { ascending: true });

  if (erroMsgs) throw erroMsgs;

  const porChat = new Map();
  (mensagens || []).forEach((m) => {
    if (!porChat.has(m.chat_id)) porChat.set(m.chat_id, []);
    porChat.get(m.chat_id).push(mensagemParaApp(m, uid));
  });

  return chats.map((chat) => chatParaApp(chat, uid, porChat.get(chat.id) || []));
}

export async function carregarAnuncios() {
  const { data, error } = await supabase
    .from('ads')
    .select('*')
    .order('criado_em', { ascending: false });

  if (error) throw error;

  const vendedores = [...new Set((data || []).map((a) => a.vendedor))];
  const { data: perfis, error: erroPerfis } = vendedores.length
    ? await supabase.from('profiles').select('id,nome,foto,curso,is_mock').in('id', vendedores)
    : { data: [], error: null };

  if (erroPerfis) throw erroPerfis;

  const mapa = new Map((perfis || []).map((p) => [p.id, p]));

  return (data || []).map((a) => {
    const vendedor = mapa.get(a.vendedor);
    return {
      id: a.id,
      criadoEm: new Date(a.criado_em).getTime(),
      cidade: a.cidade,
      vendedor: {
        id: a.vendedor,
        nome: vendedor?.nome || 'Estudante',
        foto: vendedor?.foto || null,
        subtitulo: vendedor?.curso || 'Estudante',
        mock: !!vendedor?.is_mock,
      },
      titulo: a.titulo,
      categoria: a.categoria,
      condicao: a.condicao,
      preco: Number(a.preco) || 0,
      emoji: a.emoji || '',
      descricao: a.descricao || '',
      detalhes: a.detalhes || '',
      fotos: a.fotos || [],
    };
  });
}

export async function carregarFavoritos(uid) {
  const { data, error } = await supabase
    .from('favorites')
    .select('ad_id')
    .eq('user_id', uid);

  if (error) throw error;
  return (data || []).map((f) => f.ad_id);
}
