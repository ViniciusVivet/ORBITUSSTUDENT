# Rotas e Conexão Frontend ↔ API

Documento de referência das **rotas do frontend**, **endpoints da API** e **onde cada um é usado**. Todas as rotas estão conectadas.

---

## Rotas do frontend (Next.js App Router)

| Rota | Arquivo | Descrição | Protegida |
|------|---------|-----------|-----------|
| `/` | `app/page.tsx` | Página inicial (links Roster, Dashboard, Entrar) | Não (redireciona se sem token) |
| `/login` | `app/login/page.tsx` | Login (e-mail/senha) e botão "Modo demo" | Não |
| `/roster` | `app/roster/page.tsx` | Lista de alunos, filtros, ordenação, "Carregar mais", exportar CSV | Sim |
| `/roster?classGroupId=...` | idem | Roster filtrado por turma (link do Dashboard "Ver alunos") | Sim |
| `/dashboard` | `app/dashboard/page.tsx` | Métricas, Por turma, Insights IA, chat | Sim |
| `/students/new` | `app/students/new/page.tsx` | Cadastrar aluno (nome, turma, avatar) | Sim |
| `/students/[id]` | `app/students/[id]/page.tsx` | Ficha do aluno (editar, aula, bloqueios, metas) | Sim |
| `/students/[id]#lesson` | idem | Ficha com formulário "Registrar aula" aberto | Sim |
| `/students/[id]#blocker` | idem | Ficha com formulário "Bloqueio" aberto | Sim |
| `/students/[id]#goal` | idem | Ficha com formulário "Meta" aberto | Sim |
| 404 | `app/not-found.tsx` | Página não encontrada (links Início e Roster) | Não |
| Erro | `app/error.tsx` | Error boundary (Tentar de novo, Início, Roster) | Não |

**Navegação global (AppHeader):** Roster, Dashboard, Cadastrar aluno, Início, Sair.

---

## Endpoints da API (NestJS)

Base URL: `process.env.NEXT_PUBLIC_API_URL` (frontend) ou `http://localhost:3001` (padrão).  
Swagger: `http://localhost:3001/api/docs`.

### Auth

| Método | Endpoint | Uso no frontend |
|--------|----------|------------------|
| POST | `/auth/login` | `app/login/page.tsx` — login com e-mail/senha |

### Students

| Método | Endpoint | Uso no frontend |
|--------|----------|------------------|
| GET | `/students` | `app/roster/page.tsx` — lista (search, classGroupId, status, noLessonSinceDays, limit, offset) |
| GET | `/students/class-groups` | `app/students/new/page.tsx`, `app/students/[id]/page.tsx` — select de turma |
| GET | `/students/topics` | `app/students/[id]/page.tsx` — select de tópico ao registrar aula |
| GET | `/students/:id` | (Swagger / uso futuro; a ficha usa summary) |
| GET | `/students/:id/summary` | `app/students/[id]/page.tsx`, `StudentModal.tsx` — resumo do aluno |
| POST | `/students` | `app/students/new/page.tsx` — criar aluno |
| PATCH | `/students/:id` | `app/students/[id]/page.tsx` — editar dados do aluno |
| POST | `/students/:id/lessons` | `app/students/[id]/page.tsx` — registrar aula |
| GET | `/students/:id/blockers` | `app/students/[id]/page.tsx` — listar bloqueios |
| POST | `/students/:id/blockers` | `app/students/[id]/page.tsx` — criar bloqueio |
| PATCH | `/students/:id/blockers/:blockerId` | `app/students/[id]/page.tsx` — resolver bloqueio |
| GET | `/students/:id/goals` | `app/students/[id]/page.tsx` — listar metas |
| POST | `/students/:id/goals` | `app/students/[id]/page.tsx` — criar meta |
| PATCH | `/students/:id/goals/:goalId` | `app/students/[id]/page.tsx` — atualizar meta (em andamento / concluída) |

### Dashboard

| Método | Endpoint | Uso no frontend |
|--------|----------|------------------|
| GET | `/dashboard/overview` | `app/dashboard/page.tsx` — métricas (cards) |
| GET | `/dashboard/by-class` | `app/dashboard/page.tsx` — seção "Por turma" |

### AI

| Método | Endpoint | Uso no frontend |
|--------|----------|------------------|
| GET | `/ai/status` | `app/dashboard/page.tsx` — verificar se Gemini está disponível |
| GET | `/ai/insights` | `app/dashboard/page.tsx` — sugestões automáticas |
| POST | `/ai/chat` | `app/dashboard/page.tsx` — chat com o assistente |

---

## Resumo da conexão

- **Todas as rotas do frontend** têm links ou redirecionamento (header, home, not-found, error, modal → ficha).
- **Todos os endpoints usados pelo frontend** estão implementados na API e chamados nos arquivos indicados.
- **Modo demo:** quando o usuário entra em "Modo demo", o frontend não chama a API; usa `apps/web/src/lib/mock-data.ts` e localStorage para cadastro.

---

*Última atualização: fev/2025.*
