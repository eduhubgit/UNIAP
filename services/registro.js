import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';
import { publicarArquivo, publicarArquivos } from './storage';
import { apParaLinha } from './dados';

export const chavePendente = (uid) => `uniap:pendente:${uid}`;

// Cria o perfil + dados privados + apartamento de um usuário recém-cadastrado.
export async function criarPerfilCompleto(uid, dados) {
  let foto = null;
  try {
    foto = await publicarArquivo(dados.foto, 'avatars');
  } catch (e) {
    console.warn('Não foi possível enviar a foto de perfil:', e.message);
  }

  let ap = dados.ap || null;
  if (ap) {
    let fotos = ap.fotos || [];
    try {
      fotos = await publicarArquivos(fotos, 'apartamentos');
    } catch (e) {
      console.warn('Não foi possível enviar as fotos do apartamento:', e.message);
    }
    ap = { ...ap, fotos };
  }

  const { error: erroPerfil } = await supabase.from('profiles').insert({
    id: uid,
    nome: dados.nome,
    idade: dados.idade ?? null,
    cidade: dados.cidade || '',
    curso: dados.curso || 'Estudante',
    foto,
    sobre: dados.sobre || '',
    observacoes: dados.observacoes || '',
    horarios: dados.horarios || [],
    preferencias: dados.preferencias || [],
    faixa: dados.faixa || null,
    tem_ap: !!ap,
  });

  if (erroPerfil) throw erroPerfil;

  const { error: erroPrivado } = await supabase.from('profiles_private').insert({
    id: uid,
    matricula: dados.matricula || '',
    telefone: dados.telefone || '',
    email: dados.email || '',
    cpf: dados.cpf || '',
  });

  if (erroPrivado) throw erroPrivado;

  if (ap) {
    const { error: erroAp } = await supabase
      .from('apartments')
      .insert({ user_id: uid, ...apParaLinha(ap) });

    if (erroAp) throw erroAp;
  }
}

// Se a pessoa confirmou o e-mail depois do cadastro, o perfil fica guardado
// no aparelho e é criado no primeiro login com sessão.
export async function garantirPerfil(uid, email) {
  const { data, error } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', uid)
    .maybeSingle();

  if (error) throw error;
  if (data) return;

  const bruto = await AsyncStorage.getItem(chavePendente(uid));
  if (!bruto) return;

  try {
    await criarPerfilCompleto(uid, { ...JSON.parse(bruto), email });
  } catch (e) {
    // Se outro aparelho já criou o perfil ao mesmo tempo, não é erro.
    if (e?.code !== '23505') throw e;
  }

  await AsyncStorage.removeItem(chavePendente(uid));
}
