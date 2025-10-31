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


type Contribucion = {
  id_casa: number;
  id_contribucion: number;
  fecha_cargo: string; // Corresponde a la 'fecha' original
  estado: 'PENDIENTE' | 'PAGADO'; // Corresponde a 'realizado'
  monto_pagado: number | null; // Corresponde a 'pagado'
  fechapago?: string | null;
  url_comprobante?: string | null;
  responsable: string;
  contribucion_nombre: string; // Corresponde a 'descripcion'
  contribucion_color: string | null; // Corresponde a 'color_del_borde'
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
      .sort((a, b) => new Date(a.fecha_cargo).getTime() - new Date(b.fecha_cargo).getTime());
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
      const { data, error } = await supabase.rpc('gestionar_contribuciones_casa', {
        p_accion: 'SELECT',
        p_id_casa: user.id
      });

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

  const handleSavePayment = async (amount: number, date: string, file: File | null) => {
    if (!selectedContribution || !usuario) return;

    const toastId = toast.loading(t('manageContributions.uploading'));

    try {
      let filePath: string | null = null;

      // 1. Subir la imagen a Supabase Storage, SOLO SI EXISTE.
      if (file) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${usuario.id}-${selectedContribution.id_contribucion}-${selectedContribution.fecha_cargo}-${Date.now()}.${fileExt}`;
        filePath = fileName; // La ruta que se guardará en la BD es solo el nombre del archivo.

        const { error: uploadError } = await supabase.storage.from('imagenespagos').upload(filePath, file);

        if (uploadError) {
          throw new Error(`Error subiendo archivo: ${uploadError.message}`);
        }
      }

      // 2. Llamar a la nueva función RPC para actualizar el registro
      const { data: updatedRecord, error: rpcError } = await supabase.rpc('gestionar_pago_contribucion_casa', {
        p_id_casa: usuario.id,
        p_id_contribucion: selectedContribution.id_contribucion,
        p_fecha_cargo: selectedContribution.fecha_cargo,
        p_monto_pagado: amount,
        p_fecha_pago: date,
        p_url_comprobante: filePath, // Pasamos la ruta del archivo o null
      });

      if (rpcError) throw rpcError;
      
      if (!updatedRecord || updatedRecord.length === 0) throw new Error("No se recibió confirmación de la actualización.");

      // Actualización optimista en el frontend
      setContribuciones(prev => prev.map(c => 
        (c.id_contribucion === selectedContribution.id_contribucion && c.fecha_cargo === selectedContribution.fecha_cargo) 
        ? { ...c, ...updatedRecord[0] }
        : c
      ));

      toast.success(t('calendar.payment.success'), { id: toastId });
      handleClosePaymentModal();
    } catch (error: unknown) {
      let message = t('calendar.payment.unknownError');
      if (error instanceof Error) message = error.message;
      toast.error(t('calendar.payment.error', { message }), { id: toastId });
    }
  };

  const getEstado = useCallback((row: Contribucion): { texto: string; icon: React.ReactNode | null; color: string; key: string } => {
    // CORREGIDO: Usar la nueva columna 'estado'
    if (row.estado === 'PAGADO') {
      return { texto: t('calendar.status.paid'), key: 'paid', color: 'text-green-700', icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-green-600"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> };
    }

    // CORREGIDO: Calcular los días restantes en el cliente
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const fechaCargo = new Date(row.fecha_cargo + 'T00:00:00');
    const diffTime = fechaCargo.getTime() - hoy.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { texto: t('calendar.status.overdue'), key: 'overdue', color: 'text-red-700', icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-red-600"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg> };
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
                .sort((a, b) => new Date(a.fecha_cargo).getTime() - new Date(b.fecha_cargo).getTime()) // Ordenar por fecha ascendente
                .map(c => ({
                  id_contribucion: c.id_contribucion,
                  descripcion: c.contribucion_nombre ?? 'N/A',
                  fecha_limite: c.fecha_cargo,
                  pagado: c.estado === 'PAGADO',
                  status: getEstado(c).texto, // El texto para mostrar
                  statusKey: getEstado(c).key,
                }));

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
              key={`${row.id_contribucion}-${row.fecha_cargo}`}
              descripcion={row.contribucion_nombre}
              fecha={row.fecha_cargo}
              estado={getEstado(row)}
              realizado={row.estado === 'PAGADO' ? 'S' : 'N'} // Adaptado para compatibilidad con el componente
              url_comprobante={row.url_comprobante}
              color_del_borde={row.contribucion_color}
              fechapago={row.fechapago}
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
