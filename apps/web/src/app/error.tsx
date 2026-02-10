'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main id="main" className="flex min-h-[60vh] flex-col items-center justify-center gap-6 p-8">
      <h1 className="text-xl font-bold text-white">Algo deu errado</h1>
      <p className="max-w-md text-center text-gray-400">
        Ocorreu um erro inesperado. Você pode tentar novamente ou voltar ao início.
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        <button
          type="button"
          onClick={() => reset()}
          className="rounded-lg bg-orbitus-accent px-4 py-2 font-medium text-white hover:opacity-90"
        >
          Tentar de novo
        </button>
        <Link
          href="/"
          className="rounded-lg border border-gray-600 px-4 py-2 text-gray-300 hover:bg-orbitus-card"
        >
          Ir para o início
        </Link>
        <Link
          href="/roster"
          className="rounded-lg border border-gray-600 px-4 py-2 text-gray-300 hover:bg-orbitus-card"
        >
          Roster
        </Link>
      </div>
    </main>
  );
}
