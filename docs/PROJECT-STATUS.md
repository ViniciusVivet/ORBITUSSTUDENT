# Status do Projeto — Orbitus Classroom RPG

Documento atualizado para saber **o que já está pronto**, **o que usa dados mock** e **o que depende da API/banco**. Use como referência ao retomar o projeto ou ao conectar a API.

---

## Como testar sem API (modo demo)

Você **não precisa** de PostgreSQL nem da API para ver o site funcionando.

1. Na pasta do projeto: `pnpm install` e depois `pnpm dev:web`.
2. Abra **http://localhost:3000**.
3. Na tela de login, clique em **“Modo demo (testar sem API)”**.
4. Você entra no Roster com **4 alunos de exemplo** (João, Maria, Pedro, Ana). Pode:
   - **Buscar e filtrar** por nome, turma e status.
   - **Navegar com setas** ← → no teclado (ou botões) e Enter para abrir o modal.
   - **Clicar em qualquer card** → abre o modal do aluno (HUD, habilidades, últimas aulas).
   - No modal: **Registrar aula**, **Marcar bloqueio** e **Adicionar objetivo** levam à ficha com o formulário já aberto.
   - **Ver histórico** → ficha completa com timeline de aulas, bloqueios, metas e registrar aula.
   - **Cadastrar aluno** → novo aluno no Roster (localStorage no demo); **mais opções de avatar** (emojis e templates).
   - **Dashboard** → métricas de exemplo; **Sair** para logout. Badge **"Modo demo"** no canto da tela.

No modo demo **nada é enviado ao servidor**. Os dados vêm de `apps/web/src/lib/mock-data.ts` e, no cadastro, do `localStorage`. Para sair do demo, clique em **Sair** (Roster ou Dashboard) e use o login real (e-mail/senha) com a API ligada.

---

## O que está pronto (frontend)

| Tela / recurso | Com API | Modo demo (mock) |
|----------------|---------|-------------------|
| Login (e-mail/senha) | ✅ | — |
| **Modo demo** (entrar sem API) | — | ✅ |
| Roster (lista de alunos) | ✅ | ✅ 4 alunos + os que você cadastrar no demo |
| **Busca e filtros** no Roster (nome, turma, status) | ✅ | ✅ |
| **Navegação por setas** (← → e Enter no teclado; botões Anterior/Próximo) | ✅ | ✅ |
| Modal do aluno (~60%, HUD, barras, últimas aulas) | ✅ | ✅ com dados variados por aluno |
| **Ações no modal** (links para Registrar aula, Marcar bloqueio, Adicionar objetivo na ficha) | ✅ | ✅ |
| Ficha do aluno (/students/[id]) | ✅ | ✅ |
| Registrar aula (na ficha) | ✅ | ✅ formulário (salva só com API) |
| Bloqueios (listar, criar, resolver na ficha) | ✅ | ✅ mock lista + formulário |
| **Metas** (listar, criar, concluir na ficha) | ✅ | ✅ mock lista + formulário |
| **Timeline** de últimas aulas na ficha | ✅ | ✅ |
| Cadastrar aluno (/students/new) | ✅ | ✅ (localStorage no demo); **mais avatares** (emojis + templates) |
| Dashboard do professor | ✅ | ✅ métricas mock ou da API |
| Logout (Sair) | ✅ | ✅ |
| **Badge "Modo demo"** (canto da tela) | — | ✅ |
| **Modal responsivo** e **prefers-reduced-motion** | ✅ | ✅ |
| Navegação (Roster, Dashboard, Início, Sair) | ✅ | ✅ |

---

## O que está pronto (backend / API)

| Recurso | Status |
|---------|--------|
| Auth JWT (POST /auth/login) | ✅ |
| Listar alunos (GET /students) | ✅ |
| Detalhe do aluno (GET /students/:id) | ✅ |
| Resumo do aluno (GET /students/:id/summary) | ✅ |
| Criar aluno (POST /students) | ✅ |
| Listar tópicos (GET /students/topics) | ✅ |
| Registrar aula (POST /students/:id/lessons) | ✅ (atualiza XP e habilidades) |
| Dashboard overview (GET /dashboard/overview) | ✅ |
| Listar bloqueios (GET /students/:id/blockers) | ✅ |
| Criar bloqueio (POST /students/:id/blockers) | ✅ |
| Atualizar bloqueio/resolver (PATCH .../blockers/:blockerId) | ✅ |
| Listar/criar/atualizar metas (GET/POST/PATCH .../goals) | ✅ |

---

## O que depende da API e do banco

Quando você **conectar a API e o PostgreSQL** (seguindo o README):

- Login com **prof@escola.com** / **senha123** (após rodar o seed).
- Lista de alunos **vinda do banco** (e cadastro pelo site ou Swagger).
- Resumo e ficha do aluno **vindos da API**.
- Cadastro de aluno **persistido no banco**.

Ou seja: o mesmo frontend funciona em **modo demo (só mocks)** ou **com API e banco (dados reais)**. A troca é automática: se você entrar com “Modo demo”, usa mocks; se entrar com e-mail/senha e a API estiver no ar, usa a API.

---

## Onde estão os mocks

- **Definição dos dados:** `apps/web/src/lib/mock-data.ts`  
  - Lista de alunos (João, Maria, Pedro, Ana), resumos por aluno (últimas aulas, barras de habilidade), **bloqueios** e **metas** mock, métricas do dashboard, e funções para modo demo (localStorage para alunos cadastrados no demo).
- **Uso:** as páginas (roster, modal, ficha, dashboard, cadastro) checam `isDemoMode()` e, se for true, usam essas funções em vez de chamar a API.

---

## Próximos passos sugeridos (especificação)

Conforme o **docs/SPEC-ORBITUS-CLASSROOM-RPG.md**:

1. **Metas (goals)** — API CRUD (GET/POST/PATCH /students/:id/goals) quando for usar banco; front já tem lista/form em mock.
2. **Avatar 3D** no modal (R3F) e fallback 2D.
3. V2: PWA, sync, Insights IA.

---

*Última atualização: fev/2025 — metas, busca/filtros, setas, ações no modal, timeline, avatares, badge demo, responsivo, reduced motion; doc atualizado.*
