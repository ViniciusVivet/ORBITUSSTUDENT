# Orbitus Classroom RPG

> Dashboard gamificado para professores acompanharem o progresso dos alunos como personagens de RPG.

[![Node](https://img.shields.io/badge/Node-18+-339933?logo=node.js&logoColor=white)](https://nodejs.org)
[![pnpm](https://img.shields.io/badge/pnpm-9+-F69220?logo=pnpm&logoColor=white)](https://pnpm.io)
[![Next.js](https://img.shields.io/badge/Next.js-14-000?logo=next.js&logoColor=white)](https://nextjs.org)
[![NestJS](https://img.shields.io/badge/NestJS-API-E0234E?logo=nestjs&logoColor=white)](https://nestjs.com)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?logo=prisma&logoColor=white)](https://prisma.io)

---

## 📁 Estrutura do projeto

```
OrbitusStudent/
├── apps/
│   ├── api/                           # Backend NestJS (CQRS, Prisma, JWT)
│   │   ├── prisma/
│   │   │   ├── schema.prisma
│   │   │   └── seed.ts
│   │   ├── src/
│   │   │   ├── auth/                  # POST /auth/login, JWT, guards, roles
│   │   │   ├── common/                # decorators, filters, guards
│   │   │   ├── dashboard/             # GET /dashboard/overview, /dashboard/by-class
│   │   │   ├── students/              # CRUD alunos, lessons, blockers, goals (CQRS)
│   │   │   │   ├── commands/          # create, update, register-lesson, add-blocker, goals
│   │   │   │   ├── queries/           # list, getById, summary, class-groups, topics, blockers, goals
│   │   │   │   ├── dto/
│   │   │   │   └── students.controller.ts
│   │   │   ├── ai/                    # GET /ai/status, /ai/insights, POST /ai/chat (Gemini)
│   │   │   ├── prisma/
│   │   │   ├── app.module.ts
│   │   │   └── main.ts
│   │   ├── .env.example
│   │   └── README.md
│   └── web/                           # Frontend Next.js 14 (App Router)
│       ├── src/
│       │   ├── app/
│       │   │   ├── page.tsx           # / (início)
│       │   │   ├── layout.tsx         # layout global, skip link
│       │   │   ├── error.tsx          # error boundary
│       │   │   ├── not-found.tsx      # 404
│       │   │   ├── login/             # /login
│       │   │   ├── roster/            # /roster (lista, filtros, paginação, CSV)
│       │   │   ├── dashboard/         # /dashboard (métricas, Por turma, IA)
│       │   │   └── students/
│       │   │       ├── new/           # /students/new (cadastrar aluno)
│       │   │       └── [id]/          # /students/[id] (ficha do aluno)
│       │   ├── components/            # AppHeader, StudentModal, DemoBadge
│       │   └── lib/
│       │       └── mock-data.ts       # modo demo
│       ├── .env.example
│       └── README.md
├── packages/
│   └── shared/                        # Tipos e DTOs compartilhados (@orbitus/shared)
├── docs/
│   ├── SPEC-ORBITUS-CLASSROOM-RPG.md   # produto + arquitetura
│   ├── PROJECT-STATUS.md               # status, demo, mocks
│   └── ROUTES-AND-API.md               # rotas ↔ API
├── docker-compose.yml                 # PostgreSQL
├── package.json                       # scripts raiz (dev:api, dev:web, db:*)
└── pnpm-workspace.yaml
```

---

## ✅ O que já está implementado

| Área | Recursos |
|------|----------|
| **Frontend** | Login, modo demo, Roster com busca (**debounce**), filtros (turma, status, sem aula há 7+/14+ dias), **ordenação** (nome, XP, nível), **paginação / "Carregar mais"**, **exportar CSV** e **relatório CSV** (filtro atual + triagem), **Roster em cards ou tabela**, **filtros do Roster salvos no navegador** (busca, turma, status, sem aula, ordenação; link do Dashboard prioriza turma na URL), **Roster lê classGroupId da URL** (link "Ver alunos" do Dashboard), cadastro com **turma**, modal do aluno (**focus trap**, Escape, **avatar 3D** R3F + fallback 2D/`prefers-reduced-motion`, foto sem WebGL, **badges de triagem** iguais ao Roster), ficha com **editar dados**, **imprimir ficha** (Ctrl+P / PDF pelo navegador), **breadcrumb**, **toast acessível** (aria-live), **mensagens de validação** claras nos formulários, metas com **destaque de prazo** e **confirmação ao concluir**, **bloqueios com tags** e **nota rápida** (edição inline + API), dashboard com **Por turma** e **empty state**, Insights IA e chat (Gemini), **navegação global**, **404**, **error boundary**, **skip link**, **título por página**, **loading skeleton** (Roster e ficha), **"Tentar de novo"** em falhas (Roster e ficha), responsivo e reduced-motion. |
| **Backend** | Auth JWT, CRUD e **PATCH** de alunos, **listar turmas** (class-groups), resumo e summary, tópicos, registrar aula (XP/habilidades), dashboard overview e **by-class**, **noLessonSinceDays**, **limit/offset** em list students, bloqueios (**PATCH** com `observation` / `tags`), metas, **módulo AI** (chat e insights com Gemini). |
| **Infra** | Monorepo pnpm, Prisma + PostgreSQL, Docker Compose para o banco, Swagger em **http://localhost:3001/api/docs**. **Frontend e API** documentados: `apps/web/README.md`, `apps/api/README.md`; **rotas e conexão** em [docs/ROUTES-AND-API.md](docs/ROUTES-AND-API.md); **variáveis de ambiente** em `apps/api/.env.example` e `apps/web/.env.example`. |

---

## 🔜 O que ainda falta (roadmap)

| Item | Descrição |
|------|-----------|
| **V2 (especificação)** | PWA, sync offline, mais insights automáticos. |

**Feito:** avatar no modal com **cena 3D** (React Three Fiber + orbe icosaédrico), **fallback 2D** (só emoji) com `prefers-reduced-motion`, e **foto** sem WebGL.

Visão de produto e arquitetura: [docs/SPEC-ORBITUS-CLASSROOM-RPG.md](docs/SPEC-ORBITUS-CLASSROOM-RPG.md). Estado e demo: [docs/PROJECT-STATUS.md](docs/PROJECT-STATUS.md).

---

## 🎮 Testar sem API (modo demo)

Você pode ver toda a interface **sem instalar PostgreSQL nem subir a API**:

1. `pnpm install` e depois `pnpm dev:web`
2. Abra **http://localhost:3000**
3. Na tela de login, clique em **"Modo demo (testar sem API)"**
4. Você verá o Roster com alunos de exemplo. Clique em qualquer um para abrir o modal, use "Cadastrar aluno", "Dashboard", etc. Nada é salvo no servidor — só no navegador.

[![Status do projeto](https://img.shields.io/badge/docs-Status_do_projeto_%26_demo-8B5CF6?style=flat-square)](docs/PROJECT-STATUS.md)

---

## 🚀 Rodar com API e banco (dados reais)

### O que você precisa

| Requisito | Detalhe |
|-----------|---------|
| **Node.js** | 18+ em [nodejs.org](https://nodejs.org) |
| **pnpm** | `npm install -g pnpm` |
| **PostgreSQL** | Com Docker: `docker-compose up -d postgres` — ou instale local ([postgresql.org](https://www.postgresql.org/download/windows/)) e crie banco `orbitus` + usuário/senha. Ajuste `apps/api/.env` se precisar. |

- **API:** variáveis em `apps/api/.env` (copie de `apps/api/.env.example`). Para o **assistente IA** (chat e insights no dashboard), adicione `GEMINI_API_KEY` no `.env` da API — chave em [aistudio.google.com/apikey](https://aistudio.google.com/apikey) (tier gratuito).
- **Frontend:** opcional `apps/web/.env.local` (copie de `apps/web/.env.example`). Se não definir `NEXT_PUBLIC_API_URL`, o padrão é `http://localhost:3001`.

---

## 📦 Como rodar (passo a passo)

### 1. Instalar dependências

Na pasta do projeto:

```bash
pnpm install
```

### 2. Subir o banco (PostgreSQL)

**Com Docker:**

```bash
docker-compose up -d postgres
```

(Postgres na porta 5432, usuário `orbitus`, senha `orbitus`, banco `orbitus` — o `.env` da API já aponta para isso.)

**Sem Docker:** instale o PostgreSQL, crie o banco `orbitus` e usuário/senha. Se for diferente, edite `DATABASE_URL` em `apps/api/.env`.

### 3. Criar tabelas e dados de teste

```bash
pnpm db:generate
pnpm db:migrate
```

(Quando o Prisma pedir o nome da migração, digite `init` e Enter.)

Depois, seed (professor de teste e dados iniciais):

```bash
cd apps/api
pnpm prisma:seed
cd ../..
```

No PowerShell: `cd apps\api; pnpm prisma:seed; cd ..\..`

### 4. Ligar API e site (dois terminais)

**Terminal 1 — API:**

```bash
pnpm dev:api
```

Aguarde aparecer algo como *"API rodando em http://localhost:3001"*.

**Terminal 2 — Site:**

```bash
pnpm dev:web
```

Site em **http://localhost:3000**.

### 5. Usar o sistema

1. Abra **http://localhost:3000**
2. Clique em **Entrar**
3. Login de teste: **e-mail** `prof@escola.com` | **senha** `senha123`
4. Você cai no Roster. Para criar alunos via API, use o Swagger em **http://localhost:3001/api/docs**.

---

## 🧪 Testes automatizados

Na raiz do monorepo (API com Jest + web com Vitest):

```bash
pnpm test
```

Ou por app:

```bash
pnpm --filter api test
pnpm --filter web test
```

- **API:** `list-students.handler.spec.ts` — valida `orderBy` do `GET /students` conforme `sortBy` (`name`, `xp`, `level`).
- **Web:** `csv-export.test.ts` — valida escape e geração do CSV do Roster.

Antes de rodar a API em produção, execute `pnpm db:generate` na API para o Prisma gerar o client.

---

## 📋 Resumo rápido

| O quê | Comando / Onde |
|-------|----------------|
| Instalar deps | `pnpm install` |
| Subir o banco | `docker-compose up -d postgres` |
| Criar tabelas | `pnpm db:generate` e `pnpm db:migrate` |
| Dados de teste | `cd apps/api` → `pnpm prisma:seed` |
| Ligar API | `pnpm dev:api` (terminal 1) |
| Ligar site | `pnpm dev:web` (terminal 2) |
| Abrir o site | http://localhost:3000 |
| Login de teste | `prof@escola.com` / `senha123` |
| Rodar testes | `pnpm test` |

---

## 📚 Documentação

| Doc | Descrição |
|-----|-----------|
| [**Status do projeto e modo demo**](docs/PROJECT-STATUS.md) | O que está pronto, o que é mock, o que depende da API. |
| [**Rotas e conexão Frontend ↔ API**](docs/ROUTES-AND-API.md) | Todas as rotas do frontend e endpoints da API com onde são usados. |
| [**Especificação**](docs/SPEC-ORBITUS-CLASSROOM-RPG.md) | Fases MVP/V2/V3, arquitetura, CQRS, UX/padrões (sem duplicar rotas — ver ROUTES-AND-API). |
| **apps/web/README.md** | Como rodar o frontend, env, estrutura. |
| **apps/api/README.md** | Como rodar a API, env, banco, estrutura. |
