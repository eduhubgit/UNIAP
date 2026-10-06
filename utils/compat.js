import { FAIXAS_PRECO } from '../data/options';

// fração de itens em comum, em relação à menor das duas listas
const sobreposicao = (a = [], b = []) => {
  if (!a.length || !b.length) return 0;
  const emComum = a.filter((x) => b.includes(x)).length;
  return emComum / Math.min(a.length, b.length);
};

// 1 = mesma faixa, diminui conforme as faixas se afastam
const scoreFaixa = (a, b) => {
  const i = FAIXAS_PRECO.findIndex((f) => f.id === a);
  const j = FAIXAS_PRECO.findIndex((f) => f.id === b);
  if (i < 0 || j < 0) return 0;
  return 1 - Math.abs(i - j) / (FAIXAS_PRECO.length - 1);
};

export function calcularCompatibilidade(eu, outro) {
  const pref = sobreposicao(eu.preferencias, outro.preferencias);
  const hor = sobreposicao(eu.horarios, outro.horarios);
  const preco = scoreFaixa(eu.faixa, outro.faixa);
  return Math.round((pref * 0.5 + hor * 0.25 + preco * 0.25) * 100);
}