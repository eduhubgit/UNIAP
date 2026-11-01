# UNI AP + Supabase

O app deixou de salvar tudo apenas no aparelho. Agora ele usa:

- **Supabase Auth** para cadastro/login (e-mail + senha);
- **Postgres** para perfis, apartamentos, interesses, chats, mensagens, anúncios e favoritos;
- **Storage** para fotos de perfil, do apartamento e dos anúncios;
- **Realtime** para novas mensagens, interesses e anúncios aparecerem sem recarregar.

## 1. Configurar o projeto

1. Crie um projeto em <https://supabase.com/dashboard>.
2. Abra **SQL Editor** e execute o conteúdo de [`supabase/setup.sql`](./supabase/setup.sql).
   Ele cria tabelas, políticas de segurança (RLS), funções, buckets de fotos,
   realtime e os perfis/anúncios de demonstração.

> **Projeto que já teve outra tentativa?** Rode primeiro
> [`supabase/limpar-schema-antigo.sql`](./supabase/limpar-schema-antigo.sql)
> e depois o `setup.sql`. O script de limpeza apaga as tabelas antigas
> (`profiles`, `apartments`, `messages`, `interests`, `favorites`) que usavam
> outro formato e impediriam o app de funcionar.
3. Em **Project Settings → API**, copie:
   - `Project URL`
   - `anon public key`
4. Crie o arquivo `.env` na raiz do projeto:

```env
EXPO_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anon-publica
```

> O `.env` está no `.gitignore`. O arquivo `.env.example` serve de modelo.

5. Reinicie o Expo limpando o cache:

```bash
npx expo start -c
```

## 2. Autenticação (importante)

Em **Authentication → Providers → Email**:

- **Confirm email desativado** (recomendado): o cadastro já entra direto no app.
- **Confirm email ativado**: funciona também. O cadastro fica guardado no
  aparelho e é concluído automaticamente no primeiro login depois da confirmação.
  O app avisa para confirmar o e-mail e voltar para a tela de login.

## 3. O que foi implementado

| Arquivo | Responsabilidade |
| --- | --- |
| `lib/supabase.js` | Cliente Supabase com sessão persistida no AsyncStorage |
| `services/dados.js` | Leitura do banco e conversão para o formato das telas |
| `services/registro.js` | Criação do perfil (inclusive cadastro pendente de confirmação) |
| `services/storage.js` | Upload de fotos base64 para os buckets + tradução de erros |
| `context/AppContext.js` | Sessão, perfis, interesses, chats, mensagens e apartamento |
| `context/AnunciosContext.js` | Anúncios e favoritos |
| `supabase/setup.sql` | Schema, RLS, RPCs, Storage, Realtime e seed |

### Tabelas

- `profiles` — dados públicos (nome, foto, sobre, preferências, faixa, tem_ap...)
- `profiles_private` — matrícula, telefone, CPF, e-mail e preferências do app
  (só o próprio usuário enxerga)
- `apartments` — endereço, aluguel, vagas, despesas, fotos e documento
- `interests` / `rejections` — quem quer conversar com quem
- `chats` / `messages` — conversas e mensagens
- `ads` / `favorites` — marketplace e favoritos

### Regras de segurança

- Cada usuário só altera o próprio perfil, apartamento e anúncios.
- Matrícula, telefone, CPF e e-mail ficam em tabela privada (RLS por `auth.uid()`).
- Chats e mensagens só são visíveis para os dois participantes.
- Escritas em chats/mensagens passam por funções (`security definer`) que
  validam a participação do usuário.
- Fotos ficam em pastas `/<uid>/...`; cada usuário só envia/apaga na própria pasta.

### Perfis de demonstração

O `setup.sql` cria 10 perfis de teste (UUIDs fixos) e 13 anúncios.
Ao criar uma conta nova, um gatilho gera alguns interesses de demonstração
para que as abas **Match** e **Interessados** já tenham conteúdo.

Se preferir começar vazio, apague os blocos de seed do `setup.sql` ou rode:

```sql
delete from public.ads where vendedor in (select id from public.profiles where is_mock);
delete from public.profiles where is_mock;
```

## 4. Checklist de teste

1. `npx expo start -c`
2. Criar conta sem apartamento → deve cair no Match vendo perfis com AP.
3. Criar conta com apartamento → deve ver perfis sem AP.
4. Abrir **Interessados → Seus interesses** e simular o aceite de um perfil de teste.
5. Enviar mensagem e conferir a conversa em outro aparelho/aba.
6. Editar perfil e trocar a foto (deve subir para o bucket `avatars`).
7. Publicar anúncio com foto (bucket `anuncios`) e favoritar outro anúncio.
8. Marcar **Vaga ocupada?** no chat de quem procura AP e conferir as vagas no Perfil.

## 5. Observações

- A chave `anon` pode ficar no app: quem protege os dados é o RLS.
- Nunca coloque a `service_role` no `.env` do app.
- Para excluir a conta, o app chama a RPC `excluir_minha_conta()`, que remove
  perfil, dados e o usuário de autenticação.
- O documento do apartamento guarda apenas o **nome do arquivo** (comportamento
  original). Se quiser enviar o PDF de verdade, crie um bucket privado
  `documentos` e adapte `ApStep1`/`Profile`.
