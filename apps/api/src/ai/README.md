# Módulo AI — Arquitetura limpa

Estrutura em camadas (portas e adapters):

```
ai/
├── ports/                    # Contratos (abstrações)
│   └── ai-provider.port.ts   # IAiProvider: generateContent(prompt), isAvailable()
├── application/              # Casos de uso (orquestração)
│   ├── app-context.ts       # Contexto estático do app (domínio da aplicação)
│   └── ai.service.ts        # AiService: monta prompts, usa a porta (não conhece Gemini)
├── infrastructure/           # Adaptadores (detalhes externos)
│   └── gemini.adapter.ts    # GeminiAdapter implementa IAiProvider (SDK Google)
├── ai.controller.ts          # Entrada HTTP (só delega ao AiService)
├── ai.module.ts             # Composition root: liga AI_PROVIDER → GeminiAdapter(env)
└── README.md
```

- **Controller** não conhece provedor nem contexto; só chama o serviço.
- **AiService** depende apenas de `IAiProvider`; monta o prompt com `APP_CONTEXT` e chama a porta.
- **GeminiAdapter** é o único que usa `@google/generative-ai`; recebe a API key por construtor (injetada no módulo via `useFactory`).
- **Configuração** (`GEMINI_API_KEY`) é lida apenas no `ai.module.ts` (composition root), não no serviço nem no adapter.

Para trocar o provedor (ex.: OpenAI, Groq), basta criar outro adapter que implemente `IAiProvider` e registrar no módulo.
