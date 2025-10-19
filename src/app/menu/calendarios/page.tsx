"use client";
 
/**
 * @file /src/app/menu/calendarios/page.tsx
 * @fileoverview Página de calendario de aportaciones del usuario.
 * @description Muestra un listado detallado de todas las aportaciones asignadas al usuario logueado.
 * Permite filtrar y ordenar los registros. Ofrece una vista de tabla para escritorio y una vista de tarjetas para móvil.
 * Desde aquí, el usuario puede reportar un pago o ver el comprobante de un pago ya realizado.
 *
 * @accesible_desde Menú inferior -> Ícono de "Calendario".
 * @acceso_a_datos Realiza una consulta dinámica a la vista `v_usuarios_contribuciones`. El filtrado y la ordenación
 * se construyen en el cliente y se envían en la consulta para que la base de datos realice el trabajo pesado.
 */
import { createClient } from '@/utils/supabase/client';
import React from 'react'; // Asegúrate de que React esté importado
import { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useI18n } from '@/app/i18n-provider';
import { toast } from 'react-hot-toast';
import PaymentModal, { type PayableContribution } from '@/components/modals/PaymentModal';
import ImageViewerModal from '@/components/modals/ImageViewerModal';
import ContributionCalendarCard from './components/ContributionCalendarCard';
import { saveContributionPayment } from '@/utils/supabase/server-actions';


type Contribucion = {
  id_contribucion: string;
  descripcion: string | null;
  fecha: string;
  realizado: string; // 'S' o 'N'
  dias_restantes?: number;
  color_del_borde?: string | null;
  url_comprobante?: string | null;
};

