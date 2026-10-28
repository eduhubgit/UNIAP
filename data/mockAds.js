import { MOCK_USERS } from './mockUsers';

const DIA = 24 * 60 * 60 * 1000;
const agora = Date.now();

const vendedor = (id) => {
  const p = MOCK_USERS.find((u) => u.id === id);
  return { id: p.id, nome: p.nome, foto: p.foto, subtitulo: p.curso, mock: true };
};

const criar = (id, dias, vendedorId, dados) => ({
  id,
  criadoEm: agora - dias * DIA,
  cidade: 'Quixadá - CE',
  vendedor: vendedor(vendedorId),
  ...dados,
});

export const ANUNCIOS_MOCK = [
  criar('a1', 2, 'm1', {
    titulo: 'Geladeira Consul 340L',
    categoria: 'eletrodomesticos',
    condicao: 'Usado',
    preco: 1200,
    emoji: '🧊',
    descricao:
      'Geladeira em ótimo estado, funcionando perfeitamente. Ideal para quem mora sozinho ou divide apartamento.',
    detalhes:
      'Geladeira Consul 340L, cor inox, frost free, 2 portas. Comprei há 2 anos e estou me mudando, por isso estou vendendo. Funciona perfeitamente, sem barulhos e sem vazamentos. Retirada no Centro de Quixadá. Aceito Pix.',
  }),
  criar('a2', 3, 'm3', {
    titulo: 'Mesa de estudo',
    categoria: 'moveis',
    condicao: 'Usado',
    preco: 250,
    emoji: '📚',
    descricao: 'Mesa de madeira com cadeira. Perfeita para estudos e trabalho. Super conservada!',
    detalhes:
      'Mesa de madeira com 1,20 m de largura e uma gaveta, acompanhada de cadeira estofada preta. Bem conservada, sem riscos fundos. Ideal para quarto de estudante. Retirada no Planalto Universitário.',
  }),
  criar('a3', 4, 'm5', {
    titulo: 'Cama de casal + colchão',
    categoria: 'moveis',
    condicao: 'Seminovo',
    preco: 450,
    emoji: '🛏️',
    descricao: 'Cama de casal com colchão incluso. Usada por apenas 6 meses. Ótima qualidade!',
    detalhes:
      'Cama de casal (138 cm) com colchão de espuma incluso. Usada por apenas 6 meses, sem manchas. Desmontável, fácil de transportar. Retirada no Campo Velho.',
  }),
  criar('a4', 7, 'm4', {
    titulo: 'Bicicleta aro 29',
    categoria: 'outros',
    condicao: 'Usado',
    preco: 600,
    emoji: '🚲',
    descricao: 'Bicicleta em ótimo estado, revisada recentemente. Ideal para o dia a dia ou lazer.',
    detalhes:
      'Bicicleta aro 29 com 21 marchas, freios a disco e quadro de alumínio. Revisada recentemente (troca de pneus e corrente). Acompanha cadeado. Pode testar antes de comprar.',
  }),
  criar('a5', 7, 'm2', {
    titulo: 'Micro-ondas Philco 20L',
    categoria: 'eletrodomesticos',
    condicao: 'Usado',
    preco: 280,
    emoji: '🍽️',
    descricao: 'Micro-ondas funcionando perfeitamente. Marca: Philco. 20L.',
    detalhes:
      'Micro-ondas Philco de 20 litros, 220V, com prato giratório incluso. Funciona perfeitamente e esquenta rápido. Vendo porque ganhei outro de presente.',
  }),
  criar('a6', 1, 'm6', {
    titulo: 'Notebook Dell Inspiron i5',
    categoria: 'eletronicos',
    condicao: 'Usado',
    preco: 1900,
    emoji: '💻',
    descricao: 'Core i5, 8GB de RAM e SSD de 256GB. Ótimo para estudar e programar.',
    detalhes:
      'Notebook Dell Inspiron com Core i5 de 10ª geração, 8 GB de RAM, SSD de 256 GB e tela de 15,6". A bateria dura cerca de 4 horas. Acompanha o carregador original. Perfeito para os trabalhos da faculdade.',
  }),
  criar('a7', 5, 'm9', {
    titulo: 'Fone Bluetooth com cancelamento de ruído',
    categoria: 'eletronicos',
    condicao: 'Seminovo',
    preco: 90,
    emoji: '🎧',
    descricao: 'Pouco uso, na caixa original. Bateria dura até 20 horas.',
    detalhes:
      'Fone over-ear Bluetooth 5.0 com microfone embutido, cancelamento de ruído e bateria de até 20 horas. Usado poucas vezes. Acompanha cabo de carregamento e caixa original.',
  }),
  criar('a8', 6, 'm9', {
    titulo: 'Jaleco branco tamanho M',
    categoria: 'roupas',
    condicao: 'Seminovo',
    preco: 40,
    emoji: '🥼',
    descricao: 'Jaleco branco de manga longa, usado em apenas um semestre.',
    detalhes:
      'Jaleco de brim branco, manga longa, tamanho M, com bolsos frontais. Lavado e passado, sem manchas. Ideal para os cursos da área da saúde.',
  }),
  criar('a9', 10, 'm8', {
    titulo: 'Livro Cálculo - Stewart (vol. 1)',
    categoria: 'livros',
    condicao: 'Usado',
    preco: 70,
    emoji: '📖',
    descricao: 'Cálculo, volume 1, de James Stewart. Algumas anotações a lápis.',
    detalhes:
      'Cálculo, volume 1, de James Stewart. Capa em ótimo estado, com algumas anotações a lápis que podem ser apagadas. Muito usado nas cadeiras de Cálculo 1 e 2.',
  }),
  criar('a10', 3, 'm10', {
    titulo: 'Ventilador de coluna',
    categoria: 'eletrodomesticos',
    condicao: 'Usado',
    preco: 120,
    emoji: '🌀',
    descricao: 'Ventilador com 3 velocidades. Funciona muito bem e é silencioso.',
    detalhes:
      'Ventilador de coluna de 40 cm, 3 velocidades e inclinação ajustável. Funcionando perfeitamente e bem silencioso. Ótimo para os dias quentes de Quixadá. 220V.',
  }),
  criar('a11', 14, 'm1', {
    titulo: 'Estante de livros',
    categoria: 'moveis',
    condicao: 'Usado',
    preco: 180,
    emoji: '🗄️',
    descricao: 'Estante com 5 prateleiras, ótima para livros e decoração. Pequeno desgaste na lateral.',
    detalhes:
      'Estante de MDF com 5 prateleiras (1,60 m de altura). Tem um pequeno desgaste na lateral, que não afeta o uso. Desmontável para facilitar o transporte.',
  }),
  criar('a12', 8, 'm4', {
    titulo: 'Tênis casual nº 40',
    categoria: 'roupas',
    condicao: 'Seminovo',
    preco: 150,
    emoji: '👟',
    descricao: 'Tênis casual tamanho 40, usado poucas vezes. Confortável e em ótimo estado.',
    detalhes:
      'Tênis casual preto, tamanho 40, usado poucas vezes e higienizado. Solado em ótimo estado. Acompanha a caixa.',
  }),
  criar('a13', 20, 'm3', {
    titulo: 'Kit de livros de Direito',
    categoria: 'livros',
    condicao: 'Usado',
    preco: 120,
    emoji: '⚖️',
    descricao: 'Três livros usados na graduação, com poucas marcações.',
    detalhes:
      'Kit com três livros usados na graduação em Direito: Direito Civil, Direito Constitucional e Introdução ao Estudo do Direito. Poucas marcações com marca-texto. Vendo juntos pelo preço indicado.',
  }),
];