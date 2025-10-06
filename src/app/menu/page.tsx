"use client";
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import PaymentModal from '@/components/modals/PaymentModal';
import { saveContributionPayment } from '@/utils/supabase/server-actions';
import Image from 'next/image';

type ProximoCompromiso = {
  id_contribucion: string;
  descripcion: string;
  dias_restantes: number;
  fecha: string;
};

function ProximoCompromisoNotification({ compromiso, onPayClick }: { compromiso: ProximoCompromiso | null, onPayClick: () => void }) {
  if (!compromiso) {
    return null;
  }

  const isOverdueOrToday = compromiso.dias_restantes >= 0;
  const diasAbs = Math.abs(compromiso.dias_restantes);

  let message: string;
  if (isOverdueOrToday) {
    if (compromiso.dias_restantes === 0) {
      message = `¡Atención! La aportación "${compromiso.descripcion}" vence hoy.`;
    } else {
      message = `¡Atención! La aportación "${compromiso.descripcion}" tiene ${diasAbs} día(s) de vencida.`;
    }
  } else {
    message = `Próximo compromiso: "${compromiso.descripcion}" vence en ${diasAbs} día(s).`;
  }

  const bgColor = isOverdueOrToday ? 'bg-yellow-100 border-yellow-500' : 'bg-green-100 border-green-500';
  const textColor = isOverdueOrToday ? 'text-yellow-800' : 'text-green-800';
  const iconColor = isOverdueOrToday ? 'text-yellow-500' : 'text-green-500';

  const Icon = isOverdueOrToday ? (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-6 h-6 ${iconColor}`}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
    </svg>
  ) : (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-6 h-6 ${iconColor}`}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );

  return (
    <div className={`p-3 mt-4 border-l-4 ${bgColor} rounded-r-lg shadow-sm`}>
      <div className="flex items-start">
        <div className="flex-shrink-0 pt-0.5">{Icon}</div>
        <div className="ml-3">
          <p className={`font-medium ${isOverdueOrToday ? 'text-xs' : 'text-sm'} ${textColor}`}>{message}</p>
          <p className={`text-xs mt-1 ${textColor} opacity-80`}>Fecha de vencimiento: {compromiso.fecha}</p>
        </div>
      </div>
      {isOverdueOrToday && (
        <div className="mt-3 flex justify-end">
          <button
            onClick={onPayClick}
            className="bg-blue-500 text-white font-bold py-1 px-2 rounded-md text-xs hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Reportar Pago
          </button>
        </div>
      )}
    </div>
  );
}

