# Orbitus Classroom RPG — Especificação (produto + arquitetura)

**Nome interno:** Orbitus Classroom RPG  
**Versão do doc:** 1.1 (enxuto; alinhado ao repo)  
**Stack:** Next.js 14 (App Router), TypeScript, Tailwind, Framer Motion, React Three Fiber, NestJS, PostgreSQL, Prisma, JWT.

**Documentação operacional (fonte do dia a dia):**

- [README.md](../README.md) — como rodar, roadmap, o que já existe.
- [ROUTES-AND-API.md](ROUTES-AND-API.md) — rotas do front e endpoints, arquivo por arquivo.
- [PROJECT-STATUS.md](PROJECT-STATUS.md) — demo, mocks, API.
- **Schema do banco:** `apps/api/prisma/schema.prisma` (única fonte).

Este SPEC guarda **visão de fases**, **arquitetura** e **padrões**; não duplica listas de rotas nem checklist de features implementadas.

---

## 1. Fases de produto (MVP → V2 → V3)

### 1.1 MVP (Fase 1) — em grande parte entregue

| Área | Intenção | Notas vs código atual |
|------|-----------|------------------------|
| **Auth** | JWT, roles ADMIN / VIEWER | ✅ |
| **Roster** | Cards/tabela, busca, filtros, ordenação, paginação, CSV, triagem | ✅ (evoluiu além do MVP original) |
| **Modal do aluno** | HUD, habilidades, últimas aulas, atalhos para ficha | ✅ + avatar 3D (R3F) com fallback 2D / `prefers-reduced-motion` |
| **Ficha** | Aulas, bloqueios (tags/nota), metas, editar aluno, impressão | ✅ |
| **Aulas / XP / skills** | Registrar aula, progresso por skill | ✅ |
| **Bloqueios / metas** | CRUD essencial na ficha | ✅ |
| **Dashboard** | Métricas agregadas, por turma | ✅ |
| **IA** | Sugestões e chat | ✅ **Gemini** (não é mais só placeholder) |
| **Privacidade** | Apelido, nome completo opcional, avatar emoji/template/foto | ✅ |

**Ainda como ideia no MVP original e não obrigatório:** “curso” no filtro do Roster, gráficos pesados de evolução na ficha (há timeline e barras no modal).

### 1.2 V2 (planejado)

| Funcionalidade | Descrição |
|----------------|-----------|
| **PWA + offline** | Instalável, service worker, cache, indicador offline |
| **Sync** | Fila offline → online, conflitos |
| **Insights IA** | Ampliar além do Gemini atual (ex.: resumos automáticos por aluno, padrões de bloqueio) |
| **Templates de exercícios** | Missões por tópico/skill |

### 1.3 V3 (planejado)

| Funcionalidade | Descrição |
|----------------|-----------|
| **Keycloak / SSO** | Auth federada mantendo roles |
| **Multi-escolas** | Tenant por organização |
| **PDF** | Fichas e relatórios exportáveis |

---

## 2. Arquitetura

### 2.1 Monorepo (real)

```
OrbitusStudent/
├── apps/
│   ├── web/                 # Next.js, App Router
│   └── api/                 # NestJS, CQRS, Prisma
├── packages/
│   └── shared/              # Tipos compartilhados (@orbitus/shared)
├── docs/                    # SPEC, status, rotas/API
├── docker-compose.yml       # PostgreSQL (dev)
└── pnpm-workspace.yaml
```

*Não existe `packages/ui` no repositório; componentes ficam em `apps/web/src/components`.*

### 2.2 Backend — camadas

```
Presentation (Controllers, Guards, Swagger)
        → Application (Commands/Queries + Handlers, DTOs, validação)
        → Domain (regras; no repo, lógica concentrada nos handlers + Prisma)
        → Infrastructure (Prisma, JWT, filtros de exceção)
```

### 2.3 Exemplo de fluxo — registrar aula

```
POST /students/:id/lessons
  → Controller → CommandBus(RegisterLessonCommand)
  → Handler: valida aluno/tópico, persiste Lesson, atualiza XP e SkillProgress
  → 201 + corpo ou 4xx/5xx via Exception Filter
```

