'use client';

import { useState, useEffect, useCallback, useRef, type ReactNode } from 'react';
import { createClient } from '@/utils/supabase/client';
import Image from 'next/image';
import type { Usuario } from '@/types/database';
import ProfileModal, { type UserFormData } from '@/app/menu/components/ProfileModal';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import { useI18n } from '@/app/i18n-provider';
import { Gavel } from 'lucide-react';

type Aviso = {
  id_contribucion: string;
  descripcion: string;
  fecha: string;
  categoria: string;
};

// Tipo para los datos que devuelve la función RPC
type ContribucionCasaDetalle = {
  id_contribucion: number;
  fecha_cargo: string;
  estado: 'PENDIENTE' | 'PAGADO' | string; // Aceptamos string para ser flexibles
  contribucion_nombre: string;
  // ...pueden añadirse más campos si son necesarios
};

function MenuLayoutContent({ children }: { children: ReactNode }) {
  const supabase = createClient();
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [avisos, setAvisos] = useState<Aviso[]>([]);
  const [isClient, setIsClient] = useState(false);
  const [isOperationMenuOpen, setIsOperationMenuOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [currentUserForModal, setCurrentUserForModal] = useState<Partial<Usuario> | null>(null);
  const [isAdminMenuOpen, setIsAdminMenuOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const operationMenuRef = useRef<HTMLDivElement>(null);
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

      const { data, error } = await supabase.rpc('gestionar_contribuciones_casa', {
        p_accion: 'SELECT',
        p_id_casa: user.id,
      });

      if (error) throw error;
      
      // Filtrar solo los avisos pendientes y adaptar los datos al formato que espera el componente.
      const pendingAvisos = (data || [])
        .filter((item: ContribucionCasaDetalle) => item.estado === 'PENDIENTE')
        .map((item: ContribucionCasaDetalle) => ({
          id_contribucion: item.id_contribucion,
          descripcion: item.contribucion_nombre,
          fecha: item.fecha_cargo,
          categoria: 'general', // La categorización por colores se hará en la página de Avisos.
        }));

      setAvisos(pendingAvisos);
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
      if (operationMenuRef.current && !operationMenuRef.current.contains(event.target as Node)) {
        setIsOperationMenuOpen(false);
      }
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

  const handleOpenProfileModal = () => {
    if (usuario) {
      setCurrentUserForModal(usuario);
      setIsProfileModalOpen(true);
    }
  };

  const handleSaveProfile = async (userData: UserFormData) => {
    if (!usuario) return;

    try {
      let newAvatarUrl = usuario.avatar_url;

      // Paso 1: Si hay un nuevo avatar, subirlo primero
      if (userData.avatarFile) {
        const avatarFile = userData.avatarFile as File;
        const fileExt = avatarFile.name.split('.').pop();
        const fileName = `${usuario.id}-${Date.now()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, avatarFile, { 
            upsert: true,
            contentType: avatarFile.type
          });
        
        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(filePath);
        newAvatarUrl = urlData.publicUrl;

        // Actualizar avatar_url en la base de datos
        const { error: avatarError } = await supabase.rpc('update_user_avatar', {
          p_id: Number(usuario.id),
          p_avatar_url: newAvatarUrl,
        });
        if (avatarError) throw avatarError;
      }

      // Paso 2: Guardar los datos del perfil
      const { error: mainError } = await supabase.rpc('update_user_profile', {
        p_id: Number(usuario.id),
        p_responsable: userData.responsable,
        p_email: userData.email,
        p_clave: userData.clave || null,
      });

      if (mainError) throw mainError;

      // Actualizar el estado local y localStorage para reflejar todos los cambios inmediatamente
      const updatedUser = { ...usuario, ...userData, avatar_url: newAvatarUrl };
      delete (updatedUser as Partial<UserFormData>).avatarFile; // Eliminar avatarFile del objeto
      setUsuario(updatedUser as Usuario);
      localStorage.setItem('usuario', JSON.stringify(updatedUser));

      setIsProfileModalOpen(false);
      toast.success(t('manageUsers.alerts.saveSuccess'));
    } catch (error: unknown) {
      let message = 'Unknown error';
      if (error && typeof error === 'object' && 'details' in error && typeof error.details === 'string') {
        message = error.details;
      } else if (error instanceof Error) {
        message = error.message;
      } else if (typeof error === 'string') {
        message = error;
      }
      toast.error(t('manageUsers.alerts.saveError', { message }));
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
          <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0h18M9 12.75h.008v.008H9v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm4.125 4.5h.008v.008h-.008v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
        </svg>
      ),
    },
    {
      href: '/menu/grupos-de-trabajo',
      label: t('navigation.groups'),
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 mb-1">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="flex flex-col h-screen bg-gray-100 overflow-hidden">
      {/* --- Encabezado --- */}
      <header className="bg-white shadow-md p-4 flex justify-between items-center z-20">
        <div className="flex items-center gap-3">
          {/* --- Botón Mi Perfil (Avatar) --- */}
          {usuario && (
            <button
              type="button"
              onClick={handleOpenProfileModal}
              className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-200 text-gray-600 hover:bg-indigo-100 hover:text-indigo-600 transition-colors duration-200"
              aria-label={t('navigation.profile')}
            > 
              {usuario.avatar_url ? (
                <Image
                  src={usuario.avatar_url}
                  alt={t('userModal.avatarAlt')}
                  width={40}
                  height={40}
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              )}
            </button>
          )}
          <div className="text-lg font-bold text-blue-800">
            {usuario ? t('header.greeting', { user: usuario.responsable }) : t('header.welcome')}
          </div>
        </div>
        <div className="flex items-center gap-4">
          {/* --- Menú de Operación (OPE y ADM) --- */}
          {usuario && (usuario.tipo_usuario === 'ADM' || usuario.tipo_usuario === 'OPE') && (
            <div ref={operationMenuRef} className="relative flex items-center">
              <button
                onClick={() => setIsOperationMenuOpen(prev => !prev)}
                className="text-gray-600 hover:text-blue-600"
                aria-label={t('header.operation.ariaLabel')}
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </button>
              {isOperationMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-md shadow-lg z-20 border border-gray-200">
                  <div className="py-1">
                    <Link href="/menu/admin/projects_management" className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" onClick={() => setIsOperationMenuOpen(false)}>
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-3 text-gray-500">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      {t('header.operation.projects_management')}
                    </Link>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* --- Menú de Administración (Solo ADM) --- */}
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
                    <Link href="/menu/admin/manage-house-contributions" className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" onClick={() => setIsAdminMenuOpen(false)}>
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-3 text-gray-500">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {t('header.admin.contributions')}
                    </Link>
                    <Link href="/menu/admin/manage-users" className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" onClick={() => setIsAdminMenuOpen(false)}>
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-3 text-gray-500">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {t('header.admin.users')}
                    </Link>
                    <Link href="/menu/admin/projects_catalogs" className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" onClick={() => setIsAdminMenuOpen(false)}>
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-3 text-gray-500">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                      </svg>
                      {t('header.admin.project_classification_management')}
                    </Link>
                    <Link href="/menu/admin/contribution-charges" className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" onClick={() => setIsAdminMenuOpen(false)}>
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-3 text-gray-500">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125-1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {t('header.admin.houseContributions')}
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
      
      {/* --- Modal de Perfil de Usuario --- */}
      {isProfileModalOpen && (
        <ProfileModal
          isOpen={isProfileModalOpen}
          onClose={() => setIsProfileModalOpen(false)}
          onSave={handleSaveProfile}
          user={currentUserForModal}
        />
      )}


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
                <span className="text-[10px]">{item.label}</span>
              </Link>
            );
          })}

          {/* --- Botón de Notificaciones --- */}
          <Link href="/menu/avisos" className={`relative flex flex-col items-center justify-center p-2 w-full text-center transition-colors duration-200 hover:bg-gray-200 hover:text-yellow-600 ${avisos.length === 0 ? 'opacity-50 cursor-not-allowed pointer-events-none' : 'text-gray-600'}`}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 mb-1">
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
            </svg>
            <span className="text-[10px]">{t('navigation.notices')}</span>
            {avisos.length > 0 && (
              <span className="absolute top-1 right-4 w-3 h-3 bg-red-500 rounded-full border-2 border-white"></span>
            )}
          </Link>

          {/* --- Botón de Votación --- */}
          <Link
            href="/menu/voting"
            className={`flex flex-col items-center justify-center p-2 w-full text-center transition-colors duration-200 hover:bg-gray-200 hover:text-blue-600 ${pathname === '/menu/voting' ? 'text-blue-600' : 'text-gray-600'}`}
          >
            <Gavel size={24} className="mb-1" />
            <span className="text-[10px]">{t('navigation.voting')}</span>
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
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.1-1.248-8.25-3.286" />
            </svg>
            <span className="text-[10px]">{t('navigation.languageMenu')}</span>
          </button>
        </nav>
      </footer>
    </div>
  );
}

export default function MenuLayout({ children }: { children: ReactNode }) {
  return <MenuLayoutContent>{children}</MenuLayoutContent>;
}
