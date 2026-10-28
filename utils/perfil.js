import { reais } from './format';

// converte o valor que cada pessoa pagaria em uma faixa de preço do app
export const faixaPorValor = (valor) => {
  if (valor <= 300) return 'ate300';
  if (valor <= 500) return '300a500';
  if (valor <= 800) return '500a800';
  if (valor <= 1200) return '800a1200';
  return 'acima1200';
};

// vagas do apartamento (SEM contar com o dono): total oferecido e quantas ainda estão livres
export const vagasInfo = (ap) => {
  const total = ap?.vagasTotal ?? ap?.vagas ?? 1;
  const livres = Math.max(0, Math.min(ap?.vagas ?? total, total));
  return { total, livres };
};

// divisão do aluguel. O dono sempre conta como uma pessoa da casa.
export const resumoAluguel = (ap) => {
  const { total, livres } = vagasInfo(ap);
  const ocupadas = total - livres;
  const aluguel = ap?.aluguel || 0;

  const moradoresHoje = 1 + ocupadas; // dono + quem já ocupou uma vaga
  const casaCheia = 1 + total; // dono + todas as vagas
  const comVoce = 2 + ocupadas; // dono + ocupantes + você

  return {
    total,
    livres,
    ocupadas,
    aluguel,
    moradoresHoje,
    casaCheia,
    comVoce,
    porPessoaHoje: aluguel / moradoresHoje,
    porPessoaCheia: aluguel / casaCheia,
    porPessoaComVoce: aluguel / comVoce,
  };
};

export const textoDivisao = (ap) => {
  const r = resumoAluguel(ap);
  return `Casa cheia (${r.casaCheia} pessoas): ${reais(r.porPessoaCheia)} cada • Hoje (${
    r.moradoresHoje
  } ${r.moradoresHoje === 1 ? 'pessoa' : 'pessoas'}): ${reais(r.porPessoaHoje)} cada`;
};

// deixa um usuário real com o mesmo formato das pessoas de teste
export const perfilDeUsuario = (u) => ({
  ...u,
  idade: u.idade || null,
  curso: u.curso || 'Estudante',
  online: false,
  sobre: u.sobre || '',
  observacoes: u.observacoes || '',
  horarios: u.horarios || [],
  preferencias: u.preferencias || [],
  ap: u.ap ? { ...u.ap, fotos: u.ap.fotos || [] } : null,
});