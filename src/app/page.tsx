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
import { toast } from 'react-hot-toast';
import { createClient } from '@/utils/supabase/client';
import { useI18n } from '@/app/i18n-provider';

export default function Home() {
  const router = useRouter();
  const { t, lang, setLang } = useI18n();
  const supabase = createClient();

  const [id, setId] = useState('');
  const [clave, setClave] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    try {
      // CORRECCIÓN: Llamar a la función 'login_user' para autenticar contra la tabla 'usuarios'.
      const { data, error: rpcError } = await supabase.rpc('login_user', {
        p_id: Number(id),
        p_clave: clave,
      });

      if (rpcError) throw rpcError;

      if (!data || data.length === 0) {
        throw new Error(t('login.error.credentials'));
      }

      const userData = data[0];
      // Guardamos los datos del usuario en localStorage para usarlos en otras partes de la app.
      localStorage.setItem('usuario', JSON.stringify(userData));

      // Redirigir al menú principal.
      router.push('/menu');

    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : t('login.error.generic');
      toast.error(message);
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
        <h1 className="text-2xl font-bold mb-2 text-center text-gray-800">{t('welcome')}</h1>
        <p className="mb-8 text-center text-gray-500">{t('subtitle')}</p>

        <form onSubmit={handleLogin} className="w-full max-w-xs space-y-4">
          <input
            type="number"
            value={id}
            onChange={(e) => setId(e.target.value)}
            placeholder={t('login.idPlaceholder')}
            required
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="password"
            value={clave}
            onChange={(e) => setClave(e.target.value)}
            placeholder={t('login.passwordPlaceholder')}
            required
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gray-100 text-black font-bold py-3 rounded-lg hover:bg-gray-300  transition-all duration-300 shadow-lg disabled:bg-gray-400"
          >
            {loading ? t('login.loadingButton') : t('login.button')}
          </button>
        </form>
        <div className="mt-6">
          <button
            type="button"
            onClick={() => setLang()}
            className="text-sm text-gray-500 hover:text-blue-600"
            title={t(`navigation.languageTooltip.${lang}`)}
          >
            {t('navigation.language')}: {lang.toUpperCase()}
          </button>
        </div>
      </div>
      <footer className="text-xs text-gray-400 text-center mt-4">
        Versión: {process.env.NEXT_PUBLIC_VERSION || 'Versión No Disponible'}
      </footer>
    </div>
    
  );
}
