'use client';

/**
 * @file /src/app/menu/page.tsx
 * @fileoverview Página de bienvenida principal después de iniciar sesión.
 * @description Actúa como la pantalla de inicio dentro del layout principal. Muestra un mensaje de bienvenida
 * con el logo de la aplicación.
 *
 * @accesible_desde Menú inferior -> Ícono de "Inicio".
 */
import Image from 'next/image';

export default function MenuPage() {
  return (
    <div className="bg-white rounded-t-lg shadow flex-grow flex flex-col items-center justify-center text-center p-6">
      <Image
        src="/logo.png"
        alt="Logo Villas de Alcalá"
        width={150}
        height={150}
        className="mb-6"
        priority
      />
      <h1 className="text-2xl font-bold text-gray-800">Bienvenido a Villas de Alcalá</h1>
      <p className="mt-2 text-gray-600">Sistema de Gestión de Aportaciones y Servicios</p>
    </div>
  );
}