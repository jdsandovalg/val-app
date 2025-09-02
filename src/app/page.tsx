import Image from 'next/image';

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <div className="flex flex-col items-center justify-center w-full max-w-md mx-auto">
        <div className="flex items-center justify-center w-full">
          <div className="relative mb-6" style={{ width: '180px', height: '180px' }}>
            <Image src="/logo.png" alt="Logo Condominio" layout="fill" objectFit="contain" className="animate-spin-slow" />
          </div>
        </div>
        <h1 className="text-3xl font-bold mb-4 text-center">Bienvenido a Villas de Alcalá</h1>
        <p className="mb-8 text-center text-gray-700">Sistema de gestión de aportaciones y servicios</p>
        <a href="/login" className="bg-blue-600 text-white px-8 py-3 rounded hover:bg-blue-700 text-lg font-semibold shadow w-full max-w-xs text-center">Ingresar</a>
      </div>
    </div>
  );
}
// Animación personalizada para giro lento
import './globals.css';
