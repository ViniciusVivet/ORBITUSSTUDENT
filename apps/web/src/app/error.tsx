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
    <main id="main" className="page-shell flex flex-col items-center justify-center gap-6">
      <h1 className="text-xl font-bold text-white">Algo deu errado</h1>
      <p className="max-w-md text-center text-gray-400">
        Ocorreu um erro inesperado. Você pode tentar novamente ou voltar ao início.
      </p>
      <div className="flex w-full max-w-sm flex-col gap-3 touch-manipulation sm:max-w-none sm:flex-row sm:flex-wrap sm:justify-center">
        <button
          type="button"
          onClick={() => reset()}
          className="min-h-11 rounded-lg bg-orbitus-accent px-4 py-2.5 font-medium text-white hover:opacity-90 sm:min-h-0 sm:py-2"
        >
          Tentar de novo
        </button>
        <Link
          href="/"
          className="inline-flex min-h-11 items-center justify-center rounded-lg border border-gray-600 px-4 py-2.5 text-gray-300 hover:bg-orbitus-card sm:min-h-0 sm:py-2"
        >
          Ir para o início
        </Link>
        <Link
          href="/roster"
          className="inline-flex min-h-11 items-center justify-center rounded-lg border border-gray-600 px-4 py-2.5 text-gray-300 hover:bg-orbitus-card sm:min-h-0 sm:py-2"
        >
          Roster
        </Link>
      </div>
    </main>
  );
}
