# Onde colocar cada coisa do Supabase

## No painel do Supabase

- **Settings** (engrenagem) → **API** → você vê **Project URL** e **Project API keys**.
- **Settings** → **Database** → **Connection string** (se for usar conexão direta ao Postgres).

---

## Backend (pasta `backend/`)

Crie o arquivo **`.env`** dentro de `backend/` (copie de `.env.example`) e preencha:

| Variável | Onde pegar no Supabase | Onde colocar |
|----------|------------------------|--------------|
| `SUPABASE_URL` | **Settings → API** → campo **Project URL** (ex: `https://xxxxx.supabase.co`) | No `.env` do backend |
| `SUPABASE_KEY` | **Settings → API** → **Project API keys** → chave **anon** (pública) | No `.env` (opcional se usar Service Role) |
| `SUPABASE_SERVICE_ROLE_KEY` | **Settings → API** → **Project API keys** → chave **service_role** (clique em "Reveal") | No `.env` do backend (**recomendado** para o backend) |

O backend usa primeiro a `SUPABASE_SERVICE_ROLE_KEY`; se não existir, usa `SUPABASE_KEY`.

---

## Frontend (pasta `Pastoral-AI/`)

Se for usar o cliente Supabase no React, crie **`.env`** (ou `.env.local`) em `Pastoral-AI/` e use variáveis com prefixo **`VITE_`**:

| Variável | Onde pegar no Supabase | Onde colocar |
|----------|------------------------|--------------|
| `VITE_SUPABASE_URL` | **Settings → API** → **Project URL** | No `.env` do frontend |
| `VITE_SUPABASE_ANON_KEY` | **Settings → API** → chave **anon** (Publishable) | No `.env` do frontend |

**Nunca** coloque a chave **service_role** no frontend.

---

## O que pode estar faltando na sua tela

1. **Service Role Key (chave secreta)**  
   Em **Settings → API** → **Project API keys**, além da chave **anon**, existe a **service_role**.  
   Ela costuma estar oculta; use **Reveal** e copie. É a que você coloca em `SUPABASE_SERVICE_ROLE_KEY` no backend.

2. **Project URL completa**  
   A URL deve ser algo como:  
   `https://eqxijomruvxumidbagdd.supabase.co`  
   (com `.supabase.co` no final). Confira se copiou a URL inteira.

3. **Connection string completa (só se for usar Postgres direto)**  
   Em **Settings → Database** → **Connection string** → **Direct connection** você vê a URI completa (usuário, senha, host, porta).  
   Só é necessária se for usar conexão direta ao PostgreSQL no backend; para usar só a API REST do Supabase (como no `main.py`), **não** é obrigatória.

---

## Resumo

- **Backend `.env`**: `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` (ou `SUPABASE_KEY` com anon).
- **Frontend `.env`**: `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY`.
- **Faltando na tela**: conferir **Service Role Key** (Reveal em Project API keys) e **URL completa** com `.supabase.co`.
