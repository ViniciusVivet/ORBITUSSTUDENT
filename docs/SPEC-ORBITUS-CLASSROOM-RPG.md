# Orbitus Classroom RPG — Especificação de Produto e Arquitetura

**Nome interno:** Orbitus Classroom RPG  
**Versão do doc:** 1.0  
**Stack:** Next.js 14+ (App Router), TypeScript, TailwindCSS, Framer Motion, R3F, NestJS, PostgreSQL, Prisma, JWT.

---

## 1. Escopo Detalhado (MVP / V2 / V3)

### 1.1 MVP (Fase 1)

| Funcionalidade | Descrição | Critérios de Aceite |
|----------------|-----------|----------------------|
| **Auth** | Login JWT com roles ADMIN e VIEWER | Login retorna token; rotas protegidas por role; refresh opcional (pode ser só re-login no MVP). |
| **Roster** | Lista de alunos em cards “party RPG” | Cards com avatar mini, nome/apelido, turma, nível, XP, status; setas ← → para navegar; busca por nome/código; filtros por turma, curso, nível, status. |
| **Modal 3D do aluno** | Ao hover/click no card, modal ~60% da tela | Modal com avatar 3D (ou fallback 2D), rotação leve, HUD: nível, XP, barras de habilidades, badges, últimas 5 aulas; botões: Registrar aula, Marcar bloqueio, Adicionar objetivo, Ver histórico. |
| **Ficha do aluno** | Tela detalhada do aluno | Linha do tempo de aulas, gráficos simples (ex.: evolução de XP/skills), tags, notas; navegação a partir do modal. |
| **Registrar aula** | Cadastro de aula por aluno | Form: aluno, data, duração, tópico (mapeado a skills), rating (1–5), observação; ao salvar: atualiza XP, skills, cache “últimas 5 aulas”. |
| **Bloqueios** | Registrar e gerenciar travamentos | Criar bloqueio: onde trava, severidade (1–3), tags, observação, status (ativo/resolvido); listar por aluno; atualizar status (resolver). |
| **Metas (Goals)** | Objetivos por aluno | CRUD de metas: descrição, status (pendente/em andamento/concluído), deadline opcional; listar na ficha e no modal. |
| **Dashboard do professor** | Visão agregada (sem IA) | Métricas: alunos sem aula há X dias, top evolução, top bloqueios por tópico, tempo médio por tema; aba “Insights IA” só layout + contrato (placeholder). |
| **Privacidade** | Dados mínimos e opcionais | Nome completo não obrigatório (apelido/código); avatar = templates ou opcional foto; campos sensíveis opcionais. |

**Entregável MVP:** Roster + Modal 3D + Ficha + Registrar aula + Bloqueios + Metas + Dashboard overview + Auth JWT.

---

### 1.2 V2 (Fase 2)

| Funcionalidade | Descrição | Critérios de Aceite |
|----------------|-----------|----------------------|
| **PWA offline** | App instalável e uso offline | Service worker, cache de assets e dados essenciais; indicador de offline; sync quando online. |
| **Sync** | Sincronização de dados offline→online | Fila de operações offline; conflitos tratados (last-write-wins ou merge por regra); indicador de “sincronizado”. |
| **Insights IA** | Aba ativa com sugestões | Integração com modelo (local ou API) para: sugestões de próximo tópico, detecção de padrão de bloqueio, resumo por aluno; sem obrigatoriedade de serviço pago. |
| **Templates de exercícios** | Exercícios automáticos por tema | Templates por tópico/skill; gerar “missão” para aluno; registrar conclusão como aula ou evento. |

---

### 1.3 V3 (Fase 3)

| Funcionalidade | Descrição | Critérios de Aceite |
|----------------|-----------|----------------------|
| **Keycloak** | SSO e identidade federada | Migrar auth para Keycloak; manter roles e contratos (ADMIN/VIEWER); sem refatorar domínio. |
| **Multi-escolas** | Tenant por escola/organização | Escopo de dados por tenant; seletor de escola para ADMIN; VIEWER vê apenas sua escola. |
| **Relatórios PDF** | Exportação de fichas e dashboards | Geração de PDF: ficha do aluno, resumo de turma, dashboard; lib gratuita (ex.: react-pdf, jsPDF ou Puppeteer em job). |

---

## 2. Diagrama Textual da Arquitetura

