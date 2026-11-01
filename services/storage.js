import { decode } from 'base64-arraybuffer';
import { supabase } from '../lib/supabase';

const EXTENSOES = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/heic': 'heic',
  'image/heif': 'heif',
};

const ehDataUri = (valor) => typeof valor === 'string' && valor.startsWith('data:');

// Sobe uma foto (data URI/base64) para o bucket e devolve a URL pública.
// Se o valor já for uma URL (ou estiver vazio), devolve como está.
export async function publicarArquivo(valor, bucket) {
  if (!valor || !ehDataUri(valor)) return valor;

  const partes = /^data:([^;]+);base64,(.*)$/s.exec(valor);
  if (!partes) return valor;

  const [, mime, base64] = partes;
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error('Sessão expirada. Entre novamente.');

  const extensao = EXTENSOES[mime.toLowerCase()] || 'jpg';
  const caminho = `${user.id}/${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)}.${extensao}`;

  const { error } = await supabase.storage.from(bucket).upload(caminho, decode(base64), {
    contentType: mime,
    upsert: false,
  });

  if (error) throw error;

  const { data } = supabase.storage.from(bucket).getPublicUrl(caminho);
  return data.publicUrl;
}

export async function publicarArquivos(lista = [], bucket) {
  const saida = [];
  for (const item of lista) {
    saida.push(await publicarArquivo(item, bucket));
  }
  return saida;
}

// Traduz erros comuns do Supabase para uma mensagem amigável.
export function mensagemDeErro(erro) {
  const texto = `${erro?.message || erro || ''}`;

  if (/Invalid login credentials/i.test(texto)) return 'E-mail ou senha incorretos.';
  if (/User already registered/i.test(texto)) return 'Já existe uma conta com esse e-mail.';
  if (/Password should be at least/i.test(texto)) return 'A senha deve ter pelo menos 6 caracteres.';
  if (/Email not confirmed/i.test(texto)) return 'Confirme seu e-mail antes de entrar.';
  if (/sem vagas/i.test(texto)) return 'Todas as suas vagas já estão ocupadas.';
  if (/JWT|not authenticated|nao autenticado/i.test(texto)) return 'Sua sessão expirou. Entre novamente.';

  return texto || 'Não foi possível concluir a ação.';
}
