# Orbitus — API (NestJS)

Backend do **Orbitus Classroom RPG**: autenticação JWT, CRUD de alunos, aulas, bloqueios, metas, dashboard e assistente IA (Gemini).

## Stack

- **NestJS 10**, **TypeScript**, **CQRS** (CommandBus / QueryBus)
- **Prisma** + **PostgreSQL**
- **JWT** (Passport), **Swagger** (OpenAPI)
- **Gemini** (Google AI) para chat e insights (opcional)

## Como rodar

Na raiz do monorepo:

```bash
pnpm dev:api
```

Ou na pasta do app:

```bash
cd apps/api
pnpm dev
```

API em **http://localhost:3001**. Swagger em **http://localhost:3001/api/docs**.

## Variáveis de ambiente

Copie `.env.example` para `.env` e ajuste:

```bash
cp .env.example .env
```

| Variável | Descrição | Exemplo |
|----------|------------|---------|
| `DATABASE_URL` | URL do PostgreSQL | `postgresql://orbitus:orbitus@localhost:5432/orbitus` |
| `JWT_SECRET` | Chave para assinatura do JWT | Altere em produção |
| `PORT` | Porta da API | `3001` |
| `CORS_ORIGIN` | Origem permitida (frontend) | `http://localhost:3000` |
| `GEMINI_API_KEY` | Chave do Gemini (opcional) | [aistudio.google.com/apikey](https://aistudio.google.com/apikey) |

## Banco de dados

Na raiz do monorepo:

```bash
pnpm db:generate
pnpm db:migrate
```

Seed (professor de teste e dados iniciais):

```bash
cd apps/api
pnpm prisma:seed
```

## Estrutura principal

```
apps/api/
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
├── src/
│   ├── auth/           # POST /auth/login, JWT, guards
│   ├── common/         # decorators, filters, roles
│   ├── dashboard/      # GET /dashboard/overview, /dashboard/by-class
│   ├── students/       # CRUD alunos, lessons, blockers, goals (CQRS)
│   ├── ai/             # GET /ai/status, /ai/insights, POST /ai/chat
│   ├── prisma/         # PrismaModule, PrismaService
│   ├── app.module.ts
│   └── main.ts
├── .env.example
└── README.md (este arquivo)
```

## Documentação

- Rotas e uso no frontend: [docs/ROUTES-AND-API.md](../../docs/ROUTES-AND-API.md)
- Status do projeto: [docs/PROJECT-STATUS.md](../../docs/PROJECT-STATUS.md)
- Módulo AI: [src/ai/README.md](src/ai/README.md)
