import { Platform } from 'react-native';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { supabase } from '../lib/supabase';

// Extrai os tokens que o Supabase devolve no retorno do OAuth
// (ficam depois de "#" na URL).
function lerRetorno(url) {
  const bruto = url.includes('#') ? url.split('#')[1] : url.split('?')[1] || '';
  const params = new URLSearchParams(bruto);

  return {
    access_token: params.get('access_token'),
    refresh_token: params.get('refresh_token'),
    error: params.get('error_description') || params.get('error'),
  };
}

// Abre o fluxo de login do GitHub.
// - Web: redireciona a página; o cliente do Supabase lê a sessão no retorno
//   (detectSessionInUrl).
// - Celular: abre o navegador e devolve para o app pelo scheme "uniap".
export async function abrirLoginGitHub() {
  if (Platform.OS === 'web') {
    const redirectTo = `${window.location.origin}${window.location.pathname}`;

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: { redirectTo },
    });

    if (error) throw error;
    return { status: 'redirecionando' };
  }

  const redirectTo = Linking.createURL('auth-callback');

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'github',
    options: { redirectTo, skipBrowserRedirect: true },
  });

  if (error) throw error;

  const resultado = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);

  if (resultado.type !== 'success') {
    return { status: resultado.type === 'cancel' ? 'cancelado' : 'erro' };
  }

  const { access_token, refresh_token, error: erroUrl } = lerRetorno(resultado.url);

  if (erroUrl) throw new Error(erroUrl);
  if (!access_token || !refresh_token) {
    throw new Error('O GitHub não devolveu uma sessão válida.');
  }

  const { error: erroSessao } = await supabase.auth.setSession({
    access_token,
    refresh_token,
  });

  if (erroSessao) throw erroSessao;

  return { status: 'ok' };
}
