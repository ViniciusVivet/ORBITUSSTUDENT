/**
 * Porta (interface) do provedor de IA.
 * A camada de aplicação depende apenas desta abstração; a implementação
 * (ex.: Gemini) fica em infrastructure (adapter).
 */
export const AI_PROVIDER = Symbol('AI_PROVIDER');

export interface IAiProvider {
  /**
   * Gera conteúdo a partir de um prompt. Sempre retorna string (em erro, mensagem amigável).
   */
  generateContent(prompt: string): Promise<string>;

  /**
   * Indica se o provedor está configurado e disponível.
   */
  isAvailable(): boolean;
}
