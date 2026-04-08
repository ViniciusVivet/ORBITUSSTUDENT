'use client';

import { useEffect, useState, useRef } from 'react';
import { isDemoMode } from '@/lib/mock-data';
import { fetchAiStatus, fetchAiInsights, sendAiChat } from '@/lib/api/dashboard';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export function AiSection() {
  const [insights, setInsights] = useState<string | null>(null);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatSending, setChatSending] = useState(false);
  const [aiAvailable, setAiAvailable] = useState<boolean | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isDemoMode()) return;
    fetchAiStatus()
      .then((data) => {
        setAiAvailable(data.available);
        if (data.available) {
          setInsightsLoading(true);
          return fetchAiInsights();
        }
        return null;
      })
      .then((data) => { if (data?.insights) setInsights(data.insights); })
      .catch(() => setAiAvailable(false))
      .finally(() => setInsightsLoading(false));
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  async function handleSendChat() {
    const msg = chatInput.trim();
    if (!msg || chatSending) return;
    setChatMessages((prev) => [...prev, { role: 'user', content: msg }]);
    setChatInput('');
    setChatSending(true);
    try {
      const data = await sendAiChat(msg);
      setChatMessages((prev) => [...prev, { role: 'assistant', content: data.reply }]);
    } finally {
      setChatSending(false);
    }
  }

  return (
    <div className="mt-10 space-y-4">
      {/* Insights */}
      <div className="card-base p-5">
        <div className="mb-4 flex items-center gap-3">
          <span className="text-xl">🤖</span>
          <h2 className="section-title">Insights IA</h2>
          {aiAvailable === true && (
            <span className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs font-medium text-emerald-400 ring-1 ring-emerald-500/30">Ativo</span>
          )}
          {aiAvailable === false && !isDemoMode() && (
            <span className="rounded-full bg-amber-500/15 px-2.5 py-0.5 text-xs text-amber-400 ring-1 ring-amber-500/30">GEMINI_API_KEY não configurado</span>
          )}
          {isDemoMode() && (
            <span className="rounded-full bg-orbitus-border/50 px-2.5 py-0.5 text-xs text-gray-500">Modo demo</span>
          )}
        </div>
        {insightsLoading && (
          <div className="space-y-2">
            <div className="h-3 w-3/4 animate-pulse rounded bg-orbitus-border" />
            <div className="h-3 w-1/2 animate-pulse rounded bg-orbitus-border" />
          </div>
        )}
        {!insightsLoading && insights && (
          <p className="whitespace-pre-wrap text-sm text-gray-300 leading-relaxed">{insights}</p>
        )}
        {!insightsLoading && !insights && !isDemoMode() && aiAvailable === false && (
          <p className="text-sm text-gray-500">Adicione GEMINI_API_KEY no .env da API e reinicie.</p>
        )}
        {!insightsLoading && !insights && isDemoMode() && (
          <p className="text-sm text-gray-500">Conecte a API para ver insights do Gemini.</p>
        )}
      </div>

      {/* Chat */}
      <div className="card-base p-5">
        <div className="mb-4 flex items-center gap-3">
          <span className="text-xl">💬</span>
          <h2 className="section-title">Assistente IA</h2>
          {aiAvailable === true && (
            <span className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs font-medium text-emerald-400 ring-1 ring-emerald-500/30">Ativo</span>
          )}
        </div>
        <div className="max-h-72 min-h-[80px] overflow-y-auto rounded-lg border border-orbitus-border bg-orbitus-surface p-3">
          {chatMessages.length === 0 && (
            <p className="text-sm text-gray-600">Ex.: "O que falta implementar?", "Sugira melhorias de UX"</p>
          )}
          {chatMessages.map((m, i) => (
            <div key={i} className={`mb-3 flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] rounded-xl px-3 py-2 text-sm ${m.role === 'user' ? 'bg-orbitus-accent/25 text-gray-100' : 'bg-orbitus-card text-gray-200'}`}>
                {m.content}
              </div>
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>
        <div className="mt-3 flex gap-2">
          <input
            type="text"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && void handleSendChat()}
            placeholder="Pergunta ou sugestão..."
            className="input-field flex-1 text-sm"
          />
          <button
            type="button"
            onClick={() => void handleSendChat()}
            disabled={chatSending}
            className="btn-primary shrink-0 px-4 py-2 text-sm disabled:opacity-50"
          >
            {chatSending ? '…' : 'Enviar'}
          </button>
        </div>
      </div>
    </div>
  );
}