export default function MenuPage() {
  const [usuario, setUsuario] = useState<{ id: number; responsable: string; tipo_usuario: string } | null>(null);
  const [proximoCompromiso, setProximoCompromiso] = useState<ProximoCompromiso | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  // Este efecto se ejecuta solo una vez en el cliente para cargar los datos del usuario.
  useEffect(() => {
    setIsClient(true);

    const loadData = async (user: { id: number; responsable: string; tipo_usuario: string }) => {
      // Establece el usuario y luego busca sus compromisos.
      setUsuario(user);

      const { data: commitmentsData, error: commitmentsError } = await supabase
        .from('v_usuarios_contribuciones')
        .select('id_contribucion, descripcion, dias_restantes, fecha')
        .eq('id', user.id)
        .eq('realizado', 'N')
        .order('dias_restantes', { ascending: false });

      if (commitmentsError) {
        console.error('Error fetching commitments:', commitmentsError);
        setProximoCompromiso(null);
      } else if (commitmentsData && commitmentsData.length > 0) {
        const proximo = commitmentsData[0];
        if (proximo.dias_restantes !== null && proximo.dias_restantes >= -15) {
          setProximoCompromiso(proximo as ProximoCompromiso);
        }
      }
    };

    const stored = localStorage.getItem('usuario');
    if (stored) {
      try {
        const user = JSON.parse(stored);
        // Se verifica que el objeto de usuario completo exista en localStorage.
        if (user && user.id && user.responsable) {
          loadData(user);
        } else {
          // Si no está el objeto completo, se considera un estado inválido.
          router.push('/');
        }
      } catch (e) {
        console.error("Failed to parse user from localStorage", e);
        router.push('/');
      }
    } else {
      router.push('/');
    }
  }, [isClient, router, supabase]);

  const handleOpenPaymentModal = () => {
    if (proximoCompromiso) {
      setIsPaymentModalOpen(true);
    }
  };

  const handleClosePaymentModal = () => {
    setIsPaymentModalOpen(false);
  };

  const handleSavePayment = useCallback(async (amount: number, file: File) => {
    if (!proximoCompromiso || !usuario) return;

    try {
      await saveContributionPayment(proximoCompromiso, usuario, amount, file);
      alert('¡Pago registrado exitosamente!');
      handleClosePaymentModal();
      setProximoCompromiso(null); // Ocultar la notificación después de pagar
    } catch (error: unknown) {
      let message = 'desconocido';
      if (error instanceof Error) {
        message = error.message;
      }
      alert(`Error al registrar el pago: ${message}`);
    }
  }, [proximoCompromiso, usuario]);

  const handleRegresar = () => {
    router.push('/');
  };
  const handleSalir = () => {
  localStorage.removeItem('usuario');
  router.push('/');
  };

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      {/* --- Cabecera con Información del Usuario --- */}
      {isClient && usuario && (
        <header className="bg-white shadow-sm p-2 border-b border-gray-200">
          <div className="w-full max-w-md mx-auto flex justify-between items-center">
            <div>
              <p className="text-xs text-gray-500">
                Casa: <span className="font-bold text-gray-800">{usuario.id}</span>
                {usuario.tipo_usuario ? <span className="ml-2 text-xs text-gray-500">({usuario.tipo_usuario})</span> : null}
              </p>
              <p className="text-lg font-semibold text-gray-800">{usuario.responsable}</p>
            </div>
            <Image src="/logo.png" alt="Logo del Condominio" width={40} height={40} className="object-contain" />
          </div>
        </header>
      )}

      {/* --- Contenido Principal --- */}
      <main className="flex-1 w-full max-w-md mx-auto p-4 sm:p-6 pb-24"> {/* Padding-bottom para la barra de nav */}
        {!isClient || !usuario ? (
            <div className="text-center text-gray-500">Cargando...</div>
          ) : null}
        {/* Aquí se podría agregar más contenido en el futuro, como un dashboard */}
      </main>

      {/* --- Barra de Navegación Inferior --- */}
      {isClient && usuario && (
        <nav className="fixed bottom-0 left-0 right-0 bg-gray-100 border-t border-gray-300 shadow-top flex justify-around">
          <Link href="/calendarios" className="flex flex-col items-center justify-center text-gray-600 hover:bg-gray-200 hover:text-blue-600 p-2 w-full text-center transition-colors duration-200">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 mb-1">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3.75 7.5h16.5M4.5 21h15a.75.75 0 00.75-.75V7.5a.75.75 0 00-.75-.75h-15a.75.75 0 00-.75.75v12.75c0 .414.336.75.75.75z" />
            </svg>
            <span className="text-xs">Aportaciones</span>
          </Link>
          <Link href="/grupos-de-trabajo" className="flex flex-col items-center justify-center text-gray-600 hover:bg-gray-200 hover:text-cyan-600 p-2 w-full text-center transition-colors duration-200">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 mb-1">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.438.995s.145.755.438.995l1.003.827c.424.35.534.954.26 1.431l-1.296 2.247a1.125 1.125 0 01-1.37.49l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.127c-.331.183-.581.495-.644.87l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.37-.49l-1.296-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.437-.995s-.145-.755-.437-.995l-1.004-.827a1.125 1.125 0 01-.26-1.431l1.296-2.247a1.125 1.125 0 011.37-.49l1.217.456c.355.133.75.072 1.076-.124.072-.044.146-.087.22-.127.332-.183.582-.495.644-.87l.213-1.281z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="text-xs">Grupos</span>
          </Link>
          {usuario && usuario.tipo_usuario === 'ADM' && (
            <Link href="/admin/manage-house-contributions" className="flex flex-col items-center justify-center text-gray-600 hover:bg-gray-200 hover:text-green-600 p-2 w-full text-center transition-colors duration-200">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 mb-1">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
              </svg>
              <span className="text-xs">Admin</span>
            </Link>
          )}
          {/* --- Botón de Notificaciones --- */}
          <button onClick={handleOpenPaymentModal} className="relative flex flex-col items-center justify-center text-gray-600 hover:bg-gray-200 hover:text-yellow-600 p-2 w-full text-center transition-colors duration-200" disabled={!proximoCompromiso}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 mb-1">
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
            </svg>
            <span className="text-xs">Alertas</span>
            {proximoCompromiso && (
              <span className="absolute top-1 right-4 w-4 h-4 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                1
              </span>
            )}
          </button>
          <button onClick={handleSalir} className="flex flex-col items-center justify-center text-gray-600 hover:bg-gray-200 hover:text-red-600 p-2 w-full text-center transition-colors duration-200">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 mb-1">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
            </svg>
            <span className="text-xs">Salir</span>
          </button>
        </nav>
      )}

      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={handleClosePaymentModal}
        onSave={handleSavePayment}
        contribution={proximoCompromiso}
      />
    </div>
  );
}