export default function CalendariosPage() {
  const router = useRouter();
  const { t } = useI18n();
  const supabase = createClient();
  const [contribuciones, setContribuciones] = useState<Contribucion[]>([]);  
  const [usuario, setUsuario] = useState<{ id: number; responsable: string } | null>(null);  
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedContribution, setSelectedContribution] = useState<Contribucion | null>(null);
  const [isImageViewerOpen, setIsImageViewerOpen] = useState(false);
  const [viewingImageUrl, setViewingImageUrl] = useState<string | null>(null);

  // Ordenamiento por defecto. Ya no se necesita configuración de ordenamiento o filtros.
  const filteredAndSortedContribuciones = useMemo(() => {
    return [...contribuciones]
      .sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());
  }, [contribuciones]);

  const fetchContribuciones = useCallback(async () => {
    const stored = localStorage.getItem('usuario');
    if (!stored) {
      router.push('/');
      return;
    }
    
    try {
      const user = JSON.parse(stored);
      setUsuario(user);
      const { data, error } = await supabase
        .from('v_usuarios_contribuciones')
        .select('id_contribucion, descripcion, fecha, realizado, dias_restantes, url_comprobante, color_del_borde')
        .eq('id', user.id);

      if (error) throw error;
      setContribuciones((data as Contribucion[]) || []);
    } catch (e) {
      toast.error(`${t('calendar.fetchError')} ${e instanceof Error ? e.message : ''}`);
      router.push('/menu'); // En caso de error, volver al menú principal
    } 
  }, [supabase, router, t]);

  useEffect(() => {
    fetchContribuciones();
  }, [fetchContribuciones]);

  const handleOpenPaymentModal = (contribution: Contribucion) => {
    setSelectedContribution(contribution);
    setIsPaymentModalOpen(true);
  };

  const handleClosePaymentModal = () => {
    setSelectedContribution(null);
    setIsPaymentModalOpen(false);
  };

  const handleOpenImageViewer = (url: string | null | undefined) => {
    if (!url) return;

    // Generar la URL pública desde la ruta del archivo almacenada en la BD.
    // Este es el método oficial y más seguro para obtener la URL.
    const { data } = supabase.storage.from('imagenespagos').getPublicUrl(url);
    setViewingImageUrl(data.publicUrl);
    setIsImageViewerOpen(true);
  };

  const handleCloseImageViewer = () => {
    setIsImageViewerOpen(false);
    setViewingImageUrl(null);
  };

  const handleSavePayment = async (amount: number, file: File) => {
    if (!selectedContribution || !usuario) return;

    try {
      await saveContributionPayment(selectedContribution, usuario, amount, file);
      toast.success(t('calendar.payment.success'));
      handleClosePaymentModal();
      fetchContribuciones(); // Recargar los datos
    } catch (error: unknown) {
      let message = t('calendar.payment.unknownError');
      if (error instanceof Error) {
        message = error.message;
      }
      toast.error(t('calendar.payment.error', { message }));
    }
  };

  const getEstado = useCallback((row: Contribucion): { texto: string; icon: React.ReactNode | null; color: string; key: string } => {
    if (row.realizado === 'S') {
      return { texto: t('calendar.status.paid'), key: 'paid', color: 'text-green-700', icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-green-600"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> };
    }
    if (typeof row.dias_restantes === 'number') {
      if (row.dias_restantes >= 0) {
        return { texto: t('calendar.status.overdue'), key: 'overdue', color: 'text-red-700', icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-red-600"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg> };
      } else {
        const diasFuturo = Math.abs(row.dias_restantes);
        const textColor = diasFuturo <= 7 ? 'text-yellow-700' : 'text-blue-700';
        const iconColor = diasFuturo <= 7 ? 'text-yellow-500' : 'text-blue-500';
        return { texto: t('calendar.status.scheduled', { days: diasFuturo }), key: 'scheduled', color: textColor, icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-6 h-6 ${iconColor}`}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> };
      }
    }
    return { texto: t('calendar.status.pending'), key: 'pending', color: 'text-gray-700', icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-gray-500"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> };
  }, [t]);

  return (
    <>
      <div className="w-full max-w-md sm:max-w-3xl mx-auto flex flex-col items-center flex-grow">
      {usuario && (
        <>
          <div className="w-full flex justify-between items-center mb-4">
            {/* Espaciador para mantener el título centrado */}
            <div className="w-10 h-10"></div>
            <h1 className="text-2xl font-bold text-gray-800 text-center">{t('calendar.title')}</h1>
            <button
              type="button"
              onClick={() => {
                if (filteredAndSortedContribuciones.length === 0) {
                  toast.error(t('calendar.reportNoData'));
                  return;
                }
                // Mapear y ordenar los datos para el reporte PDF.
                const reportData = filteredAndSortedContribuciones
                .sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime()) // Ordenar por fecha ascendente
                .map(c => ({
                  id_contribucion: c.id_contribucion,
                  descripcion: c.descripcion ?? 'N/A',
                  fecha_limite: c.fecha,
                  pagado: c.realizado === 'S',
                  status: getEstado(c).texto,
                  statusKey: getEstado(c).key,
                }));

                // Guardar los datos para que la página del reporte los lea
                localStorage.setItem('calendarPdfReportData', JSON.stringify(reportData));
                window.open('/menu/calendarios/report', '_blank');
              }}
              className="p-2 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50"
              aria-label={t('calendar.reportPdfAriaLabel')}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-gray-700">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
              </svg>
            </button>
          </div>
        </>
      )}
        {/* Vista de Tarjetas (Mobile-Only) */}
        <div className="w-full">
          {filteredAndSortedContribuciones.map((row) => (
            <ContributionCalendarCard
              key={`${row.id_contribucion}-${row.fecha}`}
              descripcion={row.descripcion}
              fecha={row.fecha}
              estado={getEstado(row)}
              realizado={row.realizado}
              url_comprobante={row.url_comprobante}
              color_del_borde={row.color_del_borde}
              onPay={() => handleOpenPaymentModal(row)}
              onViewProof={() => handleOpenImageViewer(row.url_comprobante)}
            />
          ))}
        </div>
      </div>
      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={handleClosePaymentModal}
        onSave={handleSavePayment}
        contribution={selectedContribution as PayableContribution | null}
      />
      {isImageViewerOpen && (
        <ImageViewerModal
          src={viewingImageUrl}
          onClose={handleCloseImageViewer}
        />
      )}
    </>
  );
}