### 2.1 Visão geral do monorepo

```
OrbitusStudent/
├── apps/
│   ├── web/          # Next.js 14+ (App Router), R3F, Framer Motion
│   └── api/          # NestJS, Clean Architecture + CQRS
├── packages/
│   ├── shared/       # Tipos, DTOs, Zod schemas (consumido por web + api)
│   └── ui/           # (Opcional) Componentes compartilhados
├── docker-compose.yml
└── docs/
```

### 2.2 Camadas do Backend (NestJS)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        PRESENTATION (API)                                │
│  Controllers → Guards (Auth, Roles) → Swagger                            │
│  Apenas: receber request, chamar Mediator/CommandBus/QueryBus,          │
│  retornar resposta. Zero lógica de negócio.                              │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        APPLICATION (CQRS)                                │
│  Commands + CommandHandlers | Queries + QueryHandlers                    │
│  DTOs in/out, Validation (class-validator), Mappers,                     │
│  Result pattern (Success | Failure), orquestração.                       │
│  Handlers usam apenas interfaces de repositório (Domain).                │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        DOMAIN                                            │
│  Entities, Value Objects, Domain rules,                                  │
│  Repository interfaces (IStudentRepository, ILessonRepository, etc.)     │
│  Sem dependências de Nest, Prisma ou infra.                              │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        INFRASTRUCTURE                                    │
│  Prisma (Schema, Client), Repository implementations,                   │
│  JWT Strategy, Guards, Logs (estruturados), Exception Filters (global).  │
└─────────────────────────────────────────────────────────────────────────┘
```

### 2.3 Fluxo de uma requisição (ex.: Registrar Aula)

```
Client (Web)
    → POST /students/:id/lessons
    → Controller LessonsController.create()
    → CommandBus.execute(RegisterLessonCommand)
    → RegisterLessonHandler
        → IStudentRepository.findById()
        → ILessonRepository.create()
        → ISkillProgressRepository.upsert() / update
        → (atualizar “últimas 5” via repo ou evento)
    → Result → 201 + body ou 4xx/5xx
    → Exception Filter formata erro padrão
```

### 2.4 Frontend (Web) — fluxo de dados

```
App Router (Next.js)
    → Páginas: /roster, /students/[id], /dashboard
    → Componentes: RosterGrid, StudentCard, StudentModal3D, StudentHUD, etc.
    → API calls: fetch/axios para apps/api (ou BFF se no futuro)
    → packages/shared: tipos e Zod para validar respostas
    → R3F: Canvas só dentro do Modal 3D (lazy load)
```

### 2.5 Docker Compose (MVP)

```
┌──────────────┐   ┌──────────────┐   ┌──────────────┐
│   postgres   │   │  api (Nest)  │   │  web (Next)  │
│   :5432      │◄──│  :3001       │◄──│  :3000       │
└──────────────┘   └──────────────┘   └──────────────┘
```

---

## 3. Modelo de Dados (Tabelas e Relacionamentos)

### 3.1 Diagrama ER (textual)

```
TeacherUser (usuário professor/assistente)
  id, email, password_hash, role (ADMIN | VIEWER), created_at, updated_at

ClassGroup (turma – opcional)
  id, name, course, academic_period, created_at, updated_at

Student (aluno)
  id, class_group_id (FK, optional), teacher_user_id (FK, quem criou/gerencia)
  display_name (apelido/código), full_name (optional), avatar_type (template | emoji | photo)
  avatar_value (id do template, emoji ou path), photo_url (optional, privado)
  level, xp, status (active | inactive | archived)
  created_at, updated_at
  → Índices: teacher_user_id, class_group_id, status, level

Lesson (aula)
  id, student_id (FK), teacher_user_id (FK, quem registrou)
  held_at (date/time), duration_minutes, topic_id (FK Topic)
  rating (1-5), notes (text, optional)
  xp_earned (calculado ou persistido)
  created_at, updated_at
  → Índice: student_id, held_at

Topic (tópico de aula – mapeia para skills)
  id, name, slug, xp_weight (multiplicador), created_at, updated_at

TopicSkill (tópico → habilidades; N:N)
  topic_id (FK), skill_id (FK)

Skill (habilidade ex.: HTML, Lógica, Excel, Robótica)
  id, name, slug, color (hex), sort_order, created_at, updated_at

