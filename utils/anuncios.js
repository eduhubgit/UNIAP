// tira acentos e deixa minúsculo (para a busca ignorar acentos)
export const normalizar = (texto) =>
  (texto || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

// "Há 2 dias", "Há 1 semana"...
export function tempoDecorrido(ts) {
  const min = Math.floor((Date.now() - ts) / 60000);
  if (min < 60) return 'Agora há pouco';
  const horas = Math.floor(min / 60);
  if (horas < 24) return `Há ${horas} h`;
  const dias = Math.floor(horas / 24);
  if (dias < 7) return `Há ${dias} ${dias === 1 ? 'dia' : 'dias'}`;
  const semanas = Math.floor(dias / 7);
  if (semanas < 5) return `Há ${semanas} ${semanas === 1 ? 'semana' : 'semanas'}`;
  const meses = Math.floor(dias / 30);
  return `Há ${meses} ${meses === 1 ? 'mês' : 'meses'}`;
}