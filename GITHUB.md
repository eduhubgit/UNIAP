# Login com GitHub

O app já tem o botão **Entrar com GitHub** e o fluxo pronto (web e celular).
Falta só autorizar o GitHub no painel do Supabase — são 3 lugares para configurar.

> Resumo do fluxo: o GitHub confirma quem é a pessoa → o Supabase cria/abre a
> conta → o app pede os dados que faltam (matrícula, CPF, cidade...) e cria o
> perfil. Quem já tem perfil entra direto.

---

## 1. Criar o OAuth App no GitHub

1. Abra <https://github.com/settings/developers> → **OAuth Apps** → **New OAuth App**.
2. Preencha:

| Campo | Valor |
| --- | --- |
| **Application name** | `UNI AP` (ou o nome que quiser) |
| **Homepage URL** | `http://localhost:8081` (troque depois pelo endereço publicado) |
| **Authorization callback URL** | `https://qiixzmwejzcbeynwxaht.supabase.co/auth/v1/callback` |

3. Clique em **Register application**.
4. Copie o **Client ID**.
5. Clique em **Generate a new client secret** e copie o **Client Secret**
   (ele só aparece uma vez).

> A callback URL é sempre a do **Supabase**, não a do app. É o Supabase que
> conversa com o GitHub e devolve a sessão para o app.

---

## 2. Ativar o provedor no Supabase

1. Abra o painel do projeto: <https://supabase.com/dashboard/project/qiixzmwejzcbeynwxaht>.
2. Vá em **Authentication → Sign In / Providers → GitHub**.
3. Ative **Enable GitHub provider**.
4. Cole o **Client ID** e o **Client Secret** do passo anterior.
5. Salve (**Save**).

O Supabase mostra nessa tela a **Callback URL** — confira se é exatamente:

```
https://qiixzmwejzcbeynwxaht.supabase.co/auth/v1/callback
```

Se for diferente, use a que aparece no painel no lugar da que colocou no GitHub.

---

## 3. Liberar os endereços de retorno (Redirect URLs)

Em **Authentication → URL Configuration**:

- **Site URL**: `http://localhost:8081`
- **Redirect URLs** (adicione uma por linha):

```
http://localhost:8081
http://localhost:8081/**
uniap://auth-callback
```

- `http://localhost:8081` → app rodando no navegador (`npx expo start` → `w`).
- `uniap://auth-callback` → app instalado no celular (build próprio).
- Quando publicar o app/site, acrescente o endereço real
  (ex.: `https://uniap.vercel.app` e `https://uniap.vercel.app/**`).

Salve.

---

## 4. Testar

```bash
cd UNIAP
npx expo start -c
```

No terminal do Expo pressione **w** (navegador) e clique em **Entrar com GitHub**.

- **Primeira vez**: o GitHub pede autorização, volta para o app e abre a tela
  **Crie sua conta** já com nome e e-mail preenchidos (sem senha). Complete os
  dados, escolha se tem apartamento e finalize.
- **Próximas vezes**: entra direto no app.

No celular, o login abre o navegador e volta pelo endereço `uniap://auth-callback`.
Isso funciona em **build próprio** (APK/Expo Dev Client). No **Expo Go** o retorno
pode não abrir o app — nesse caso, teste pelo navegador (`w`).

---

## 5. Detalhes importantes

- **Não precisa de SQL novo.** O perfil do usuário do GitHub é criado pelo mesmo
  fluxo do cadastro comum, e o gatilho de interesses de demonstração continua
  valendo.
- A conta do GitHub **não tem senha** no app. Se a pessoa quiser entrar também
  por e-mail/senha, é preciso definir uma senha em **Perfil → editar**.
- Se o e-mail do GitHub for privado, o campo de e-mail volta vazio: o app pede
  para preencher no cadastro.
- Qualquer pessoa com conta GitHub consegue **entrar no app** (é o objetivo).
  Ela continua vendo só os próprios dados por causa do RLS.
- A chave `publishable`/`anon` pode ficar no repositório. O **Client Secret** do
  GitHub **não** vai para o app nem para o GitHub: ele fica só no painel do
  Supabase.
- Para revogar acessos, desative o provider no Supabase ou apague o OAuth App no
  GitHub.

---

## Problemas comuns

| Sintoma | Causa provável | Correção |
| --- | --- | --- |
| `redirect_uri_mismatch` no GitHub | Callback diferente | Use exatamente `https://qiixzmwejzcbeynwxaht.supabase.co/auth/v1/callback` |
| Volta para o app sem sessão | URL de retorno fora da lista | Adicione `http://localhost:8081/**` e `uniap://auth-callback` em Redirect URLs |
| `Provider is not enabled` | GitHub desativado no Supabase | Ative em Authentication → Providers → GitHub |
| No celular o navegador não volta | Expo Go limita custom scheme | Teste na web ou use um build próprio |
| Entra mas volta para "Crie sua conta" toda vez | O perfil não foi concluído | Finalize o cadastro; se persistir, veja o console por erro de RLS |
