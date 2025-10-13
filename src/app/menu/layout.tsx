'use client';

import { useState, useEffect, useCallback, useRef, type ReactNode } from 'react';
import { createClient } from '@/utils/supabase/client';
import type { Usuario } from '@/types/database';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useI18n } from '@/app/i18n-provider';

type ProximoCompromiso = {
  id_contribucion: string;
  descripcion: string;
  fecha: string;
  dias_restantes: number;
};

function MenuLayoutContent({ children }: { children: ReactNode }) {
  const supabase = createClient();
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [proximoCompromiso, setProximoCompromiso] = useState<ProximoCompromiso | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [isAdminMenuOpen, setIsAdminMenuOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const adminMenuRef = useRef<HTMLDivElement>(null);
  const { t, lang, setLang } = useI18n();

  useEffect(() => {
    setIsClient(true);
  }, []);

  const fetchInitialData = useCallback(async () => {
    if (!isClient) return;

    const storedUser = localStorage.getItem('usuario');
    if (!storedUser) {
      router.push('/');
      return;
    }

    try {
      const user: Usuario = JSON.parse(storedUser);
      setUsuario(user);

      const { data, error } = await supabase.rpc('get_proximo_compromiso', {
        p_user_id: user.id,
      });

      if (error) throw error;

      if (data && data.length > 0) {
        setProximoCompromiso(data[0]);
      }
    } catch (e) {
      console.error("Error al obtener datos iniciales:", e);
      localStorage.removeItem('usuario');
      router.push('/');
    }
  }, [supabase, router, isClient]);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (adminMenuRef.current && !adminMenuRef.current.contains(event.target as Node)) {
        setIsAdminMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [adminMenuRef]);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Error al cerrar sesión:', error);
    } else {
      localStorage.removeItem('usuario');
      router.push('/');
    }
  };

  const navLinkItems = [
    {
      href: '/menu',
      label: t('navigation.home'),
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 mb-1">
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
        </svg>
      ),
    },
    {
      href: '/menu/calendarios',
      label: t('navigation.calendar'),
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 mb-1">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0h18M12 12.75h.008v.008H12v-.008z" />
        </svg>
      ),
    },
    {
      href: '/menu/grupos-de-trabajo',
      label: t('navigation.groups'),
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 mb-1">
          <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m-7.5-2.962c.566-.16-1.168.359-1.168.359m0 0a3.001 3.001 0 015.196 0m0 0a3.001 3.001 0 01-5.196 0M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="flex flex-col h-screen bg-gray-100 overflow-hidden">
      {/* --- Encabezado --- */}
      <header className="bg-white shadow-md p-4 flex justify-between items-center">
        <div className="text-lg font-bold text-blue-800">
          {usuario ? t('header.greeting', { user: usuario.responsable }) : t('header.welcome')}
        </div>
        <div className="flex items-center gap-4">
          {usuario && usuario.tipo_usuario === 'ADM' && (
            <div ref={adminMenuRef} className="relative flex items-center">
              <button
                onClick={() => setIsAdminMenuOpen(prev => !prev)}
                className="text-gray-600 hover:text-green-600"
                aria-label={t('header.admin.ariaLabel')}
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.286zm0 13.036h.008v.008h-.008v-.008z" />
                </svg>
              </button>
              {isAdminMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-md shadow-lg z-20 border border-gray-200">
                  <div className="py-1">
                    <Link href="/menu/admin/manage-house-contributions" className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-3 text-gray-500">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {t('header.admin.contributions')}
                    </Link>

                    <Link href="/menu/admin/manage-users" className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-3 text-gray-500">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {t('header.admin.users')}
                    </Link>

                    <Link href="/menu/admin/projects_catalogs" className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-3 text-gray-500">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                      </svg>
                      {t('header.admin.project_classification_management')}
                    </Link>
                  </div>
                </div>
              )}
            </div>
          )}
          <button
            onClick={handleLogout}
            className="text-gray-600 hover:text-red-600"
            aria-label={t('header.logout.ariaLabel')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
            </svg>
          </button>
        </div>
      </header>

      {/* --- Contenido Principal --- */}
      <main className="flex-grow px-4 pt-4 flex flex-col overflow-y-auto">{children}</main>

      {/* --- Menú de Navegación Inferior --- */}
      <footer className="bg-white shadow-t sticky bottom-0 z-10 rounded-t-lg mx-4 mb-2">
        <nav className="flex justify-evenly max-w-4xl mx-auto">
          {navLinkItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link 
                key={item.href} 
                href={item.href} 
                className={`flex flex-col items-center justify-center p-2 w-full text-center transition-colors duration-200 hover:bg-gray-200 hover:text-blue-600 ${isActive ? 'text-blue-600' : 'text-gray-600'}`}>
                {item.icon}
                <span className="text-xs">{item.label}</span>
              </Link>
            );
          })}

          

          {/* --- Botón de Notificaciones --- */}
          <Link href="/menu/avisos" className={`relative flex flex-col items-center justify-center p-2 w-full text-center transition-colors duration-200 hover:bg-gray-200 hover:text-yellow-600 ${!proximoCompromiso ? 'opacity-50 cursor-not-allowed pointer-events-none' : 'text-gray-600'}`}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 mb-1">
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
            </svg>
            <span className="text-xs">{t('navigation.notices')}</span>
            {proximoCompromiso && (
              <span className="absolute top-1 right-4 w-3 h-3 bg-red-500 rounded-full border-2 border-white"></span>
            )}
          </Link>

        {/* --- Botón de Idioma (rápido — recarga) --- */}
          <button
            type="button"
            onClick={() => setLang()}
            className="flex flex-col items-center justify-center p-2 w-full text-center transition-colors duration-200 hover:bg-gray-200 text-gray-600"
            aria-label={t('navigation.changeLanguage')}
            title={t(`navigation.languageTooltip.${lang}`)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-6 h-6 mb-1">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 2.25c5.385 0 9.75 4.365 9.75 9.75s-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12 6.615 2.25 12 2.25zM12 2.25v19.5M2.25 12h19.5M4.5 4.5l15 15"/>
            </svg>
            <span className="text-xs">{t('navigation.languageMenu')}</span>
          </button>
        </nav>
      </footer>
    </div>
  );
}

export default function MenuLayout({ children }: { children: ReactNode }) {
  return <MenuLayoutContent>{children}</MenuLayoutContent>;
}
