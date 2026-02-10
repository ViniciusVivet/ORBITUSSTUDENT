# Melhorias — Terceira rodada (por impacto)

Lista priorizada **por impacto** (alto → médio → baixo). Objetivo: performance, acessibilidade e resiliência.

---

## Lista (ordem de impacto)

| Impacto | # | Melhoria | Descrição |
|---------|---|----------|-----------|
| Alto | 1 | **Debounce na busca do Roster** | Evitar refetch a cada tecla; usar debounce (ex.: 400 ms) no termo de busca enviado à API. |
| Alto | 2 | **Toast acessível (aria-live)** | Toast na ficha com `role="status"` e `aria-live="polite"` para leitores de tela. |
| Médio | 3 | **Focus trap no modal do aluno** | Manter foco dentro do modal até fechar (Tab circula; Escape já fecha). |
| Médio | 4 | **Error boundary** | Componente que capture erros e exiba "Algo deu errado" com opção de recarregar. |
| Baixo | 5 | **Empty state do Dashboard** | Quando overview retorna zeros, mensagem amigável em vez de só números. |
| Baixo | 6 | **Retry em falha de carregamento** | Botão "Tentar de novo" na ficha e no Roster quando a API falha. |

---

## Status

| # | Status |
|---|--------|
| 1 | ✅ Debounce 400 ms na busca (API) |
| 2 | ✅ Toast com role="status" aria-live="polite" aria-atomic="true" |
| 3 | ✅ Focus trap no modal (Tab circula; role="dialog" aria-modal) |
| 4 | ✅ Error boundary (app/error.tsx com Tentar de novo + links) |
| 5 | ✅ Empty state Dashboard (quando métricas zeradas) |
| 6 | ✅ Retry: Roster e ficha do aluno com botão "Tentar de novo" |