### 2.4 Frontend — dados

- Páginas em `app/`; chamadas `fetch` à API (`NEXT_PUBLIC_API_URL`).
- Tipos alinhados a `@orbitus/shared` onde aplicável.
- WebGL / R3F carregado com **dynamic import** no modal (evita peso na primeira carga do Roster).

### 2.5 Deploy local típico

PostgreSQL (Docker ou local) ← API `:3001` ← browser → Web `:3000`.

---

## 3. Modelo de dados

**Canônico:** `apps/api/prisma/schema.prisma`.

Conceitualmente: `TeacherUser` → `Student` (com `ClassGroup` opcional); `Lesson` + `Topic` + `Skill` / `SkillProgress`; `Blocker`; `Goal`. Detalhes de colunas, enums e índices — só no Prisma.

**Últimas aulas no resumo:** query `Lesson` ordenada por `held_at` (índice por aluno), não cache materializado no MVP.

---

## 4. CQRS e API

Nomes de commands/queries seguem o padrão Nest + `@nestjs/cqrs`. **Lista atual de paths e arquivos que consomem:** [ROUTES-AND-API.md](ROUTES-AND-API.md).

| Tipo | Exemplos |
|------|----------|
| **Commands** | Login, Create/Update Student, RegisterLesson, Add/Update Blocker, Create/Update Goal |
| **Queries** | ListStudents, GetStudentSummary, list blockers/goals, dashboard overview / by-class, class-groups, topics, attention queue (se exposto) |

---

## 5. Histórico de implementação (épicos 1–8)

A ordem abaixo foi usada para **construir** o projeto; o trabalho correspondente está feito. Não usar como backlog ativo.

1. Monorepo, Prisma, auth JWT, CQRS base  
2. Alunos CRUD + listagem + turmas/tópicos para formulários  
3. Aulas + resumo (summary)  
4. Bloqueios e metas  
5. Dashboard backend (+ evolução front)  
6. Roster e navegação  
7. Modal + avatar + HUD  
8. Ficha completa + dashboard no front  

Para “o que falta” no produto, ver **README** (roadmap V2) e **PROJECT-STATUS**.

---

## 6. UX e performance (diretrizes)

- **Modal:** foco preso, Escape, animação moderada; respeitar `prefers-reduced-motion` no 3D e nas animações.
- **Avatar:** WebGL opcional; foto continua 2D; sem Canvas quando movimento reduzido.
- **Roster:** virtualizar só se a lista crescer muito (ex. > 50 visíveis); hoje há paginação / “Carregar mais”.
- **API:** evitar N+1; índices em chaves de listagem (aluno, datas, status).

---

## 7. Validação e erros (API)

- **Entrada:** `ValidationPipe` + `class-validator` nos DTOs.
- **Sucesso:** 200/201 com corpo direto (padrão atual do projeto).
- **Erro:** JSON com `statusCode`, `error`, `message`, `timestamp`, `path` (Exception Filter global).

---

## 8. Definition of Done (contribuição)

- Sem regra de negócio pesada no controller; handler + Prisma onde couber.
- DTOs validados; mensagens legíveis em português quando possível.
- Swagger atualizado para endpoints novos ou alterados.
- Front: acessibilidade básica (foco, `aria-live` em feedbacks críticos).
- Build `web` + `api` passando.

---

## Decisões e trade-offs (resumo)

| Tema | Escolha |
|------|---------|
| Últimas aulas | Query indexada, não JSON cacheado no Student |
| Auth MVP | JWT; evoluir para Keycloak só em V3 |
| Avatar | R3F leve + fallback 2D / foto / reduce motion |
| Monorepo | `shared` para tipos; um CI, um lockfile |
| IA | Gemini no servidor; V2 pode expandir e offline |

---

*Atualizar este doc quando mudar fase de produto (V2/V3) ou arquitetura macro; detalhes de rotas e telas — sempre ROUTES-AND-API + README.*
