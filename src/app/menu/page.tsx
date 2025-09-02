"use client";
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import PaymentModal, { type PayableContribution } from '@/components/modals/PaymentModal';

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

  const bgColor = isOverdueOrToday ? 'bg-red-100 border-red-500' : 'bg-green-100 border-green-500';
  const textColor = isOverdueOrToday ? 'text-red-800' : 'text-green-800';
  const iconColor = isOverdueOrToday ? 'text-red-500' : 'text-green-500';

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
          <p className={`text-sm font-medium ${textColor}`}>{message}</p>
          <p className={`text-xs mt-1 ${textColor} opacity-80`}>Fecha de vencimiento: {compromiso.fecha}</p>
        </div>
      </div>
      {isOverdueOrToday && (
        <div className="mt-3 flex justify-end">
          <button
            onClick={onPayClick}
            className="bg-blue-500 text-white font-bold py-1 px-3 rounded-md text-sm hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Pagar
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

  useEffect(() => {
    setIsClient(true);

    const fetchData = async (userId: number) => {
      const [userRes, commitmentsRes] = await Promise.all([
        supabase.from('usuarios').select('id, responsable, tipo_usuario').eq('id', userId).single(),
        supabase.from('v_usuarios_contribuciones').select('id_contribucion, descripcion, dias_restantes, fecha').eq('id', userId).eq('realizado', 'N').order('dias_restantes', { ascending: false })
      ]);

      if (userRes.error || !userRes.data) {
        console.error("Error fetching user or user not found, logging out.", userRes.error);
        localStorage.removeItem('usuario');
        router.push('/');
        return;
      }
      
      setUsuario(userRes.data);

      if (commitmentsRes.error) {
        console.error('Error fetching commitments:', commitmentsRes.error);
        setProximoCompromiso(null);
      } else if (commitmentsRes.data && commitmentsRes.data.length > 0) {
        const proximo = commitmentsRes.data[0];
        if (proximo.dias_restantes !== null && proximo.dias_restantes >= -15) {
          setProximoCompromiso(proximo as ProximoCompromiso);
        }
      }
    };

    const stored = localStorage.getItem('usuario');
    if (stored) {
      try {
        const user = JSON.parse(stored);
        if (user && user.id) {
          fetchData(user.id);
        } else {
          router.push('/');
        }
      } catch (e) {
        console.error("Failed to parse user from localStorage", e);
        router.push('/');
      }
    } else {
      router.push('/');
    }
  }, [router, supabase]);

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
      // 1. Subir la imagen a Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${usuario.id}-${proximoCompromiso.id_contribucion}-${proximoCompromiso.fecha}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('imagenespagos')
        .upload(filePath, file);

      if (uploadError) throw new Error(`Error al subir el archivo: ${uploadError.message}`);

      // 2. Se construye la URL manualmente para asegurar el formato correcto.
      const { data: { publicUrl } } = supabase.storage.from('imagenespagos').getPublicUrl(filePath);

      // 3. Actualizar el registro en la base de datos
      const { error: updateError } = await supabase.from('contribucionesporcasa').update({
        realizado: 'S',
        pagado: amount,
        fechapago: new Date().toISOString(),
        url_comprobante: publicUrl,
      }).eq('id_casa', usuario.id).eq('id_contribucion', proximoCompromiso.id_contribucion).eq('fecha', proximoCompromiso.fecha);

      if (updateError) throw updateError;

      alert('¡Pago registrado exitosamente!');
      handleClosePaymentModal();
      setProximoCompromiso(null); // Ocultar la notificación después de pagar
    } catch (error: any) {
      alert(`Error al registrar el pago: ${error.message}`);
    }
  }, [proximoCompromiso, usuario, supabase]);

  const handleRegresar = () => {
    router.push('/');
  };
  const handleSalir = () => {
  localStorage.removeItem('usuario');
  router.push('/');
  };

  return (
    <div className="flex min-h-screen flex-col bg-gray-100">
      {/* Botón regresar arriba a la izquierda */}
      <div className="flex justify-start mt-4 ml-4">
        <button
          type="button"
          onClick={handleRegresar}
          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm flex items-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
          Regresar
        </button>
      </div>
      <div className="flex flex-1 items-center justify-center">
        <div className="bg-white p-8 rounded shadow w-80 flex flex-col items-center justify-center" style={{ minHeight: '400px' }}>
          <img src="/logo.png" alt="Logo Condominio" className="mb-2 w-20 h-20 object-contain" />
          <h2 className="text-xl sm:text-2xl font-bold mb-2 text-center">Menú Principal</h2>
          {!isClient || !usuario ? (
            <div className="mb-4 text-center text-gray-900 dark:text-gray-100">Cargando...</div>
          ) : (
            <>
              <div className="mb-4 text-center text-gray-900 dark:text-gray-100">
                <div><span className="font-semibold">Casa:</span> {usuario.id} {usuario.tipo_usuario ? <span className="text-xs text-gray-600 dark:text-gray-300">({usuario.tipo_usuario})</span> : null}</div>
                <div><span className="font-semibold">Responsable:</span> {usuario.responsable}</div>
              </div>
              <Link href="/calendarios" className="w-full flex flex-col items-center gap-1 bg-blue-600 text-white py-3 px-4 rounded hover:bg-blue-700 mb-4 justify-center">
                <span className="flex flex-col items-center w-full">
                  {/* Icono de calendario */}
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 mb-1">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3.75 7.5h16.5M4.5 21h15a.75.75 0 00.75-.75V7.5a.75.75 0 00-.75-.75h-15a.75.75 0 00-.75.75v12.75c0 .414.336.75.75.75z" />
                  </svg>
                  <span className="text-sm sm:text-base font-semibold text-center w-full">Programación de aportaciones</span>
                </span>
              </Link>
              {usuario.tipo_usuario === 'ADM' && (
                <Link href="/admin/manage-house-contributions" className="w-full flex flex-col items-center gap-1 bg-green-600 text-white py-3 px-4 rounded hover:bg-green-700 mb-4 justify-center">
                  <span className="flex flex-col items-center w-full">
                    {/* Icono de lista */}
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 mb-1">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                    <span className="text-sm sm:text-base font-semibold text-center w-full">Gestionar Aportaciones por Casa</span>
                  </span>
                </Link>
              )}
              <div className="w-full mt-2">
                <ProximoCompromisoNotification compromiso={proximoCompromiso} onPayClick={handleOpenPaymentModal} />
              </div>
              <div className="flex w-full gap-2 mt-auto pt-4">
                <button onClick={handleSalir} className="flex-1 bg-red-500 text-white py-2 px-2 rounded hover:bg-red-600 text-sm">Salir</button>
              </div>
            </>
          )}
        </div>
      </div>
      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={handleClosePaymentModal}
        onSave={handleSavePayment}
        contribution={proximoCompromiso}
      />
    </div>
  );
}
