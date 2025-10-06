"use client";
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import Image from 'next/image';

export default function LoginPage() {
  const [id, setId] = useState('');
  const [clave, setClave] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    // Consulta la tabla usuarios en la base de datos "Villas de Alcala"
    const { data, error: supaError } = await supabase
      .from('usuarios')
      .select('id, responsable, clave, tipo_usuario')
      .eq('id', Number(id))
      .eq('clave', clave)
      .limit(1);
    console.log('Supabase login result:', { data, supaError });
    setLoading(false);
    if (supaError || !data) {
      setError(`ID o clave incorrectos${supaError ? ': ' + supaError.message : ''}`);
      return;
    }
    if (!Array.isArray(data) || data.length === 0) {
      setError('ID o clave incorrectos. Resultado Supabase: ' + JSON.stringify(data));
      return;
    }

    // --- Implementación del Log ---
    // Se asume que la columna de texto en la tabla `logs` se llama `mensaje`.
    // Si el nombre es diferente, ajústalo aquí.
    const { error: logError } = await supabase.from('logs').insert({
      id: data[0].id,
      mensaje: `Inicio de sesión exitoso para el usuario ${data[0].id}.`,
    });
    if (logError) console.error("Error al guardar el log:", logError.message);
    // No se detiene el flujo si el log falla, pero se registra en consola.

  // Guardar datos en localStorage y redirigir al menú principal
  localStorage.setItem('usuario', JSON.stringify({ id: data[0].id, responsable: data[0].responsable, tipo_usuario: data[0].tipo_usuario }));
  router.push('/menu');
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-xs">
        <Link href="/" className="flex justify-center mb-6">
          <div className="flex justify-center">
            <Image src="/logo.png" alt="Logo Condominio" width={64} height={64} className="object-contain" />
          </div>
        </Link>
        <h1 className="text-2xl font-bold mb-6 text-center text-gray-800">Iniciar Sesión</h1>
        <form onSubmit={handleLogin} className="space-y-6">
          <div className="mb-4">
            <input
              type="text"
              value={id}
              onChange={e => setId(e.target.value)}
              placeholder="Número de casa"
              className="w-full bg-transparent border-b-2 border-gray-300 px-2 py-2 text-gray-800 focus:outline-none focus:border-blue-500 transition-colors"
              required
            />
          </div>
          <div className="mb-4">
            <input
              type="password"
              value={clave}
              onChange={e => setClave(e.target.value)}
              placeholder="Clave"
              className="w-full bg-transparent border-b-2 border-gray-300 px-2 py-2 text-gray-800 focus:outline-none focus:border-blue-500 transition-colors"
              required
            />
          </div>
          {error && <div className="text-red-500 mb-4">{error}</div>}
          <button
            type="submit"
            className="w-full bg-gray-200 text-gray-800 font-bold py-3 rounded-lg hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400 transition-all duration-300 shadow-lg hover:shadow-xl"
            disabled={loading}
          >
            {loading ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>
      </div>
    </div>
  );
}
