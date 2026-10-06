import { HORARIOS, PREFERENCIAS, FAIXAS_PRECO } from '../data/options';

export const labelPref = (id) =>
  PREFERENCIAS.find((p) => p.id === id)?.label || id;
export const labelHorario = (id) =>
  HORARIOS.find((h) => h.id === id)?.label || id;
export const labelFaixa = (id) =>
  FAIXAS_PRECO.find((f) => f.id === id)?.label || '—';

export const DESPESAS_LABEL = {
  agua: 'Água',
  luz: 'Luz',
  internet: 'Internet',
  condominio: 'Condomínio',
  gas: 'Gás',
};

// 1200 -> "R$ 1.200,00"
export const reais = (n) =>
  'R$ ' +
  Number(n || 0)
    .toFixed(2)
    .replace('.', ',')
    .replace(/\B(?=(\d{3})+(?!\d))/g, '.');
