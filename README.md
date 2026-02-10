# Orbitus Classroom RPG

Dashboard gamificado para acompanhar alunos. Este README explica **como rodar** e **como testar sem API**.

---

## Testar o site sem API (modo demo)

Você pode ver toda a interface **sem instalar PostgreSQL nem subir a API**:

1. `pnpm install` e depois `pnpm dev:web`
2. Abra **http://localhost:3000**
3. Na tela de login, clique em **“Modo demo (testar sem API)”**
4. Você verá o Roster com 4 alunos de exemplo. Clique em qualquer um para abrir o modal, use “Cadastrar aluno”, “Dashboard”, etc. Nada é salvo no servidor — só no navegador.

Para saber o que está pronto e o que usa mock, veja **[docs/PROJECT-STATUS.md](docs/PROJECT-STATUS.md)**.

---

## Rodar com API e banco (dados reais)

### O que você precisa ter

1. **Node.js** 18 ou mais novo ([nodejs.org](https://nodejs.org))
2. **pnpm** — depois de instalar o Node, abra um terminal e rode: `npm install -g pnpm`
3. **PostgreSQL** — o banco de dados. **Docker não é obrigatório.** Você pode:
   - **Com Docker:** rodar só o Postgres com `docker-compose up -d postgres` (mais rápido de subir).
   - **Sem Docker:** instalar o PostgreSQL no Windows ([postgresql.org/download](https://www.postgresql.org/download/windows/)), criar um banco `orbitus` e um usuário com senha (ex.: usuário `orbitus`, senha `orbitus`). Se for diferente, edite a linha `DATABASE_URL` no arquivo `apps/api/.env`.

A **configuração da API** (endereço do banco, porta, etc.) já está no projeto no arquivo `apps/api/.env`. Só precisa mudar algo ali se o seu Postgres for em outro lugar ou com outro usuário/senha.

---

## Como rodar (passo a passo)

### Passo 1 — Instalar dependências do projeto

Na pasta do projeto, abra um terminal e rode:

```bash
pnpm install
```

Espera terminar (pode demorar um pouco na primeira vez).

---

### Passo 2 — Subir o banco de dados (PostgreSQL)

**Se você tem Docker instalado:**

```bash
docker-compose up -d postgres
```

Isso sobe só o Postgres, na porta 5432, com usuário `orbitus`, senha `orbitus` e banco `orbitus`. O arquivo `.env` da API já está apontando para isso.

**Se você não tem Docker:** instale o PostgreSQL, crie um banco `orbitus` e um usuário com senha (por exemplo usuário `orbitus`, senha `orbitus`). Se o seu usuário ou senha for diferente, edite o arquivo `apps/api/.env` e altere a linha `DATABASE_URL` com o usuário, senha e nome do banco corretos.

---

### Passo 3 — Criar as tabelas e o usuário de teste

Ainda na pasta do projeto, rode:

```bash
pnpm db:generate
pnpm db:migrate
```

Quando o Prisma perguntar o nome da migração, pode digitar `init` e Enter.

Depois, rodar o seed (cria o professor de teste e alguns dados iniciais):

```bash
cd apps/api
pnpm prisma:seed
cd ../..
```

(No PowerShell você pode rodar: `cd apps\api; pnpm prisma:seed; cd ..\..`)

---

### Passo 4 — Ligar a API e o site

Você precisa de **dois terminais** abertos na pasta do projeto.

**Terminal 1 — API:**

```bash
pnpm dev:api
```

Deixe rodando. Quando aparecer algo como “API rodando em http://localhost:3001”, está ok.

**Terminal 2 — Site (web):**

```bash
pnpm dev:web
```

Deixe rodando. Quando abrir, o site estará em **http://localhost:3000**.

---

### Passo 5 — Usar o sistema

1. Abra o navegador em **http://localhost:3000**
2. Clique em **Entrar**
3. Use o login de teste: **e-mail** `prof@escola.com` e **senha** `senha123`
4. Você cai na lista de alunos (Roster). No início pode estar vazia; dá para criar alunos pela documentação da API em **http://localhost:3001/api/docs** (Swagger).

---

## Resumo rápido

| O quê            | Comando / Onde                          |
|------------------|------------------------------------------|
| Instalar deps    | `pnpm install`                           |
| Subir o banco    | `docker-compose up -d postgres`          |
| Criar tabelas     | `pnpm db:generate` e `pnpm db:migrate`   |
| Dados de teste   | `cd apps/api` → `pnpm prisma:seed`       |
| Ligar API        | `pnpm dev:api` (terminal 1)              |
| Ligar site       | `pnpm dev:web` (terminal 2)               |
| Abrir o site     | http://localhost:3000                   |
| Login de teste   | prof@escola.com / senha123               |

A **configuração da API e do banco** já está feita no projeto (arquivo `apps/api/.env`). Você só precisa ter o Postgres rodando (Docker ou instalado) e seguir os passos acima.

---

## Documentação

- **[Status do projeto e modo demo](docs/PROJECT-STATUS.md)** — o que está pronto, o que é mock, o que depende da API. Atualize este doc conforme o projeto avança.
- **[Especificação completa](docs/SPEC-ORBITUS-CLASSROOM-RPG.md)** — escopo, arquitetura, modelo de dados, backlog.
