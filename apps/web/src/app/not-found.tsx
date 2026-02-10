import Link from 'next/link';

export default function NotFound() {
  return (
    <main id="main" className="flex min-h-screen flex-col items-center justify-center gap-6 p-8">
      <h1 className="text-4xl font-bold text-orbitus-accent">Página não encontrada</h1>
      <p className="text-gray-400">A rota que você acessou não existe.</p>
      <div className="flex gap-4">
        <Link
          href="/"
          className="rounded-lg bg-orbitus-accent px-6 py-3 font-medium text-white transition hover:opacity-90"
        >
          Início
        </Link>
        <Link
          href="/roster"
          className="rounded-lg border border-orbitus-accent px-6 py-3 font-medium text-orbitus-accent transition hover:bg-orbitus-accent/10"
        >
          Roster
        </Link>
      </div>
    </main>
  );
}
