import { MOCK_USERS } from '../data/mockUsers';
import { calcularCompatibilidade } from './compat';

// Registro em memória com todos os perfis visíveis (banco + mocks locais).
// O AppContext atualiza esta lista sempre que carrega os dados.
let REGISTRO = [...MOCK_USERS];

export const registrarPessoas = (lista = []) => {
  const temMocksNoBanco = lista.some((p) => p.isMock);

  // Se o banco já tem os perfis de demonstração, não duplica os mocks locais.
  REGISTRO = temMocksNoBanco ? [...lista] : [...lista, ...MOCK_USERS];
};

export const buscarPessoa = (id) => REGISTRO.find((p) => p.id === id);

// quem tem AP vê só quem não tem; quem não tem vê só quem tem
export const ladoOposto = (eu) =>
  REGISTRO.filter((p) => (eu?.ap ? !p.ap : !!p.ap));

export const comScore = (p, eu) => ({
  ...p,
  score: calcularCompatibilidade(eu || {}, p),
});

// pessoas que se interessaram por você e ainda não foram aceitas nem recusadas
export const recebidosPendentes = (eu, rejected, chats) =>
  ladoOposto(eu).filter(
    (p) =>
      p.likedYou &&
      !rejected.includes(p.id) &&
      !chats.some((c) => c.personId === p.id)
  );
