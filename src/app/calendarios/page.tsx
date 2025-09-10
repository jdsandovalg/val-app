"use client";
import { createClient } from '@/utils/supabase/client';
import React from 'react';
import { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import Image from 'next/image';
import PaymentModal, { type PayableContribution } from '@/components/modals/PaymentModal';
import { saveContributionPayment } from '@/utils/supabase/server-actions';

type Contribucion = {
  id_contribucion: string;
  descripcion: string | null;
  fecha: string;
  realizado: string; // 'S' o 'N'
  dias_restantes?: number;
  url_comprobante?: string | null;
};

type ContribucionConEstado = Contribucion & {
  estado: string;
};

type SortableKeys = keyof ContribucionConEstado;

function ImageViewerModal({ src, onClose }: { src: string | null; onClose: () => void }) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  if (!src) return null;

  const handleImageError = () => {
    setIsLoading(false);
    const errorMessage = `No se pudo cargar la imagen. Verifique que la URL es correcta y que el archivo existe en el bucket.\n\nURL: ${src}`;
    setError(errorMessage);
  };

  const handleImageLoad = () => {
    setIsLoading(false);
    setError(null);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex justify-center items-center p-4" onClick={onClose}>
      <div className="bg-white p-2 rounded-lg shadow-xl max-w-3xl max-h-full" onClick={(e) => e.stopPropagation()}>
        <div className="relative flex items-center justify-center" style={{ minHeight: '200px', minWidth: '300px', width: '80vw', height: '80vh' }}>
          {isLoading && <div className="text-gray-600">Cargando imagen...</div>}
          {error && <div className="text-red-600 p-4 text-center whitespace-pre-wrap">{error}</div>}
          <Image src={src} alt="Comprobante de pago" className={`object-contain ${isLoading || error ? 'hidden' : ''}`} fill={true} onLoad={handleImageLoad} onError={handleImageError} sizes="80vw" />
          <button
            onClick={onClose}
            className="absolute top-0 right-0 mt-2 mr-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            aria-label="Cerrar"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CalendariosPage() {
  const router = useRouter();
  const supabase = createClient();
  const [contribuciones, setContribuciones] = useState<Contribucion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [usuario, setUsuario] = useState<{ id: number; responsable: string } | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedContribution, setSelectedContribution] = useState<Contribucion | null>(null);
  const [isImageViewerOpen, setIsImageViewerOpen] = useState(false);
  const [viewingImageUrl, setViewingImageUrl] = useState<string | null>(null);
  const [sortConfig, setSortConfig] = useState<{ key: SortableKeys; direction: 'ascending' | 'descending' } | null>({ key: 'fecha', direction: 'ascending' });
  const [filters, setFilters] = useState({
    id_contribucion: '',
    descripcion: '',
    fecha: '',
    realizado: '',
    estado: '',
  });

  const fetchContribuciones = useCallback(async () => {
      setLoading(true);
      // Obtener el id y responsable desde localStorage
      const stored = localStorage.getItem('usuario');
      let idCasa = null;
      if (stored) {
        try {
          const user = JSON.parse(stored);
          idCasa = user.id;
          setUsuario(user);
        } catch (e) {
          console.error("Error al parsear el usuario desde localStorage:", e);
        }
      }
      if (!idCasa) {
        setError('No se encontró el usuario en localStorage');
        setLoading(false);
        return;
      }
      const { data, error } = await supabase
  .from('v_usuarios_contribuciones')
  .select('id_contribucion, descripcion, fecha, realizado, dias_restantes, url_comprobante')
  .eq('id', idCasa);
      if (error) {
        setError(`Error al cargar los calendarios: ${error.message}`);
      } else if (!data || !Array.isArray(data)) {
        setError('No se recibieron datos válidos de Supabase');
        setContribuciones([]);
      } else {
        setContribuciones((data as Contribucion[]) || []);
      }
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchContribuciones();
  }, [fetchContribuciones]);

  // Botón para regresar al menú principal
  const handleRegresarMenu = () => {
    router.push('/menu');
  };

  const handleSort = (key: SortableKeys) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

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
    // Esto asegura que siempre se use el método correcto y es más seguro.
    const { data } = supabase.storage.from('imagenespagos').getPublicUrl(url);
    const fullUrl = data.publicUrl;
    setViewingImageUrl(fullUrl);
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
      alert('¡Pago registrado exitosamente!');
      handleClosePaymentModal();
      fetchContribuciones(); // Recargar los datos
    } catch (error: unknown) {
      let message = 'desconocido';
      if (error instanceof Error) {
        message = error.message;
      }
      alert(`Error al registrar el pago: ${message}`);
    }
  };

  const getEstado = useCallback((row: Contribucion): { texto: string; icon: React.ReactNode | null; color: string } => {
    if (row.realizado === 'S') {
      return { texto: 'Pagado', color: 'text-green-700', icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-green-600"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> };
    }
    if (typeof row.dias_restantes === 'number') {
      if (row.dias_restantes >= 0) {
        return { texto: 'Vencido', color: 'text-red-700', icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-red-600"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg> };
      } else {
        const diasFuturo = Math.abs(row.dias_restantes);
        const textColor = diasFuturo <= 7 ? 'text-yellow-700' : 'text-blue-700';
        const iconColor = diasFuturo <= 7 ? 'text-yellow-500' : 'text-blue-500';
        return { texto: `Programado (${diasFuturo} días)`, color: textColor, icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-6 h-6 ${iconColor}`}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> };
      }
    }
    return { texto: 'Pendiente', color: 'text-gray-700', icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-gray-500"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> };
  }, []);

  const filteredAndSortedContribuciones = useMemo(() => {
    let items: ContribucionConEstado[] = contribuciones.map(c => ({
      ...c,
      estado: getEstado(c).texto,
    }));

    // Filtrado
    items = items.filter(item => {
      return (
        String(item.id_contribucion).toLowerCase().includes(filters.id_contribucion.toLowerCase()) &&
        (item.descripcion || '').toLowerCase().includes(filters.descripcion.toLowerCase()) &&
        item.fecha.toLowerCase().includes(filters.fecha.toLowerCase()) &&
        (item.realizado === 'S' ? 'sí' : 'no').includes(filters.realizado.toLowerCase()) &&
        item.estado.toLowerCase().includes(filters.estado.toLowerCase())
      );
    });

    // Ordenamiento
    if (sortConfig !== null) {
      items.sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];

        if (aValue === null || aValue === undefined) return 1;
        if (bValue === null || bValue === undefined) return -1;

        if (typeof aValue === 'string' && typeof bValue === 'string') {
          return sortConfig.direction === 'ascending' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
        }

        if (aValue < bValue) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }

    return items;
  }, [contribuciones, filters, sortConfig, getEstado]);

  const handleGeneratePDF = useCallback(() => {
    if (!usuario || filteredAndSortedContribuciones.length === 0) {
      alert('No hay datos para generar el reporte. Pruebe cambiando los filtros.');
      return;
    }

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    const generatePdfContent = (doc: jsPDF) => {
      doc.setFontSize(22);
      doc.setFont('helvetica', 'bold');
      doc.text('Reporte de Aportaciones', pageWidth / 2, 22, { align: 'center' });

      // --- Información del Usuario ---
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text(`Casa: ${usuario.id}`, 14, 45);
      
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text(`Responsable: ${usuario.responsable}`, 14, 52);

      // --- Tabla de Aportaciones ---
      const tableColumn = ["#", "Descripción", "Fecha Límite", "Realizado", "Estado"];
      const tableRows: (string | number)[][] = [];

      filteredAndSortedContribuciones.forEach(contrib => {
        const contribData = [
          contrib.id_contribucion,
          contrib.descripcion ?? '',
          contrib.fecha,
          contrib.realizado === 'S' ? 'Sí' : 'No',
          contrib.estado,
        ];
        tableRows.push(contribData);
      });

      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 60,
        theme: 'grid',
        headStyles: { fillColor: [22, 78, 99], textColor: [255, 255, 255], fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [241, 245, 249] },
        styles: { font: 'helvetica', fontSize: 10 },
      });

      doc.save(`Reporte_Aportaciones_Casa_${usuario.id}.pdf`);
    };

    // --- Encabezado con Logo y Título ---
    fetch('/logo.png')
      .then(response => response.blob())
      .then(blob => {
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = () => {
          const logoBase64 = reader.result as string;
          doc.addImage(logoBase64, 'PNG', 14, 15, 20, 20); // Logo
          generatePdfContent(doc);
        };
      }).catch(() => {
        console.warn("No se pudo cargar el logo. El reporte se generará sin él.");
        generatePdfContent(doc);
      });
  }, [usuario, filteredAndSortedContribuciones]);

  return (
    <div className="flex min-h-screen flex-col bg-gray-100">
      {/* Botón regresar arriba a la izquierda */}
      <div className="flex justify-between items-center mt-4 mx-4">
        <button
          type="button"
          onClick={handleRegresarMenu}
          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm flex items-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
          Regresar
        </button>
        <button
          type="button"
          onClick={handleGeneratePDF}
          className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm flex items-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
          </svg>
          Reporte PDF
        </button>
      </div>
  <div className="w-full max-w-md sm:max-w-3xl mx-auto flex flex-col items-center p-2 sm:p-8">
      {usuario && (
        <>
          <h2 className="text-3xl font-extrabold mb-4 text-blue-700 text-center tracking-tight">Programación de Aportaciones</h2>
          <div className="mb-4 text-xs text-gray-500 text-center w-full">
            <span className="font-semibold text-blue-900">Casa:</span> {usuario.id} &nbsp;|&nbsp; <span className="font-semibold text-blue-900">Responsable:</span> {usuario.responsable}
          </div>
        </>
      )}
  {/* Título eliminado para evitar duplicado */}
        {loading && <div>Cargando...</div>}
        {error && <div className="text-red-500">{error}</div>}
        <div className="overflow-x-auto w-full -mx-2 sm:mx-0">
          <table className="min-w-full border rounded-lg shadow text-xs sm:text-sm">
            <thead>
              <tr className="bg-blue-900 text-white">
                <th className="border px-2 py-2 sm:px-4 sm:py-3 font-semibold"><button onClick={() => handleSort('id_contribucion')} className="flex items-center gap-1 w-full justify-center"># {sortConfig?.key === 'id_contribucion' && (sortConfig.direction === 'ascending' ? '▲' : '▼')}</button></th>
                <th className="border px-2 py-2 sm:px-4 sm:py-3 font-semibold"><button onClick={() => handleSort('descripcion')} className="flex items-center gap-1 w-full">Descripción {sortConfig?.key === 'descripcion' && (sortConfig.direction === 'ascending' ? '▲' : '▼')}</button></th>
                <th className="border px-2 py-2 sm:px-4 sm:py-3 font-semibold"><button onClick={() => handleSort('fecha')} className="flex items-center gap-1 w-full justify-center">Fecha {sortConfig?.key === 'fecha' && (sortConfig.direction === 'ascending' ? '▲' : '▼')}</button></th>
                <th className="border px-2 py-2 sm:px-4 sm:py-3 font-semibold"><button onClick={() => handleSort('realizado')} className="flex items-center gap-1 w-full justify-center">Realizado {sortConfig?.key === 'realizado' && (sortConfig.direction === 'ascending' ? '▲' : '▼')}</button></th>
                <th className="border px-2 py-2 sm:px-4 sm:py-3 font-semibold"><button onClick={() => handleSort('estado')} className="flex items-center gap-1 w-full justify-center">Estado {sortConfig?.key === 'estado' && (sortConfig.direction === 'ascending' ? '▲' : '▼')}</button></th>
                <th className="border px-2 py-2 sm:px-4 sm:py-3 font-semibold">Acciones</th>
              </tr>
              <tr className="bg-gray-200">
                <th className="border px-2 py-1"><input name="id_contribucion" value={filters.id_contribucion} onChange={handleFilterChange} placeholder="Filtrar..." className="text-xs p-1 border rounded w-full font-normal" /></th>
                <th className="border px-2 py-1"><input name="descripcion" value={filters.descripcion} onChange={handleFilterChange} placeholder="Filtrar..." className="text-xs p-1 border rounded w-full font-normal" /></th>
                <th className="border px-2 py-1"><input name="fecha" value={filters.fecha} onChange={handleFilterChange} placeholder="Filtrar..." className="text-xs p-1 border rounded w-full font-normal" /></th>
                <th className="border px-2 py-1"><input name="realizado" value={filters.realizado} onChange={handleFilterChange} placeholder="Sí/No" className="text-xs p-1 border rounded w-full font-normal" /></th>
                <th className="border px-2 py-1"><input name="estado" value={filters.estado} onChange={handleFilterChange} placeholder="Filtrar..." className="text-xs p-1 border rounded w-full font-normal" /></th>
                <th className="border px-2 py-1"></th>
              </tr>
            </thead>
            <tbody>
              {filteredAndSortedContribuciones.length > 0 ? (
                filteredAndSortedContribuciones.map((row, idx) => {
                  const { icon, color, texto } = getEstado(row);
                  return (
                    <tr key={`${row.id_contribucion}-${row.fecha}`} className={idx % 2 === 0 ? "bg-blue-50" : "bg-gray-100"}>
                      <td className="border px-2 py-2 sm:px-4 sm:py-3 text-center font-bold text-blue-900">{String(row.id_contribucion)}</td>
                      <td className="border px-2 py-2 sm:px-4 sm:py-3 text-blue-900">{String(row.descripcion ?? '')}</td>
                      <td className="border px-1 py-2 sm:px-4 sm:py-3 text-center text-blue-900">{String(row.fecha)}</td>
                      <td className="border px-2 py-2 sm:px-4 sm:py-3 text-center">
                        <span className={`inline-block px-2 py-1 rounded text-xs sm:text-sm ${row.realizado === 'S' ? 'bg-blue-200 text-blue-900 border border-blue-400' : 'bg-gray-300 text-gray-700 border border-gray-400'}`}>
                          {row.realizado === 'S' ? 'Sí' : 'No'}
                        </span>
                      </td>
                      <td className="border px-2 py-2 sm:px-4 sm:py-3 text-center">
                        <div className={`flex items-center justify-center gap-2 font-medium ${color}`}>
                          {icon}
                          <span className="hidden sm:inline">{texto}</span>
                        </div>
                      </td>
                      <td className="border px-2 py-2 sm:px-4 sm:py-3 text-center">
                        {row.realizado === 'N' && (
                          <button onClick={() => handleOpenPaymentModal(row)} className="bg-green-500 text-white font-bold py-1 px-3 rounded-md text-xs hover:bg-green-600">Reportar Pago</button>
                        )}
                        {row.realizado === 'S' && row.url_comprobante && (
                          <button onClick={() => handleOpenImageViewer(row.url_comprobante)} className="bg-blue-500 text-white font-bold py-1 px-3 rounded-md text-xs hover:bg-blue-600">Ver Comprobante</button>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="text-center py-10 text-gray-500">
                    {loading ? 'Cargando...' : 'No se encontraron aportaciones que coincidan con los filtros.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
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
    </div>
  );
}
