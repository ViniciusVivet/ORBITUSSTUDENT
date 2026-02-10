# Melhorias — Segunda rodada (após 1–14 concluídos)

Lista priorizada **da menor para a maior**. Objetivo: polir UX, acessibilidade e edge cases.

---

## Lista (ordem de implementação)

| # | Melhoria | Tipo | Descrição |
|---|----------|------|-----------|
| 1 | **Dashboard "Por turma" no demo** | UX | No modo demo, exibir cards "Por turma" com dados mock (derivados dos alunos de exemplo) em vez de seção vazia. |
| 2 | **Página 404** | UX | Página customizada para rota não encontrada (link para Início e Roster). |
| 3 | **Título por página** | UX | `document.title` por rota: "Roster — Orbitus", "Dashboard — Orbitus", "Ficha de [nome] — Orbitus". |
| 4 | **Skip link** | A11y | Link "Pular para conteúdo" no topo para teclado e leitores de tela. |
| 5 | **Confirmação ao concluir meta** | UX | Antes de marcar meta como concluída, opção "Tem certeza?" (ou toast reversível). |
| 6 | **Turmas no cadastro (demo)** | UX | No modo demo, mostrar select "Turma" com opções mock (ex.: Turma A, Turma B) para consistência com o fluxo real. |
| 7 | **Link do card "Por turma" para Roster** | UX | Cada card "Por turma" no Dashboard com link "Ver alunos" → /roster?classGroupId=... (quando API retorna classGroupId). |
| 8 | **Mensagens de validação** | UX | Formulários com mensagens de erro mais claras (ex.: "Preencha o nome" em vez de genérico). |
| 9 | **Paginação ou "Carregar mais" no Roster** | Back + Front | Se muitos alunos, usar limit/offset na API e botão "Carregar mais" ou paginação no front. |
| 10 | **Loading skeleton** | UX | Em vez de só "Carregando...", skeleton nos cards do Roster e na ficha para percepção de velocidade. |

---

## Status

| # | Status |
|---|--------|
| 1 | ✅ Dashboard "Por turma" no demo (dados derivados dos mocks) |
| 2 | ✅ Página 404 customizada (Início + Roster) |
| 3 | ✅ Título por página (Roster, Dashboard, Ficha, Cadastrar, Entrar) |
| 4 | ✅ Skip link "Pular para o conteúdo" + id="main" nas páginas |
| 5 | ✅ Confirmação ao concluir meta ("Marcar como concluída?") |
| 6 | ✅ Turmas no cadastro (demo) com MOCK_CLASS_GROUPS | |
| 7 | ✅ Link "Ver alunos" nos cards Por turma + Roster lê classGroupId da URL | |
| 8 | ✅ Mensagens de validação (cadastro, ficha: aula, bloqueio, meta, editar dados) | |
| 9 | ✅ Paginação / "Carregar mais" no Roster (API limit/offset; demo displayCount) | |
| 10 | ✅ Loading skeleton no Roster e na ficha do aluno | |
