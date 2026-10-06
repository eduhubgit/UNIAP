import { MOCK_USERS } from '../data/mockUsers';
import { calcularCompatibilidade } from './compat';

export const buscarPessoa = (id) => MOCK_USERS.find((p) => p.id === id);

// quem tem AP vê só quem não tem; quem não tem vê só quem tem
export const ladoOposto = (eu) =>
  MOCK_USERS.filter((p) => (eu?.ap ? !p.ap : !!p.ap));

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
