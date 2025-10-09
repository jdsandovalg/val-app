'use client';

import Image from 'next/image';

export default function MenuPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)] bg-white p-6 rounded-t-lg shadow text-center">
      {/* Logo con margen superior extra para centrar visualmente */}
      <div className="mt-12 mb-6">
        <Image
          src="/logo.png"
          alt="Logo Villas de Alcalá"
          width={180}   // un poco más grande que antes
          height={180}
          priority
        />
      </div>

      <h1 className="text-2xl font-bold text-gray-800">Bienvenido a Villas de Alcalá</h1>
      <p className="mt-2 text-gray-600">Sistema de Gestión de Aportaciones y Servicios</p>
    </div>
  );
}
