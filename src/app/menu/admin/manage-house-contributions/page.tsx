'use client';

/**
 * @file /src/app/admin/manage-house-contributions/page.tsx
 * @fileoverview Página de administración para gestionar las aportaciones por casa.
 * @description Esta pantalla permite a los administradores realizar operaciones CRUD (Crear, Leer, Actualizar, Eliminar)
 * sobre los registros de aportaciones. Ofrece una vista de tabla para escritorio y tarjetas para móvil,
 * con funcionalidades de filtrado, ordenamiento, carga masiva por CSV y generación de reportes en PDF.
 *
 * @accesible_desde Menú de "Admin" en el encabezado -> Opción "Aportaciones".
 * @acceso_a_datos Utiliza el hook `useContributionsData` para obtener todos los registros de la vista
 * `v_usuarios_contribuciones`. El filtrado y la ordenación se realizan en el lado del cliente mediante `useMemo`.
 */
import { useState, useCallback, useRef, useMemo, useEffect, Fragment } from 'react';
import { Menu, Transition } from '@headlessui/react';
import { toast } from 'react-hot-toast';
import { createClient } from '@/utils/supabase/client';
import type { ContribucionPorCasa } from '@/types/database';
import type { ContribucionPorCasaExt, SortableKeys } from '@/types';
import ContributionModal from './components/ContributionModal';
import ContributionCard from './components/ContributionCard';
import FiltersBar from './components/FiltersBar';
import PageHeader from './components/PageHeader';
import { useI18n } from '@/app/i18n-provider';
import { formatDate, formatCurrency } from '@/utils/format';
import { useContribucionesManager } from './hooks/useContribucionesManager';

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// --- Componente Principal de la Página ---
export default function ManageHouseContributionsPage() {
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { t, locale, currency } = useI18n();
  
  // Usar hook para datos derivados (sin duplicar lógica)
  const {
    records,
    usuarios,
    contribuciones,
    loading,
    fetchError,
    selectedYear,
    selectedContribucion,
    sortBy,
    sortConfig,
    filters,
    filteredAndSortedRecords,
    uniqueYears,
    uniqueContribucionTypes,
    setSelectedYear,
    setSelectedContribucion,
    setSortBy,
    setSortConfig,
    handleFilterChange,
    handleSave: hookHandleSave,
    handleDelete: hookHandleDelete,
    refetch
  } = useContribucionesManager();

  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<Partial<ContribucionPorCasaExt> | null>(null);
  const [isUploadingCsv, setIsUploadingCsv] = useState(false);
const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const handleOpenModal = (record: Partial<ContribucionPorCasaExt> | null = null) => {
    setEditingRecord(record);
    setIsModalOpen(true);
  };

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setEditingRecord(null);
  }, []);

  const handleSave = useCallback(async (recordData: Partial<ContribucionPorCasaExt>) => {
    setError(null); // Limpiar errores de UI
    try {
      if (!editingRecord && (!recordData.id_casa || !recordData.id_contribucion || !recordData.fecha)) {
        throw new Error("Casa, Contribución y Fecha son obligatorios para crear un nuevo registro.");
      }

      await hookHandleSave(recordData, !!editingRecord);
      toast.success(t('manageContributions.alerts.saveSuccess'));
      handleCloseModal();
    } catch (err: unknown) {
      const message = err && typeof err === 'object' && 'message' in err ? (err as { message: string }).message : 'desconocido';
      const errorMessage = t('manageContributions.alerts.saveError', { message });
      setError(errorMessage);
      toast.error(errorMessage, { duration: 6000 });
    }
  }, [editingRecord, t, handleCloseModal, hookHandleSave]);

  const handleDelete = useCallback(async (recordToDelete: ContribucionPorCasa) => {
    if (window.confirm(t('manageContributions.alerts.resetConfirm'))) {
      try {
        await hookHandleDelete(recordToDelete);
        toast.success(t('manageContributions.alerts.resetSuccess'));
      } catch (error: any) {
        const errorMessage = t('manageContributions.alerts.resetError', { message: error.message || 'Error desconocido' });
        setError(errorMessage);
        toast.error(errorMessage);
      }
    }
  }, [t, hookHandleDelete]);

  const handleSort = (key: SortableKeys) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const handleGeneratePDF = useCallback(() => {
    if (filteredAndSortedRecords.length === 0) {
      toast.error(t('manageContributions.alerts.pdfNoData'));
      return;
    }

    const doc = new jsPDF({ compress: true });
    const pageWidth = doc.internal.pageSize.getWidth();

    const generatePdfContent = (docInstance: jsPDF) => {
      // Encabezado del reporte
      docInstance.setFontSize(22);
      docInstance.setFont('helvetica', 'bold');
      docInstance.text(t('contributionReport.title'), pageWidth / 2, 22, { align: 'center' });
      
      docInstance.setFontSize(10);
      docInstance.setFont('helvetica', 'normal');
      docInstance.text(`${t('contributionReport.generatedOn')} ${new Date().toLocaleDateString()}`, pageWidth - 14, 22, { align: 'right' });

      // Preparar datos para la tabla
      const tableColumn = [t('contributionReport.headerHouse'), t('contributionReport.headerContribution'), t('contributionReport.headerDate'), t('contributionReport.headerAmount'), t('contributionReport.headerStatus')];
      const tableRows = filteredAndSortedRecords.map(record => {
        const casa = record.usuarios
          ? `${t('groups.house')} #${record.usuarios.id} - ${record.usuarios.responsable}`
          : `${t('groups.house')} ID: ${record.id_casa}`;
        const contribucion = record.contribucion ?? `ID: ${record.id_contribucion}`;
      const pagado = record.pagado != null ? formatCurrency(record.pagado, locale, currency) : t('manageContributions.card.notPaid');
        const realizado = record.realizado === 'PAGADO' ? t('calendar.table.yes') : t('calendar.table.no');
      return [casa, contribucion, formatDate(record.fecha, locale), pagado, realizado];
      });

      // Crear la tabla
      autoTable(docInstance, {
        head: [tableColumn],
        body: tableRows,
        startY: 35,
        theme: 'grid',
        headStyles: { fillColor: [22, 78, 99], textColor: [255, 255, 255], fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [241, 245, 249] },
        styles: { font: 'helvetica', fontSize: 8 },
      });

      try {
        const fileName = t('contributionReport.fileName');
        // Usar output('arraybuffer') y crear el Blob manualmente suele ser más eficiente en memoria que output('blob')
        const arrayBuffer = docInstance.output('arraybuffer');
        const blob = new Blob([arrayBuffer], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } catch (error) {
        console.error('Error generating PDF:', error);
        toast.error('Error al generar el PDF. Intente filtrar los datos para reducir el tamaño.');
      }
    };

    // Cargar el logo y luego generar el contenido del PDF
    fetch('/logo.png')
      .then(response => response.ok ? response.blob() : Promise.reject('Logo not found'))
      .then(blob => {
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = () => {
          const logoBase64 = reader.result as string;
          doc.addImage(logoBase64, 'PNG', 14, 15, 20, 20);
          generatePdfContent(doc);
        };
      }).catch(() => {
        console.warn("No se pudo cargar el logo. El reporte se generará sin él.");
        generatePdfContent(doc);
      });
  }, [filteredAndSortedRecords, t, locale, currency]);

  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    setIsUploadingCsv(true)
    setError(null);
    
      const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const text = e.target?.result as string;
        let lines = text.split(/\r\n|\n/).filter(line => line.trim() !== '');

        if (lines.length === 0) {
          throw new Error('El archivo CSV está vacío.');
        }

        // Detectar y omitir la cabecera si el primer campo de la primera línea no es un número.
        const firstLineValues = lines[0].split(',');
        if (isNaN(parseInt(firstLineValues[0], 10))) {
          lines = lines.slice(1);
        }

        if (lines.length === 0) {
          throw new Error('El archivo CSV no contiene registros de datos (después de omitir la cabecera).');
        }

        const recordsToInsert = lines.map((line, index) => {
          const values = line.split(',').map(v => v.trim());

          if (values.length < 5) {
            throw new Error(`La fila ${index + 1} tiene menos de 5 columnas. Se esperan: id_casa, id_contribucion, fecha, pagado, realizado.`);
          }

          const [idCasaStr, idContribucionStr, fechaStr, pagadoStr, realizadoStr] = values;

          const id_casa = parseInt(idCasaStr, 10);
          const id_contribucion = idContribucionStr;
          const fecha = fechaStr;
          const pagado = (pagadoStr && pagadoStr.trim() !== '') ? parseFloat(pagadoStr) : null;
          const realizado = ['true', '1', 's', 'si', 'yes', 'verdadero'].includes(realizadoStr?.toLowerCase() || '') ? 'S' : 'N';

          if (isNaN(id_casa) || !id_contribucion || !fecha) {
            throw new Error(`Datos inválidos en la fila ${index + 1}: id_casa, id_contribucion y fecha son obligatorios y deben tener el formato correcto.`);
          }

          // CORRECCIÓN: Mapear a las columnas de la tabla.
          return { 
            id_casa, 
            id_contribucion, 
            fecha_cargo: fecha, 
            monto_pagado: pagado, 
            estado: realizado === 'S' ? 'PAGADO' : 'PENDIENTE' 
          };
        });

        if (recordsToInsert.length === 0) {
          throw new Error('No se encontraron registros válidos para insertar en el CSV.');
        }

        const { error: insertError } = await supabase.from('contribucionesporcasa').insert(recordsToInsert);
        if (insertError) throw insertError;

        alert(`${recordsToInsert.length} registros insertados correctamente.`);
        refetch();
      } catch (err: unknown) {
        console.error('Error en handleFileUpload:', err);
        if (err instanceof Error) {
          setError(`Error al procesar el archivo CSV: ${err.message}`);
        } else {
          setError('Error desconocido al procesar el archivo CSV.');
        }
      } finally {
        setIsUploadingCsv(false);
        if (event.target) {
            event.target.value = '';
        }
      }
    };

    reader.onerror = () => {
      setError('Error al leer el archivo.');
      setIsUploadingCsv(false);
    };

    reader.readAsText(file);
  }, [supabase, refetch]);

  return (
      <div className="bg-gray-50 p-2 sm:p-8">
        <div className="mb-6 space-y-4">
          <PageHeader
            onAdd={() => handleOpenModal(null)}
            onUploadClick={() => fileInputRef.current?.click()}
            onExportPdf={handleGeneratePDF}
            onExportCards={() => {
              localStorage.setItem('pdfReportData', JSON.stringify(filteredAndSortedRecords));
              window.open('/menu/admin/manage-house-contributions/report', '_blank');
            }}
            onFilterClick={() => setIsFilterModalOpen(true)}
            onSort={handleSort}
            isUploading={isUploadingCsv}
            isLoading={loading}
          />

          {/* Filtros Rápidos - Ahora debajo del título y acciones para evitar scroll horizontal */}
          <FiltersBar
            uniqueYears={uniqueYears}
            uniqueContribucionTypes={uniqueContribucionTypes}
            selectedYear={selectedYear}
            selectedContribucion={selectedContribucion}
            sortBy={sortBy}
            sortConfig={sortConfig}
            onYearChange={setSelectedYear}
            onContribucionChange={setSelectedContribucion}
            onSortByChange={setSortBy}
            onSortConfigChange={setSortConfig}
          />
        </div>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            className="hidden"
            accept=".csv"
          />

      {loading && <p className="text-center">{t('manageContributions.loading')}</p>}
      {isUploadingCsv && <p className="text-center text-purple-600">{t('manageContributions.uploading')}</p>}
      {fetchError && <p className="text-center text-red-500 bg-red-100 p-3 rounded">{t('manageContributions.loadError')} {fetchError}</p>}
      {error && <p className="text-center text-red-500 bg-red-100 p-3 rounded">{t('manageContributions.operationError')} {error}</p>}

      {!loading && !fetchError && records.length === 0 ? (
        <div className="text-center py-10 bg-white shadow-md rounded-lg">
          <p className="text-gray-500">{t('manageContributions.emptyState.noContributions')}</p>
          <p className="text-sm text-gray-400 mt-2">
            {t('manageContributions.emptyState.addContributionHint')}
          </p>
        </div>
      ) : (
        <>
          {/* La vista de tabla ha sido eliminada para unificar la interfaz a "Mobile-Only" */}
          <div className="block">
            {filteredAndSortedRecords.map((record) => (
              <ContributionCard
                key={`${record.id_casa}-${record.id_contribucion}-${record.fecha}`}
                record={record}
                onDelete={handleDelete}
                onOpenModal={handleOpenModal}
              />
            ))}
          </div>

          {records.length > 0 && filteredAndSortedRecords.length === 0 && (
            <div className="text-center py-10 bg-white shadow-md rounded-lg mt-4">
              <p className="text-gray-500">{t('manageContributions.noResults')}</p>
            </div>
          )}
        </>
      )}

      <ContributionModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSave}
        record={editingRecord}
        usuarios={usuarios}
        contribuciones={contribuciones}
      />

      {/* Modal de Filtros para Móvil */}
      {isFilterModalOpen && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex justify-center items-center p-4">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-sm">
            <h2 className="text-xl font-bold mb-4">{t('contributionFilterModal.title')}</h2>
            <div className="space-y-4">
              <input name="casa" value={filters.casa} onChange={handleFilterChange} placeholder={t('contributionFilterModal.housePlaceholder')} className="w-full p-2 border rounded" />
              <input name="contribucion" value={filters.contribucion} onChange={handleFilterChange} placeholder={t('contributionFilterModal.contributionPlaceholder')} className="w-full p-2 border rounded" />
              <input name="fecha" value={filters.fecha} onChange={handleFilterChange} placeholder={t('contributionFilterModal.datePlaceholder')} className="w-full p-2 border rounded" />
              <input name="pagado" value={filters.pagado} onChange={handleFilterChange} placeholder={t('contributionFilterModal.amountPlaceholder')} className="w-full p-2 border rounded" />
              <input name="realizado" value={filters.realizado} onChange={handleFilterChange} placeholder={t('contributionFilterModal.statusPlaceholder')} className="w-full p-2 border rounded" />
            </div>
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setIsFilterModalOpen(false)}
                className="bg-blue-500 text-white font-bold py-2 px-4 rounded hover:bg-blue-700"
              >
                {t('contributionFilterModal.close')}
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
  );
}
