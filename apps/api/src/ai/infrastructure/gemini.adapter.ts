import { GoogleGenerativeAI } from '@google/generative-ai';
import { IAiProvider } from '../ports/ai-provider.port';

const MODEL = 'gemini-1.5-flash';
const UNAVAILABLE_MESSAGE = 'Assistente indisponível: configure GEMINI_API_KEY no .env da API.';

/**
 * Adapter que implementa IAiProvider usando a API Gemini (Google).
 * Recebe a API key por injeção; a leitura de env fica no módulo (composition root).
 */
export class GeminiAdapter implements IAiProvider {
  private readonly model: ReturnType<GoogleGenerativeAI['getGenerativeModel']> | null;

  constructor(apiKey: string | undefined) {
    const key = apiKey?.trim();
    if (key) {
      const genAI = new GoogleGenerativeAI(key);
      this.model = genAI.getGenerativeModel({ model: MODEL });
    } else {
      this.model = null;
    }
  }

  isAvailable(): boolean {
    return this.model != null;
  }

  async generateContent(prompt: string): Promise<string> {
    if (!this.model) {
      return UNAVAILABLE_MESSAGE;
    }
    try {
      const result = await this.model.generateContent(prompt);
      const text = result.response.text();
      return text ?? 'Sem resposta.';
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      return `Erro ao consultar o assistente: ${msg}`;
    }
  }
}
