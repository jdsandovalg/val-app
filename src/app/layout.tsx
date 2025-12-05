import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { I18nProvider } from '@/app/i18n-provider';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Villas de Alcalá - Sistema de Gestión',
  description: 'Sistema de Gestión de Aportaciones y Servicios para el residencial Villas de Alcalá.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // El proveedor de contexto necesita ser un componente de cliente,
    // por lo que no podemos establecer `lang` aquí directamente. El proveedor se encargará.
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <meta name="theme-color" content="#FFFFFF" />
      </head>
      <body className={inter.className}>
        <I18nProvider>{children}</I18nProvider>
      </body>
    </html>
  );
}
