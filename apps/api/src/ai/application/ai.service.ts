import { Inject, Injectable } from '@nestjs/common';
import { AI_PROVIDER, IAiProvider } from '../ports/ai-provider.port';
import { APP_CONTEXT } from './app-context';

/**
 * Serviço de aplicação (caso de uso): orquestra o contexto do app e a porta de IA.
 * Não conhece Gemini nem env; depende apenas da abstração IAiProvider.
 */
@Injectable()
export class AiService {
  constructor(
    @Inject(AI_PROVIDER) private readonly aiProvider: IAiProvider,
  ) {}

  isAvailable(): boolean {
    return this.aiProvider.isAvailable();
  }

  async chat(userMessage: string): Promise<string> {
    const prompt = `${APP_CONTEXT}\n\n---\n\nMensagem do usuário:\n${userMessage}`;
    return this.aiProvider.generateContent(prompt);
  }

  async getInsights(): Promise<string> {
    const prompt = `${APP_CONTEXT}\n\n---\n\nCom base no contexto acima, escreva em 2 ou 3 frases curtas sugestões de melhorias ou prioridades para o próximo passo do projeto (UX, funcionalidade ou técnico). Seja direto.`;
    const raw = await this.aiProvider.generateContent(prompt);
    return raw && !raw.includes('indisponível') && !raw.includes('Erro ao')
      ? raw
      : raw ?? 'Nenhum insight no momento.';
  }
}
