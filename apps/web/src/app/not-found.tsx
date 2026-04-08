import Link from 'next/link';

export default function NotFound() {
  return (
    <main id="main" className="page-shell flex flex-col items-center justify-center gap-6 text-center">
      <h1 className="text-3xl font-bold text-orbitus-accent sm:text-4xl">Página não encontrada</h1>
      <p className="text-gray-400">A rota que você acessou não existe.</p>
      <div className="flex w-full max-w-xs flex-col gap-3 touch-manipulation sm:max-w-none sm:flex-row sm:justify-center sm:gap-4">
        <Link
          href="/"
          className="inline-flex min-h-12 items-center justify-center rounded-lg bg-orbitus-accent px-6 py-3 font-medium text-white transition hover:opacity-90 sm:min-h-0"
        >
          Início
        </Link>
        <Link
          href="/roster"
          className="inline-flex min-h-12 items-center justify-center rounded-lg border border-orbitus-accent px-6 py-3 font-medium text-orbitus-accent transition hover:bg-orbitus-accent/10 sm:min-h-0"
        >
          Roster
        </Link>
      </div>
    </main>
  );
}
