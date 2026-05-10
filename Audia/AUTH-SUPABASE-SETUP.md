# Auth + Banco de Dados Seguro

Este projeto hoje é HTML/CSS/JS puro. Ele não usa React, shadcn, Tailwind ou TypeScript, então o componente React do prompt não pode ser colado diretamente sem antes migrar a stack.

Para não travar seu avanço, a base de `Entrar` e `Cadastro` foi implementada no stack atual e preparada para Supabase Auth + Postgres com RLS.

## Banco Recomendado

Use **Supabase Free**.

Motivos:
- Postgres real.
- Auth nativo com email/senha e Google.
- RLS no banco para garantir que cada usuário só veja os próprios registros.
- `anon key` pode ficar no frontend com segurança relativa, desde que o RLS esteja correto.

Referências oficiais:
- Auth: https://supabase.com/docs/guides/auth
- RLS: https://supabase.com/docs/guides/database/postgres/row-level-security
- Billing/Free plan: https://supabase.com/docs/guides/platform/billing-on-supabase

## Passo a Passo

1. Crie uma conta em Supabase.
2. Crie um projeto Free.
3. Vá em `Project Settings > API`.
4. Copie:
   - `Project URL`
   - `anon public key`
5. Abra [js/supabase-config.js](C:/Users/User/Downloads/Projeto Claude Code/Audia/js/supabase-config.js:1)
6. Preencha:

```js
window.AUDIA_SUPABASE = {
  url: "SUA_PROJECT_URL",
  anonKey: "SUA_ANON_PUBLIC_KEY",
  redirectTo: window.location.origin + "/entrar.html",
};
```

7. No Supabase, abra o SQL Editor.
8. Execute o conteúdo de [auth_schema.sql](C:/Users/User/Downloads/Projeto Claude Code/Audia/supabase/auth_schema.sql:1)
9. Em `Authentication > Providers`, habilite `Email` e, se quiser, `Google`.
10. Em `Authentication > URL Configuration`, adicione:
   - `http://127.0.0.1:8765`
   - sua URL de produção

## Como a Segurança Está Organizada

### 1. Cada usuário só vê a própria conta

Isso é garantido no banco com RLS.

Exemplo real aplicado:

```sql
create policy "profiles_select_own"
  on public.profiles
  for select
  to authenticated
  using ((select auth.uid()) is not null and (select auth.uid()) = id);
```

Se um usuário tentar buscar outra conta, o banco bloqueia.

### 2. Premium separado do perfil

Não deixe `premium` no perfil editável pelo usuário.

Foi criado:
- `public.profiles`
- `public.user_entitlements`

O usuário pode ler o próprio plano, mas **não pode** atualizar `user_entitlements`.

Isso evita o clássico problema de alguém se marcar como premium no frontend.

### 3. Nunca usar service role no frontend

No frontend:
- pode usar `anon key`

No frontend:
- **nunca** usar `service_role`

Se a `service_role` vazar, ela ignora RLS.

### 4. Upgrade para premium

Quando você ligar pagamentos:
- checkout aprovado chama webhook no backend/edge function
- backend atualiza `user_entitlements.plan = 'premium'`

O usuário comum nunca deve escrever nessa tabela.

## Usuário Free e Premium

Modelo recomendado:

- `profiles`: dados públicos da conta do usuário
- `user_entitlements`: plano e validade premium
- futuras tabelas como `favorites`, `progress`, `ratings`, `history`: sempre com `user_id`

Para qualquer tabela nova, repita o padrão:

```sql
alter table public.sua_tabela enable row level security;

create policy "select_own"
  on public.sua_tabela
  for select
  to authenticated
  using ((select auth.uid()) = user_id);
```

## Recomendações de Segurança

- Exija confirmação por email no cadastro.
- Use senha mínima de 8 caracteres ou mais.
- Habilite reset de senha por email.
- Depois, ative MFA para contas sensíveis ou admins.
- Não guarde papel/cargo em `raw_user_meta_data`.
- Se precisar de roles, prefira tabela própria ou `app_metadata`.

## Sobre o Prompt React/Tailwind/shadcn

O repositório atual não suporta:
- React
- TypeScript
- Tailwind
- shadcn/ui

Então o componente do prompt não foi integrado literalmente.

Se você quiser uma segunda fase em React, o caminho recomendado é:

1. Criar um frontend React/Vite ou Next.
2. Instalar Tailwind.
3. Inicializar shadcn/ui.
4. Migrar `entrar` e `cadastro` para componentes React.
5. Reaproveitar o mesmo Supabase e o mesmo SQL de RLS.

Se quiser, no próximo passo eu posso fazer essa migração também.
