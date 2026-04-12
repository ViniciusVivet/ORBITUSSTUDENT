import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { DemoBadge } from '@/components/DemoBadge';
import { AppHeader } from '@/components/AppHeader';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Orbitus Classroom RPG',
  description: 'Dashboard gamificado para acompanhar alunos',
};

export const viewport: Viewport = {
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className={inter.variable}>
      <body className="min-h-screen bg-[#050606] text-gray-100 antialiased">
        <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:bg-[#f4e04d] focus:px-4 focus:py-2 focus:text-[#050606] focus:outline-none print:hidden">
          Pular para o conteudo
        </a>
        <AppHeader />
        {children}
        <DemoBadge />
      </body>
    </html>
  );
}
