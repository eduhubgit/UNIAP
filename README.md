# UNI AP

App para universitários encontrarem apartamento e colegas de quarto.

- **Expo / React Native** (Android, iOS e web)
- **Supabase** para login, banco, fotos e tempo real

## Rodar o app

```bash
npm install
cp .env.example .env
npx expo start -c
```

No terminal do Expo: `w` abre no navegador, `a` no Android e o QR Code abre no
celular (Expo Go).

### Banco de dados

O app usa um projeto Supabase já configurado. As chaves públicas do projeto
(`URL` + chave `publishable`/`anon`) ficam no arquivo `.env`:

```env
EXPO_PUBLIC_SUPABASE_URL=https://qiixzmwejzcbeynwxaht.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_XCE5rFKjxkf9LtbgLwrqhQ_p0x9YK37
```

> Essa chave é **pública** e pode ficar no app. Quem protege os dados é o RLS do
> banco: sem login ninguém lê nada, e cada conta só vê/edita os próprios dados.
> Nunca use a chave `service_role`/secret no app.

Para criar um projeto do zero, execute [`supabase/setup.sql`](./supabase/setup.sql)
no SQL Editor e depois preencha o `.env` com as chaves do seu projeto.
Detalhes em [`SUPABASE.md`](./SUPABASE.md).

## Estrutura

| Pasta | Conteúdo |
| --- | --- |
| `screens/` | Telas do app |
| `components/` | Componentes reutilizáveis |
| `context/` | Estado global (sessão, dados, anúncios) |
| `services/` | Acesso ao Supabase (dados, cadastro e fotos) |
| `lib/supabase.js` | Cliente Supabase |
| `supabase/` | Scripts SQL do banco |
