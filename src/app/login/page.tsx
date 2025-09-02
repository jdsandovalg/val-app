"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';

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
  // Guardar datos en localStorage y redirigir al menú principal
  localStorage.setItem('usuario', JSON.stringify({ id: data[0].id, responsable: data[0].responsable, tipo_usuario: data[0].tipo_usuario }));
  router.push('/menu');
  };

  return (
    <div className="flex min-h-screen flex-col bg-gray-100">
      {/* Botón regresar arriba a la izquierda */}
      <div className="flex justify-start mt-4 ml-4">
        <button
          type="button"
          onClick={() => router.push('/')}
          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm flex items-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
          Regresar
        </button>
      </div>
      <div className="flex flex-1 items-center justify-center">
        <form onSubmit={handleLogin} className="bg-white p-8 rounded shadow w-80">
          <h2 className="text-2xl font-bold mb-6 text-center">Ingreso al sistema</h2>
          <div className="mb-4">
            <label className="block mb-1 text-gray-900 dark:text-gray-100">Número de casa</label>
            <input
              type="text"
              value={id}
              onChange={e => setId(e.target.value)}
              className="w-full border px-3 py-2 rounded text-gray-900 dark:text-gray-100"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block mb-1 text-gray-900 dark:text-gray-100">Clave</label>
            <input
              type="password"
              value={clave}
              onChange={e => setClave(e.target.value)}
              className="w-full border px-3 py-2 rounded text-gray-900 dark:text-gray-100"
              required
            />
          </div>
          {error && <div className="text-red-500 mb-4">{error}</div>}
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
            disabled={loading}
          >
            {loading ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>
      </div>
    </div>
  );
}
