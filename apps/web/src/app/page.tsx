import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <h1 className="mb-4 text-3xl font-bold text-orbitus-accent">
        Orbitus Classroom RPG
      </h1>
      <p className="mb-8 text-gray-400">
        Dashboard gamificado para acompanhar seus alunos
      </p>
      <div className="flex flex-wrap justify-center gap-4">
        <Link
          href="/login"
          className="rounded-lg bg-orbitus-accent px-6 py-3 font-medium text-white transition hover:opacity-90"
        >
          Entrar
        </Link>
        <Link
          href="/roster"
          className="rounded-lg border border-orbitus-accent px-6 py-3 font-medium text-orbitus-accent transition hover:bg-orbitus-accent/10"
        >
          Ver alunos (Roster)
        </Link>
        <Link
          href="/dashboard"
          className="rounded-lg border border-gray-600 px-6 py-3 font-medium text-gray-300 transition hover:bg-orbitus-card"
        >
          Dashboard
        </Link>
      </div>
    </main>
  );
}
