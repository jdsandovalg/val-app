'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/utils/supabase/client';
import type { Usuario } from '@/types/database';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import PaymentModal, { type PayableContribution } from '@/components/modals/PaymentModal';

type ProximoCompromiso = {
  id_contribucion: string;
  descripcion: string;
  fecha: string;
  dias_restantes: number;
};

export default function MenuPage() {
  const supabase = createClient();
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [proximoCompromiso, setProximoCompromiso] = useState<ProximoCompromiso | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [isAdminMenuOpen, setIsAdminMenuOpen] = useState(false);
  const router = useRouter();

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

      const { data, error } = await supabase
        .from('v_usuarios_contribuciones')
        .select('id_contribucion, descripcion, fecha, dias_restantes')
        .eq('id', user.id)
        .eq('realizado', 'N')
        .order('fecha', { ascending: true })
        .limit(1);

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

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Error al cerrar sesión:', error);
    } else {
      localStorage.removeItem('usuario');
      router.push('/');
    }
  };

  const handleOpenPaymentModal = () => {
    if (proximoCompromiso) {
      setIsPaymentModalOpen(true);
    }
  };

  const handleClosePaymentModal = () => {
    setIsPaymentModalOpen(false);
  };

  const handleSavePayment = async (amount: number, file: File) => {
    if (!proximoCompromiso || !usuario) return;

    const filePath = `${usuario.id}/${file.name}`;
    const { error: uploadError } = await supabase.storage.from('imagenespagos').upload(filePath, file);

    if (uploadError) {
      alert(`Error al subir el comprobante: ${uploadError.message}`);
      return;
    }

    const { error: dbError } = await supabase
      .from('contribucionesporcasa')
      .update({
        pagado: amount,
        realizado: 'S',
        fechapago: new Date().toISOString(),
        url_comprobante: filePath,
      })
      .eq('id_casa', usuario.id)
      .eq('id_contribucion', proximoCompromiso.id_contribucion)
      .eq('fecha', proximoCompromiso.fecha);

    if (dbError) {
      alert(`Error al registrar el pago: ${dbError.message}`);
    } else {
      alert('¡Pago registrado exitosamente!');
      handleClosePaymentModal();
      fetchInitialData();
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      {/* --- Encabezado --- */}
      <header className="bg-white shadow-md p-4 flex justify-between items-center">
        <div className="text-lg font-bold text-blue-800">
          {usuario ? `Hola, ${usuario.responsable}` : 'Bienvenido'}
        </div>
        <button
          onClick={handleLogout}
          className="text-sm text-red-600 hover:text-red-800 font-semibold"
        >
          Cerrar Sesión
        </button>
      </header>

      {/* --- Contenido Principal (vacío para empujar el footer hacia abajo) --- */}
      <main className="flex-grow"></main>

      {/* --- Menú de Navegación Inferior --- */}
      <footer className="bg-white shadow-t sticky bottom-0 z-10">
        <nav className="flex justify-around max-w-4xl mx-auto">
          <Link href="/menu" className="flex flex-col items-center justify-center text-blue-600 p-2 w-full text-center transition-colors duration-200">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 mb-1">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
            </svg>
            <span className="text-xs">Inicio</span>
          </Link>
          <Link href="/calendarios" className="flex flex-col items-center justify-center text-gray-600 hover:bg-gray-200 hover:text-blue-600 p-2 w-full text-center transition-colors duration-200">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 mb-1">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0h18M12 12.75h.008v.008H12v-.008z" />
            </svg>
            <span className="text-xs">Calendario</span>
          </Link>
          <Link href="/grupos-de-trabajo" className="flex flex-col items-center justify-center text-gray-600 hover:bg-gray-200 hover:text-blue-600 p-2 w-full text-center transition-colors duration-200">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 mb-1">
              <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m-7.5-2.962c.566-.16-1.168.359-1.168.359m0 0a3.001 3.001 0 015.196 0m0 0a3.001 3.001 0 01-5.196 0M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-xs">Grupos</span>
          </Link>
          {usuario && usuario.tipo_usuario === 'ADM' && (
            <div className="relative flex-1">
              <button onClick={() => setIsAdminMenuOpen(prev => !prev)} className="flex flex-col items-center justify-center text-gray-600 hover:bg-gray-200 hover:text-green-600 p-2 w-full text-center transition-colors duration-200">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 mb-1">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0h9.75" />
                </svg>
                <span className="text-xs">Admin</span>
              </button>
              {isAdminMenuOpen && (
                <div className="absolute bottom-full right-0 mb-2 w-48 bg-white rounded-md shadow-lg z-20 border border-gray-200">
                  <div className="py-1">
                    <Link href="/admin/manage-house-contributions" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                      Gestionar Aportaciones
                    </Link>
                    <Link href="/admin/manage-users" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                      Gestionar Usuarios
                    </Link>
                  </div>
                </div>
              )}
            </div>
          )}
          {/* --- Botón de Notificaciones --- */}
          <button onClick={handleOpenPaymentModal} className="relative flex flex-col items-center justify-center text-gray-600 hover:bg-gray-200 hover:text-yellow-600 p-2 w-full text-center transition-colors duration-200" disabled={!proximoCompromiso}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 mb-1">
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
            </svg>
            <span className="text-xs">Avisos</span>
            {proximoCompromiso && (
              <span className="absolute top-1 right-4 w-3 h-3 bg-red-500 rounded-full border-2 border-white"></span>
            )}
          </button>
        </nav>
      </footer>

      {isClient && proximoCompromiso && (
        <PaymentModal
          isOpen={isPaymentModalOpen}
          onClose={handleClosePaymentModal}
          onSave={handleSavePayment}
          contribution={proximoCompromiso as unknown as PayableContribution}
        />
      )}
    </div>
  );
}