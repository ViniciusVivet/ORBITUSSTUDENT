import type { Metadata } from 'next';
import './globals.css';
import { DemoBadge } from '@/components/DemoBadge';

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
        {children}
        <DemoBadge />
      </body>
    </html>
  );
}
