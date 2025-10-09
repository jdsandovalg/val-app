'use client';

/**
 * @file /src/app/page.tsx
 * @fileoverview Página de inicio de sesión.
 * @description Esta es la página de entrada a la aplicación. Permite a los usuarios autenticarse
 * usando su número de casa y clave.
 */
import './globals.css';
import Image from 'next/image';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';

export default function Home() {
  const router = useRouter();
  const supabase = createClient();

  const [id, setId] = useState('');
  const [clave, setClave] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // CORRECCIÓN: Llamar a la función 'login_user' para autenticar contra la tabla 'usuarios'.
      const { data, error: rpcError } = await supabase.rpc('login_user', {
        p_id: Number(id),
        p_clave: clave,
      });

      if (rpcError) throw rpcError;

      if (!data || data.length === 0) {
        throw new Error('ID o clave incorrectos.');
      }

      const userData = data[0];
      // Guardamos los datos del usuario en localStorage para usarlos en otras partes de la app.
      localStorage.setItem('usuario', JSON.stringify(userData));

      // Redirigir al menú principal.
      router.push('/menu');

    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al iniciar sesión. Verifique sus credenciales.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
      <div className="bg-white p-8 rounded-lg shadow-md flex flex-col items-center justify-center w-full max-w-md mx-auto">
        <div className="flex items-center justify-center w-full mb-6">
          <div className="relative" style={{ width: '120px', height: '120px' }}>
            <Image src="/logo.png" alt="Logo Condominio" fill style={{ objectFit: 'contain' }} sizes="120px" priority />
          </div>
        </div>
        <h1 className="text-2xl font-bold mb-2 text-center text-gray-800">Bienvenido a Villas de Alcalá</h1>
        <p className="mb-8 text-center text-gray-500">Sistema de Gestión de Aportaciones y Servicios</p>

        <form onSubmit={handleLogin} className="w-full max-w-xs space-y-4">
          <input
            type="number"
            value={id}
            onChange={(e) => setId(e.target.value)}
            placeholder="Casa #"
            required
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="password"
            value={clave}
            onChange={(e) => setClave(e.target.value)}
            placeholder="Clave"
            required
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition-all duration-300 shadow-lg disabled:bg-gray-400"
          >
            {loading ? 'Ingresando...' : 'Ingresar'}
          </button>
          {error && <p className="text-red-500 text-sm text-center mt-2">{error}</p>}
        </form>
      </div>
    </div>
  );
}
