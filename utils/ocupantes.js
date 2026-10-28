import { MOCK_OCUPANTES } from '../data/mockOcupantes';
import { buscarPessoa } from './people';

// procura uma pessoa entre as pessoas de teste e os moradores de teste
export const buscarPerfil = (id) =>
  buscarPessoa(id) || MOCK_OCUPANTES.find((o) => o.id === id);