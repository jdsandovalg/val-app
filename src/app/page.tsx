// Animación personalizada para giro lento
import './globals.css';
import Image from 'next/image';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 p-4">
      <div className="flex flex-col items-center justify-center w-full max-w-md mx-auto">
        <div className="flex items-center justify-center w-full mb-6">
          <div className="relative" style={{ width: '180px', height: '180px' }}>
            <Image src="/logo.png" alt="Logo Condominio" fill style={{ objectFit: 'contain' }} className="animate-modern-spin" sizes="180px" />
          </div>
        </div>
        <h1 className="text-3xl font-bold mb-4 text-center text-gray-800 dark:text-gray-100">Bienvenido a Villas de Alcalá</h1>
        <p className="mb-8 text-center text-gray-600 dark:text-gray-300">Sistema de gestión de aportaciones y servicios</p>
        <Link href="/login" className="bg-blue-600 text-white px-8 py-3 rounded hover:bg-blue-700 text-lg font-semibold shadow w-full max-w-xs text-center">Ingresar</Link>
      </div>
      {/* Mostrar la versión del commit de Git si está disponible en Vercel */}
      {process.env.VERCEL_GIT_COMMIT_SHA && (
        <div className="absolute bottom-4 left-0 right-0 text-center text-xs text-gray-500 dark:text-gray-400">
          Versión: {process.env.VERCEL_GIT_COMMIT_SHA.substring(0, 7)}
        </div>
      )}
    </div>
  );
}
