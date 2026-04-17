'use client';

/**
 * @file /src/app/page.tsx
 * @fileoverview Página de inicio de sesión.
 * @description Esta es la página de entrada a la aplicación. Permite a los usuarios autenticarse
 * usando su número de casa y clave.
 */
import './globals.css';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation'; 
import { toast } from 'react-hot-toast';
import { createClient } from '@/utils/supabase/client';
import { useI18n } from '@/app/i18n-provider';

export default function Home() {
  const router = useRouter();
  const { t, lang, setLang } = useI18n();
  const supabase = createClient();

  const [identifier, setIdentifier] = useState('');
  const [clave, setClave] = useState('');
  const [loading, setLoading] = useState(false);
  const [serverStatus, setServerStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [connectionError, setConnectionError] = useState<string | null>(null);

  // Verificar conectividad al cargar
  useEffect(() => {
    const checkServer = async () => {
      try {
        const { error } = await supabase.from('usuarios').select('id').limit(1);
        
        if (error) {
          // Analizar tipo de error
          const errorMessage = error.message?.toLowerCase() || '';
          
          if (errorMessage.includes('network') || errorMessage.includes('fetch') || errorMessage.includes('dns')) {
            setConnectionError('DNS_ERROR');
          } else if (errorMessage.includes('timeout')) {
            setConnectionError('TIMEOUT');
          } else {
            setConnectionError('SERVER_ERROR');
          }
          setServerStatus('offline');
        } else {
          setServerStatus('online');
          setConnectionError(null);
        }
      } catch (err) {
        setServerStatus('offline');
        setConnectionError('UNKNOWN');
      }
    };
    checkServer();
  }, [supabase]);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Validar conectividad primero
    if (serverStatus === 'offline') {
      toast.error(t('login.error.noConnection') || 'Sin conexión al servidor. Verifica tu internet.');
      return;
    }

    setLoading(true);

    try {
      console.log('Intentando login con:', identifier);
      
      // CORRECCIÓN: Llamar a la función 'login_user' para autenticar contra la tabla 'usuarios'.
      const { data, error: rpcError } = await supabase.rpc('login_user', {
        p_identifier: identifier,
        p_clave: clave,
      });

      console.log('Respuesta RPC:', { data, rpcError });

      if (rpcError) throw rpcError;

      console.log('Data recibida:', data);

      if (!data || data.length === 0) {
        throw new Error(t('login.error.credentials'));
      }

      const userData = data[0];
      // Guardamos los datos del usuario en localStorage (incluye avatar_url)
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
        <p className="mb-4 text-center text-gray-500">{t('subtitle')}</p>

        {/* Indicador de estado del servidor */}
        {serverStatus === 'checking' && (
          <div className="mb-4 p-2 bg-yellow-50 text-yellow-700 text-sm text-center rounded">
            Verificando conexión...
          </div>
        )}
        {serverStatus === 'offline' && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm text-center rounded">
            <p className="font-semibold">⚠️ Sin conexión al servidor</p>
            <p className="text-xs mt-1">
              {connectionError === 'DNS_ERROR' && 'Problema de DNS. Contacta a tu proveedor de internet.'}
              {connectionError === 'TIMEOUT' && 'Tiempo de espera agotado. Intenta más tarde.'}
              {(!connectionError || connectionError === 'UNKNOWN') && 'Verifica tu conexión a internet e intenta de nuevo.'}
            </p>
          </div>
        )}
        {serverStatus === 'online' && (
          <div className="mb-4 p-2 bg-green-50 text-green-700 text-sm text-center rounded">
            ✓ Conectado
          </div>
        )}

        <form onSubmit={handleLogin} className="w-full max-w-xs space-y-4">
          <input
            type="text"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            placeholder={t('login.identifierPlaceholder')}
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
            disabled={loading || serverStatus === 'offline'}
            className="w-full bg-gray-100 text-black font-bold py-3 rounded-lg hover:bg-gray-300 transition-all duration-300 shadow-lg disabled:bg-gray-400"
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
