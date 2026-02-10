import type { Metadata } from 'next';
import './globals.css';
import { DemoBadge } from '@/components/DemoBadge';
import { AppHeader } from '@/components/AppHeader';

export const metadata: Metadata = {
  title: 'Orbitus Classroom RPG',
  description: 'Dashboard gamificado para acompanhar alunos',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen bg-orbitus-dark text-gray-100 antialiased">
        <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:bg-orbitus-accent focus:px-4 focus:py-2 focus:text-white focus:outline-none">
          Pular para o conteúdo
        </a>
        <AppHeader />
        {children}
        <DemoBadge />
      </body>
    </html>
  );
}
