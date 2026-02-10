# Orbitus — Frontend (Next.js)

Aplicação web do **Orbitus Classroom RPG**: roster de alunos, ficha do aluno, dashboard e assistente IA.

## Stack

- **Next.js 14** (App Router)
- **React**, **TypeScript**, **Tailwind CSS**, **Framer Motion**
- Pacote compartilhado: `@orbitus/shared` (tipos e DTOs)

## Como rodar

Na raiz do monorepo:

```bash
pnpm dev:web
```

Ou na pasta do app:

```bash
cd apps/web
pnpm dev
```

Site em **http://localhost:3000**.

## Variáveis de ambiente

Copie `.env.example` para `.env.local` (opcional):

```bash
cp .env.example .env.local
```

| Variável | Descrição | Padrão |
|----------|------------|--------|
| `NEXT_PUBLIC_API_URL` | URL da API (backend) | `http://localhost:3001` |

Se não definir, o frontend usa `http://localhost:3001`. Para modo demo, a API não precisa estar no ar.

## Estrutura principal

```
apps/web/
├── src/
│   ├── app/                 # Rotas (App Router)
│   │   ├── page.tsx         # /
│   │   ├── layout.tsx       # Layout global (header, skip link)
│   │   ├── error.tsx        # Error boundary
│   │   ├── not-found.tsx    # 404
│   │   ├── login/
│   │   ├── roster/
│   │   ├── dashboard/
│   │   └── students/
│   │       ├── new/         # Cadastrar aluno
│   │       └── [id]/        # Ficha do aluno
│   ├── components/          # AppHeader, StudentModal, DemoBadge
│   └── lib/
│       └── mock-data.ts     # Dados e lógica do modo demo
├── .env.example
└── README.md (este arquivo)
```

## Modo demo

Sem API nem banco: na tela de login, clique em **"Modo demo (testar sem API)"**. Os dados vêm de `mock-data.ts` e do localStorage. Nada é enviado ao servidor.

## Documentação

- Rotas e conexão com a API: [docs/ROUTES-AND-API.md](../../docs/ROUTES-AND-API.md)
- Status do projeto: [docs/PROJECT-STATUS.md](../../docs/PROJECT-STATUS.md)
