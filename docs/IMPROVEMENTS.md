# Melhorias para professores e gestores — Orbitus Classroom RPG

Lista priorizada **da menor para a maior** (UX rápida → funcionalidade → produto).  
Objetivo: tornar o app mais útil no dia a dia em sala de aula.

---

## Já existente (referência)

- Login, modo demo, Roster com busca/filtros/setas, modal do aluno, ficha (aula, bloqueios, metas, timeline), cadastro de aluno, dashboard (métricas + IA), logout.
- API: auth, students (CRUD, summary, lessons, blockers, goals), dashboard overview, tópicos.
- **Raso ou faltando:** turma no cadastro (API aceita `classGroupId`, front não envia); listar turmas (sem endpoint dedicado); navegação repetida em cada página; poucos feedbacks visuais ao salvar; sem edição de aluno; sem ordenação no Roster; sem exportação; sem destaque para metas perto do prazo.

---

## Lista de melhorias (ordem de implementação)

| # | Melhoria | Tipo | Descrição |
|---|----------|------|-----------|
| 1 | **Limpar filtros (Roster)** | UX | Botão "Limpar filtros" quando há busca/turma/status ativos; evita confusão quando a lista fica vazia. |
| 2 | **Home para usuário logado** | UX | Se já tem token: mostrar "Olá", links Roster/Dashboard e Sair; senão, manter botão Entrar e links atuais. |
| 3 | **Navegação global** | UX | Barra fixa (header) em todas as páginas internas: Roster, Dashboard, Cadastrar aluno, Início, Sair — mesma navegação em todo o app. |
| 4 | **API: GET /class-groups** | Backend | Listar turmas do professor para select no cadastro e consistência (turmas já vêm nos alunos; endpoint dedicado facilita formulários). |
| 5 | **Campo Turma no cadastro** | Front | No /students/new, select "Turma" (opcional) quando não é demo; buscar turmas da API (GET /class-groups) e enviar `classGroupId` no POST. |
| 6 | **Breadcrumb na ficha** | UX | Na ficha do aluno: "Roster > Nome do aluno" no topo para voltar ao contexto. |
| 7 | **Dashboard: link "Ver no Roster"** | UX | No card "Alunos sem aula há 7+ dias", link ou botão "Ver no Roster" (ou filtro sugerido) para ação rápida. |
| 8 | **Feedback ao salvar** | UX | Toast ou mensagem de sucesso ao registrar aula, criar/resolver bloqueio, criar/concluir meta ("Aula registrada!", "Bloqueio resolvido!"). |
| 9 | **Ordenação no Roster** | Front | Ordenar lista por nome (A–Z), XP (maior primeiro), nível (maior primeiro); dropdown ou toggle. |
| 10 | **Editar aluno (ficha)** | Back + Front | PATCH /students/:id (displayName, fullName, classGroupId, status); na ficha, botão "Editar dados" e form/modal. |
| 11 | **Metas: destaque de prazo** | Front | Metas com `deadlineAt` próximo (&lt; 3 dias): badge ou cor de alerta ("Prazo em 2 dias"). |
| 12 | **Relatório por turma** | Back + Front | Endpoint resumo por turma (ou expandir dashboard); card "Por turma" no Dashboard (XP médio, bloqueios, alunos). |
| 13 | **Exportar alunos (CSV)** | Back + Front | GET /students/export?format=csv (ou botão no Roster "Exportar CSV") para gestores levarem lista. |
| 14 | **Filtro "Sem aula há X dias"** | Back + Front | No Roster, opção "Sem aula há 7+ dias" (e.g. query param ou filtro que chama API com critério). |

---

## Ordem de execução

Implementar na ordem 1 → 14. Itens 1–8 são mais rápidos (UX e um endpoint); 9–14 envolvem mais backend ou fluxos novos.

---

## Status (itens 1–8 implementados)

| # | Status |
|---|--------|
| 1 | ✅ Limpar filtros (Roster) |
| 2 | ✅ Home para usuário logado |
| 3 | ✅ Navegação global (AppHeader) |
| 4 | ✅ API GET /students/class-groups |
| 5 | ✅ Campo Turma no cadastro |
| 6 | ✅ Breadcrumb na ficha |
| 7 | ✅ Dashboard: link "Ver no Roster" no card sem aula |
| 8 | ✅ Feedback ao salvar (toast na ficha: aula, bloqueio, meta) |
| 9 | ✅ Ordenação no Roster (nome, XP, nível) |
| 10 | ✅ Editar aluno (PATCH /students/:id + form na ficha) |
| 11 | ✅ Metas: destaque prazo (Atrasado, Prazo hoje, Prazo em X dias) |
| 12 | ✅ Relatório por turma (GET /dashboard/by-class + card no Dashboard) |
| 13 | ✅ Exportar CSV (botão no Roster, download da lista filtrada) |
| 14 | ✅ Filtro "Sem aula há 7+ / 14+ dias" (API noLessonSinceDays + select no Roster) |