SkillProgress (progresso por habilidade por aluno)
  id, student_id (FK), skill_id (FK), current_xp, level (derivado ou armazenado)
  updated_at
  → UNIQUE(student_id, skill_id)

Blocker (trava/bloqueio)
  id, student_id (FK), teacher_user_id (FK)
  title_or_topic, severity (1-3), tags (array ou JSON), observation (text)
  status (active | resolved), resolved_at (optional), resolved_by (FK optional)
  created_at, updated_at
  → Índice: student_id, status

Goal (meta)
  id, student_id (FK), teacher_user_id (FK)
  title, description (optional), status (pending | in_progress | completed)
  deadline_at (optional), completed_at (optional)
  created_at, updated_at
  → Índice: student_id, status

Auditoria: em Lesson, Blocker, Goal sempre teacher_user_id + created_at, updated_at.
```

### 3.2 Tabelas em formato resumido (Prisma-style)

| Tabela | Principais campos |
|--------|--------------------|
| **TeacherUser** | id, email, passwordHash, role, createdAt, updatedAt |
| **ClassGroup** | id, name, course, academicPeriod, createdAt, updatedAt |
| **Student** | id, classGroupId?, teacherUserId, displayName, fullName?, avatarType, avatarValue, photoUrl?, level, xp, status, createdAt, updatedAt |
| **Topic** | id, name, slug, xpWeight, createdAt, updatedAt |
| **Skill** | id, name, slug, color, sortOrder, createdAt, updatedAt |
| **TopicSkill** | topicId, skillId (PK composta) |
| **Lesson** | id, studentId, teacherUserId, heldAt, durationMinutes, topicId, rating, notes?, xpEarned, createdAt, updatedAt |
| **SkillProgress** | id, studentId, skillId, currentXp, level?, updatedAt |
| **Blocker** | id, studentId, teacherUserId, titleOrTopic, severity, tags, observation, status, resolvedAt?, resolvedBy?, createdAt, updatedAt |
| **Goal** | id, studentId, teacherUserId, title, description?, status, deadlineAt?, completedAt?, createdAt, updatedAt |

### 3.3 Cache “últimas 5 aulas”

- **Opção A:** Coluna/materialized no Student (ex.: `last_lessons_summary` JSON) atualizada no RegisterLessonHandler.
- **Opção B:** Query otimizada: `Lesson` ordenado por `held_at DESC` LIMIT 5 por student_id (com índice).
- **Recomendação MVP:** Query otimizada (B) para evitar duplicação de dados; migrar para cache materializado se necessário para performance.

---

## 4. Commands e Queries (CQRS) — Mapeamento com Telas

### 4.1 Commands

| Command | Descrição | Endpoint / Trigger |
|---------|-----------|---------------------|
| **LoginCommand** | Autentica e retorna JWT | POST /auth/login |
| **CreateStudentCommand** | Cria aluno | POST /students |
| **UpdateStudentCommand** | Atualiza aluno | PATCH /students/:id |
| **RegisterLessonCommand** | Registra aula (atualiza XP e skills) | POST /students/:id/lessons |
| **AddBlockerCommand** | Cria bloqueio | POST /students/:id/blockers |
| **UpdateBlockerCommand** | Atualiza bloqueio (ex.: resolver) | PATCH /students/:id/blockers/:blockerId |
| **CreateGoalCommand** | Cria meta | POST /students/:id/goals |
| **UpdateGoalCommand** | Atualiza meta | PATCH /students/:id/goals/:goalId |

### 4.2 Queries

| Query | Descrição | Endpoint | Usado na tela |
|-------|-----------|----------|----------------|
| **GetStudentByIdQuery** | Aluno por id | GET /students/:id | Ficha do aluno, Modal (dados base) |
| **GetStudentSummaryQuery** | Resumo: últimas 5 aulas, barras, bloqueios ativos | GET /students/:id/summary | Modal 3D (HUD) |
| **ListStudentsQuery** | Lista com filtros (turma, curso, nível, status, busca) | GET /students | Roster |
| **ListLessonsQuery** | Aulas do aluno (paginação) | GET /students/:id/lessons | Ficha (linha do tempo) |
| **ListBlockersQuery** | Bloqueios do aluno | GET /students/:id/blockers | Modal, Ficha |
| **ListGoalsQuery** | Metas do aluno | GET /students/:id/goals | Modal, Ficha |
| **GetDashboardOverviewQuery** | Métricas agregadas (sem aula há X dias, top evolução, etc.) | GET /dashboard/overview | Dashboard do professor |

### 4.3 Matriz Tela → Commands/Queries

| Tela | Commands | Queries |
|------|----------|---------|
| **Login** | LoginCommand | — |
| **Roster** | — | ListStudentsQuery |
| **Modal 3D** | RegisterLesson, AddBlocker, CreateGoal (ações rápidas) | GetStudentSummaryQuery, GetStudentByIdQuery (se necessário) |
| **Ficha do aluno** | UpdateStudent, RegisterLesson, AddBlocker, UpdateBlocker, CreateGoal, UpdateGoal | GetStudentByIdQuery, ListLessonsQuery, ListBlockersQuery, ListGoalsQuery |
| **Dashboard** | — | GetDashboardOverviewQuery |

---

## 5. Backlog: Épicos → Histórias → Tarefas (Ordem sugerida)

### Épico 1: Fundação (Monorepo, Auth, Domínio base)

- **H1.1** Configurar monorepo (apps/web, apps/api, packages/shared), TypeScript, ESLint.
  - Tarefas: criar estrutura de pastas; config tsconfig paths; package.json workspaces; Docker Compose (postgres + api + web).
- **H1.2** Modelo de dados e migrações Prisma.
  - Tarefas: schema Prisma com todas as tabelas; migração inicial; seeds (Topic, Skill, TopicSkill, 1 TeacherUser).
- **H1.3** Auth JWT (login + guards + roles).
  - Tarefas: módulo Auth (LoginCommand/Handler); JWT strategy; Guards (JwtAuthGuard, RolesGuard); decorator @Roles; preparar DTOs em shared (Zod ou types).
- **H1.4** Estrutura Clean + CQRS no Nest (CommandBus/QueryBus, módulos por domínio).
  - Tarefas: módulo CQRS (Mediator ou @nestjs/cqrs); pasta domain/application/infrastructure por contexto; Exception Filter global; Result pattern base.

### Épico 2: Alunos (CRUD + listagem)

- **H2.1** CRUD Student (Commands/Queries + repositórios).
  - Tarefas: CreateStudent, UpdateStudent, GetStudentById, ListStudents; repositórios Prisma; DTOs e validação; controllers e Swagger.
- **H2.2** Endpoints de suporte: ClassGroup (listar para filtros), Topic/Skill (listar para formulários).
  - Tarefas: ListClassGroupsQuery, ListTopicsQuery, ListSkillsQuery; endpoints GET.

### Épico 3: Aulas e progresso (XP, skills, últimas 5)

- **H3.1** Registrar aula (RegisterLessonCommand).
  - Tarefas: RegisterLessonCommand/Handler; cálculo XP (rating * duration * topic.xpWeight); atualização de SkillProgress por TopicSkill; persistir Lesson; query “últimas 5” ou cache.
- **H3.2** GetStudentSummary (resumo para HUD).
  - Tarefas: GetStudentSummaryQuery/Handler; DTO com lastLessons, skillBars, activeBlockersCount; endpoint GET /students/:id/summary.

### Épico 4: Bloqueios e metas

- **H4.1** Bloqueios (Add, List, Update status).
  - Tarefas: AddBlockerCommand, UpdateBlockerCommand; ListBlockersQuery; repositório; endpoints POST/GET/PATCH.
- **H4.2** Metas (CRUD Goals).
  - Tarefas: CreateGoal, UpdateGoal; ListGoalsQuery; repositório; endpoints POST/GET/PATCH/DELETE se necessário.

### Épico 5: Dashboard professor

- **H5.1** Dashboard overview (métricas agregadas).
  - Tarefas: GetDashboardOverviewQuery: alunos sem aula há X dias, top evolução (XP/semana ou mês), top bloqueios por tópico, tempo médio por tema; endpoint GET /dashboard/overview.
- **H5.2** Aba “Insights IA” (layout + contrato).
  - Tarefas: Componente placeholder na dashboard; contrato de API (ex.: GET /dashboard/insights retornando 501 ou mock).

### Épico 6: Frontend — Roster e navegação

- **H6.1** Layout base e tema (Tailwind, Framer Motion).
  - Tarefas: tema (cores, tipografia “RPG”); layout com sidebar/nav; rota /roster.
- **H6.2** Roster: lista de alunos (cards), busca e filtros.
  - Tarefas: ListStudentsQuery (chamada API); cards “party RPG” (avatar mini, nome, turma, nível, XP, status); setas ← →; busca; filtros (turma, nível, status).
- **H6.3** Navegação por teclado e acessibilidade básica.
  - Tarefas: foco em cards; Enter abre modal; setas navegam entre cards.

### Épico 7: Frontend — Modal 3D e HUD

- **H7.1** Modal 60% com animação (Framer Motion).
  - Tarefas: modal fullscreen overlay; conteúdo 60% central; animação de entrada/saída; fechar por ESC e clique fora.
- **H7.2** Área 3D (R3F) com avatar padrão e fallback 2D.
  - Tarefas: Canvas R3F lazy-loaded; avatar: modelo padrão (glb/gltf) ou emoji/ícone ou imagem; rotação leve; fallback 2D (img ou div estilizado) se WebGL falhar ou mobile.
- **H7.3** HUD no modal: nível, XP, barras de habilidades, badges, últimas 5 aulas.
  - Tarefas: GetStudentSummary na abertura do modal; componentes HUD (barras, lista de aulas); botões: Registrar aula, Marcar bloqueio, Adicionar objetivo, Ver histórico (link para ficha).
- **H7.4** Formulários rápidos no modal (Registrar aula, Bloqueio, Objetivo).
  - Tarefas: formulários inline ou sub-modais; chamada aos Commands; atualizar summary após submit.

### Épico 8: Frontend — Ficha do aluno e Dashboard

- **H8.1** Ficha do aluno: linha do tempo, gráficos simples, tags, notas.
  - Tarefas: rota /students/[id]; GetStudentById + ListLessons + ListBlockers + ListGoals; timeline de aulas; gráfico simples (ex.: XP ou skills); seção tags/notas.
- **H8.2** Dashboard do professor: cards de métricas e aba Insights IA.
  - Tarefas: rota /dashboard; GetDashboardOverview; cards (sem aula há X dias, top evolução, top bloqueios, tempo médio); aba “Insights IA” com placeholder.

### Ordem de implementação (evitar retrabalho)

1. Épico 1 (fundação)  
2. Épico 2 (alunos)  
3. Épico 3 (aulas + summary)  
4. Épico 4 (bloqueios + metas)  
5. Épico 5 (dashboard backend)  
6. Épico 6 (roster frontend)  
7. Épico 7 (modal 3D + HUD)  
8. Épico 8 (ficha + dashboard frontend)  

---

## 6. Sugestões de UX (Modal 3D, Fallback 2D, Performance)

### 6.1 Modal 3D

- **Tamanho:** ~60% da viewport (max-width/max-height), centralizado; em mobile pode ir para 90% ou fullscreen.
- **Entrada:** animação Framer Motion (scale 0.95→1, opacity 0→1, 200–300 ms); opcional: blur no backdrop.
- **Avatar 3D:**
  - Um único modelo padrão (ex.: personagem neutro) com variações por “classe” ou cor (escolhido no avatar_value).
  - Câmera fixa ou orbit controls com rotação automática leve (e.g. 0.01 rad/frame).
  - Iluminação: ambiente + direcional para evitar sombras pesadas; fundo escuro ou gradiente para contraste.
- **Lazy load:** carregar R3F/Canvas apenas quando o modal abrir; desmontar quando fechar para liberar contexto WebGL.

### 6.2 Fallback 2D

- **Quando usar:** detectar falha ao criar WebGL context, ou device com pouca memória, ou preferência “reduzir movimento”.
- **Implementação:** tentar mount do Canvas; em catch ou flag (ex.: `!supportsWebGL`), renderizar em vez disso uma div com:
  - Imagem do template (avatar_value = id do template → URL de sprite/PNG), ou
  - Emoji grande (avatar_value = emoji), ou
  - Foto do aluno (photo_url) se existir e for permitido.
- **Transição:** mesma animação do modal; usuário não precisa saber se está 3D ou 2D.

### 6.3 Performance

- **Roster:** virtualizar lista se > 50 alunos (ex.: react-window ou tanstack-virtual).
- **Modal:** não carregar 3D até o modal abrir; limitar polígonos do modelo (ex.: < 5k tri).
- **API:** summary com “últimas 5” em uma query; evitar N+1; índices em student_id, held_at, status.
- **Imagens:** avatar templates em WebP; lazy load imagens nos cards do roster.

### 6.4 Acessibilidade

- Modal: foco preso (focus trap); primeiro foco no botão fechar ou no HUD.
- Contraste: barras e textos do HUD legíveis (WCAG AA).
- Reduzir movimento: respeitar `prefers-reduced-motion` (desativar rotação automática do 3D, animações mais curtas).

---

## 7. Regras de Validação e Erros (Padrão de Resposta, Status Codes)

### 7.1 Validação

- **Backend:** ValidationPipe do Nest (class-validator nos DTOs); mensagens em português se desejado.
- **Frontend:** packages/shared com Zod (ou class-validator) para validar respostas da API antes de usar.
- **Regras de negócio nos Handlers:** ex.: “aluno deve existir”, “topic deve existir”, “rating 1–5”; falha → Result.fail() ou throw DomainException.

### 7.2 Padrão de resposta HTTP

- **Sucesso:**
  - 200: GET (body = payload).
  - 201: POST que cria recurso (body = recurso criado ou { id }).
  - 204: PATCH/DELETE sem body.
- **Corpo de sucesso (envelope opcional):**
  - Opção A: `{ "data": T }` para todos os GET.
  - Opção B: body direto (T) e erro sempre em envelope.
  - Recomendação: envelope de erro único; sucesso pode ser body direto para reduzir verbosidade.

### 7.3 Padrão de erro (API)

- **Formato único (JSON):**
```json
{
  "statusCode": 400,
  "error": "Bad Request",
  "message": "Mensagem legível ou array de erros de validação",
  "timestamp": "ISO8601",
  "path": "/students/xxx/lessons"
}
```
- **statusCode:** 400 (validação/regra), 401 (não autenticado), 403 (sem permissão), 404 (não encontrado), 409 (conflito), 500 (erro interno).
- **Exception Filter global:** captura exceções do Nest e de domínio; log estruturado (sem stack em produção no body); retorna o JSON acima.

### 7.4 Regras de negócio que retornam erro

- Aluno não encontrado → 404.
- Tópico ou Skill inexistente ao registrar aula → 400.
- Rating fora de 1–5 → 400 (ValidationPipe).
- Severity fora de 1–3 → 400.
- VIEWER tentando criar/aluno de outro professor (se multi-tenant no futuro) → 403.

---

## 8. Checklist de Definition of Done

- [ ] **Código:** segue padrão do projeto (Clean, CQRS); sem lógica de negócio em controllers; handlers usam repositórios.
- [ ] **Testes:** pelo menos testes unitários dos Handlers (Commands/Queries) e validação de DTOs; opcional: e2e nos endpoints críticos.
- [ ] **Validação:** entradas validadas (DTO + regras de domínio); mensagens claras.
- [ ] **Erros:** erros mapeados para status HTTP e corpo padrão; log estruturado em falhas.
- [ ] **Documentação:** Swagger atualizado para endpoints alterados/criados.
- [ ] **Frontend:** componente acessível (foco, contraste); fallback 2D para avatar quando aplicável.
- [ ] **Performance:** sem N+1; queries com índices adequados; modal 3D lazy-loaded.
- [ ] **Privacidade:** não exigir nome completo; avatar e foto tratados conforme especificação.
- [ ] **Build/Deploy:** build do monorepo (web + api) e Docker Compose passando.

---

## Resumo de decisões e trade-offs

| Decisão | Escolha | Motivo |
|---------|---------|--------|
| Cache “últimas 5” | Query otimizada no MVP | Menos complexidade; índice (student_id, held_at) suficiente. |
| Auth | JWT simples no MVP | Rápido; preparar interface de “AuthService” para trocar por Keycloak depois. |
| Avatar 3D | Modelo padrão + fallback 2D | Evita dependência de foto real; performance e acessibilidade. |
| Result pattern | Success/Failure nos handlers | Erros de domínio sem exceção em fluxo esperado; fácil de testar. |
| Monorepo | apps + packages | Código compartilhado (tipos/DTOs); um repo, um CI. |
| Insights IA no MVP | Só layout + contrato | Evita escopo; contrato estável para V2. |

---

*Documento vivo: atualizar ao longo do projeto (decisões, novos endpoints, ajustes de backlog).*
