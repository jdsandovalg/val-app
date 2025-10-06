// Animación personalizada para giro lento
import './globals.css';
import Image from 'next/image';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
      <div className="flex flex-col items-center justify-center w-full max-w-md mx-auto">
        <div className="flex items-center justify-center w-full mb-6">
          <div className="relative" style={{ width: '120px', height: '120px' }}>
            <Image src="/logo.png" alt="Logo Condominio" fill style={{ objectFit: 'contain' }} sizes="120px" />
          </div>
        </div>
        <h1 className="text-2xl font-bold mb-2 text-center text-gray-800">Bienvenido a Villas de Alcalá</h1>
        <p className="mb-8 text-center text-gray-500">Sistema de gestión de aportaciones y servicios</p>
        <Link href="/login" className="w-full max-w-xs text-center bg-gray-200 text-gray-800 font-bold py-3 rounded-lg hover:bg-gray-300 transition-all duration-300 shadow-lg hover:shadow-xl">Ingresar</Link>
      </div>
      {/* Mostrar la versión del commit de Git si está disponible en Vercel */}
      {process.env.VERCEL_GIT_COMMIT_SHA && (
        <div className="absolute bottom-4 left-0 right-0 text-center text-xs text-gray-400">
          Versión: {process.env.VERCEL_GIT_COMMIT_SHA.substring(0, 7)}
        </div>
      )}
    </div>
  );
}
