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
│   ├── api/                    # Backend NestJS (CQRS, Prisma, JWT)
│   │   ├── prisma/             # schema.prisma, seed
│   │   └── src/
│   │       ├── auth/           # login JWT, guards, roles
│   │       ├── common/         # decorators, filters, guards
│   │       ├── dashboard/     # overview (métricas)
│   │       ├── prisma/        # PrismaModule, PrismaService
│   │       └── students/      # CRUD, lessons, blockers, goals (commands/queries)
│   └── web/                    # Frontend Next.js 14
│       └── src/
│           ├── app/            # rotas: /, /login, /roster, /dashboard, /students/[id], /students/new
│           ├── components/     # StudentModal, DemoBadge
│           └── lib/            # mock-data.ts (modo demo)
├── packages/
│   └── shared/                 # Tipos e DTOs compartilhados
├── docs/                       # SPEC, PROJECT-STATUS, schema de referência
├── docker-compose.yml          # Postgres
├── package.json                # scripts raiz (dev:api, dev:web, db:*)
└── pnpm-workspace.yaml
```

---

## ✅ O que já está implementado

| Área | Recursos |
|------|----------|
| **Frontend** | Login, modo demo, Roster com busca/filtros e setas, modal do aluno (HUD, barras, últimas aulas), ficha (aula, bloqueios, metas, timeline), cadastro de aluno com avatares, dashboard, logout, responsivo e reduced-motion. |
| **Backend** | Auth JWT, CRUD de alunos, resumo e summary, tópicos, registrar aula (XP/habilidades), dashboard overview, bloqueios (listar/criar/resolver), metas (listar/criar/atualizar status). |
| **Infra** | Monorepo pnpm, Prisma + PostgreSQL, Docker Compose para o banco, Swagger em `/api/docs`. |

---

## 🔜 O que ainda falta (roadmap)

| Item | Descrição |
|------|-----------|
| **Avatar 3D no modal** | Renderização 3D (ex.: R3F) no modal do aluno, com fallback 2D. |
| **V2 (especificação)** | PWA, sync offline, Insights IA no dashboard. |

Detalhes em [docs/SPEC-ORBITUS-CLASSROOM-RPG.md](docs/SPEC-ORBITUS-CLASSROOM-RPG.md) e [docs/PROJECT-STATUS.md](docs/PROJECT-STATUS.md).

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

A **configuração da API** (banco, porta, etc.) está em `apps/api/.env`. Só altere se o seu Postgres for em outro host/usuário/senha.

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

---

## 📚 Documentação

| Doc | Descrição |
|-----|-----------|
| [**Status do projeto e modo demo**](docs/PROJECT-STATUS.md) | O que está pronto, o que é mock, o que depende da API. |
| [**Especificação completa**](docs/SPEC-ORBITUS-CLASSROOM-RPG.md) | Escopo, arquitetura, modelo de dados, backlog. |
