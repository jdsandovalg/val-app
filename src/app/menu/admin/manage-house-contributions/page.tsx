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
import { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { createClient } from '@/utils/supabase/client';
import type { ContribucionPorCasa } from '@/types/database';
import type { ContribucionPorCasaExt, SortableKeys } from '@/types';
import ContributionModal from './components/ContributionModal';
import ContributionCard from './components/ContributionCard';
import { useI18n } from '@/app/i18n-provider';
import { formatDate, formatCurrency } from '@/utils/format';

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { PDFDownloadLink, Document, Page, Text, View, Image, StyleSheet, Font } from '@react-pdf/renderer';
import PdfContributionCard from './components/PdfContributionCard';

// --- Componente Principal de la Página ---
export default function ManageHouseContributionsPage() {
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { t, locale, currency } = useI18n();
  const [logoBase64, setLogoBase64] = useState<string | null>(null);
  
  const [records, setRecords] = useState<ContribucionPorCasaExt[]>([]);
  const [usuarios, setUsuarios] = useState<{ id: number; responsable: string; }[]>([]);
  const [contribuciones, setContribuciones] = useState<{ id_contribucion: string; descripcion: string | null; }[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<Partial<ContribucionPorCasaExt> | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUploadingCsv, setIsUploadingCsv] = useState(false);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [isSortMenuOpen, setIsSortMenuOpen] = useState(false); // Estado para el menú de ordenamiento
  const [sortConfig, setSortConfig] = useState<{ key: SortableKeys; direction: 'ascending' | 'descending' } | null>({
    key: 'fecha',
    direction: 'descending',
  });
  const [filters, setFilters] = useState({
    casa: '',
    contribucion: '',
    fecha: '',
    pagado: '',
    realizado: '',
  });

  const menuRef = useRef<HTMLDivElement>(null);
  const sortMenuRef = useRef<HTMLDivElement>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    try {
      // CORRECCIÓN: Usar la vista 'v_usuarios_contribuciones' como única fuente de datos.
      const { data: recordsData, error: recordsError } = await supabase
        .from('v_usuarios_contribuciones')
        .select('*')
        .order('fecha', { ascending: false });

      if (recordsError) throw recordsError;

      const data = recordsData || [];

      // Mapear los datos de la vista al formato esperado por el componente.
      const formattedRecords = data.map(record => ({
        ...record,
        usuarios: { id: record.id, responsable: record.responsable },
        contribuciones: { id_contribucion: record.id_contribucion, descripcion: record.descripcion, color_del_borde: record.color_del_borde },
      }));
      setRecords(formattedRecords);

      // Extraer datos únicos para los modales desde la data ya obtenida.
      const uniqueUsers = [...new Map(data.map(item => [item.id, { id: item.id, responsable: item.responsable }])).values()];
      const uniqueContribs = [...new Map(data.map(item => [item.id_contribucion, { id_contribucion: item.id_contribucion, descripcion: item.descripcion }])).values()];

      setUsuarios(uniqueUsers);
      setContribuciones(uniqueContribs);

    } catch (err: unknown) {
      // Mejoramos el manejo de errores para obtener un mensaje claro.
      const message = err && typeof err === 'object' && 'message' in err ? (err as { message: string }).message : 'Ocurrió un error desconocido.';
      console.error("Error completo al cargar datos de aportaciones:", err); // Log para depuración
      setFetchError(`Error al cargar los datos: ${message}`);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchData();
    // Cargar el logo para el PDF
    fetch('/logo.png')
      .then(response => response.ok ? response.blob() : Promise.reject('Logo not found'))
      .then(blob => {
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = () => {
          setLogoBase64(reader.result as string);
        };
      }).catch(() => {
        console.warn("No se pudo cargar el logo para el PDF.");
        setLogoBase64(null);
      });
  }, [fetchData]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
      if (sortMenuRef.current && !sortMenuRef.current.contains(event.target as Node)) {
        setIsSortMenuOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

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
      const recordToSave = {
        id_casa: recordData.id_casa,
        id_contribucion: recordData.id_contribucion,
        fecha: recordData.fecha,
        pagado: recordData.pagado,
        realizado: recordData.realizado,
        fechapago: recordData.fechapago,
        url_comprobante: recordData.url_comprobante,
      };

      // Si editingRecord existe, es una ACTUALIZACIÓN (UPDATE).
      if (editingRecord && editingRecord.id_casa && editingRecord.id_contribucion && editingRecord.fecha) {
        const { error } = await supabase
          .from('contribucionesporcasa')
          .update(recordToSave)
          .match({ id_casa: editingRecord.id_casa, id_contribucion: editingRecord.id_contribucion, fecha: editingRecord.fecha });
        if (error) throw error;
      } else {
        // De lo contrario, es una INSERCIÓN (INSERT).
        if (!recordData.id_casa || !recordData.id_contribucion || !recordData.fecha) {
          throw new Error("Casa, Contribución y Fecha son obligatorios para crear un nuevo registro.");
        }
        const { error } = await supabase.from('contribucionesporcasa').insert(recordToSave);
        if (error) throw error;
      }

      toast.success(t('manageContributions.alerts.saveSuccess'));
    } catch (err: unknown) {
      console.error('Error en handleSave:', err);
      let message = 'desconocido';
      if (err && typeof err === 'object' && 'message' in err) {
        message = (err as { message: string }).message;
      }
      const errorMessage = t('manageContributions.alerts.saveError', { message });
      setError(errorMessage);
      toast.error(errorMessage, { duration: 6000 });
    } finally {
      handleCloseModal();
      fetchData(); // Recargar datos
    }
  }, [supabase, editingRecord, t, handleCloseModal, fetchData]);

  const handleDelete = useCallback(async (recordToDelete: ContribucionPorCasa) => {
    if (window.confirm(t('manageContributions.alerts.deleteConfirm'))) {
      // CORRECCIÓN: Usar una operación DELETE directa a la tabla.
      const { error } = await supabase
        .from('contribucionesporcasa')
        .delete()
        .match({ id_casa: recordToDelete.id_casa, id_contribucion: recordToDelete.id_contribucion, fecha: recordToDelete.fecha });

      if (error) {
        const errorMessage = t('manageContributions.alerts.deleteError', { message: error.message });
        setError(errorMessage);
        toast.error(errorMessage);
      } else {
        fetchData(); // Recargar datos
      }
    }
  }, [supabase, t, fetchData]);

  const handleSort = (key: SortableKeys) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const filteredAndSortedRecords = useMemo(() => {
    let filteredItems = [...records];

    // Aplicar filtros
    if (filters.casa) {
      filteredItems = filteredItems.filter(record =>
        (record.usuarios ? `Casa #${record.usuarios.id} - ${record.usuarios.responsable}` : `Casa ID: ${record.id_casa}`)
          .toLowerCase()
          .includes(filters.casa.toLowerCase())
      );
    }
    if (filters.contribucion) {
      filteredItems = filteredItems.filter(record =>
        (record.contribuciones?.descripcion ?? `ID: ${record.id_contribucion}`) // Usar la descripción
          .toLowerCase()
          .includes(filters.contribucion.toLowerCase()) // Búsqueda parcial (LIKE)
      );
    }
    if (filters.fecha) {
      const filterLowerCase = filters.fecha.toLowerCase();
      filteredItems = filteredItems.filter(record => {
        if (!record.fecha) return false;
        // Formatear la fecha a un string más amigable para la búsqueda (ej: "15 de enero de 2024")
        const date = new Date(`${record.fecha}T00:00:00`); // Asegurar que se interprete como fecha local
        const formattedDate = date.toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' });
        // Permitir búsqueda por el formato original o por el nombre del mes
        return record.fecha.includes(filterLowerCase) || formattedDate.toLowerCase().includes(filterLowerCase);
      }
      );
    }
    if (filters.pagado) {
      filteredItems = filteredItems.filter(record =>
        (record.pagado != null ? `$${Number(record.pagado).toFixed(2)}` : 'no pagado')
          .toLowerCase()
          .includes(filters.pagado.toLowerCase())
      );
    }
    if (filters.realizado) {
      const filterValue = filters.realizado.toLowerCase();
      filteredItems = filteredItems.filter(record =>
        (record.realizado === 'S' ? '✅ sí' : '❌ no').toLowerCase().includes(filterValue)
      );
    }

    const sortableItems: ContribucionPorCasaExt[] = [...filteredItems];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        let aValue: string | number | null | undefined;
        let bValue: string | number | null | undefined;

        switch (sortConfig.key) {
          case 'usuarios':
            aValue = a.usuarios?.responsable?.toLowerCase() ?? '';
            bValue = b.usuarios?.responsable?.toLowerCase() ?? '';
            break;
          case 'contribuciones':
            aValue = a.contribuciones?.descripcion?.toLowerCase() ?? '';
            bValue = b.contribuciones?.descripcion?.toLowerCase() ?? '';
            break;
          case 'pagado':
            aValue = a.pagado ?? -Infinity; // Treat null as the smallest value
            bValue = b.pagado ?? -Infinity;
            break;
          default:
            // Para el resto de las claves, se tratan como strings o tipos comparables directamente.
            aValue = a[sortConfig.key as keyof ContribucionPorCasa];
            bValue = b[sortConfig.key as keyof ContribucionPorCasa];
        }

        // Lógica de comparación específica para números (como 'pagado')
        if (typeof aValue === 'number' && typeof bValue === 'number') {
          if (aValue < bValue) return sortConfig.direction === 'ascending' ? -1 : 1;
          if (aValue > bValue) return sortConfig.direction === 'ascending' ? 1 : -1;
          return 0;
        }

        // Lógica de comparación para strings y otros tipos
        const valA = aValue === null || aValue === undefined ? '' : aValue;
        const valB = bValue === null || bValue === undefined ? '' : bValue;

        if (valA < valB) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (valA > valB) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [records, sortConfig, filters]);

  const handleGeneratePDF = useCallback(() => {
    if (filteredAndSortedRecords.length === 0) {
      toast.error(t('manageContributions.alerts.pdfNoData'));
      return;
    }

    const doc = new jsPDF();
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
        const contribucion = record.contribuciones?.descripcion ?? `ID: ${record.id_contribucion}`;
      const pagado = record.pagado != null ? formatCurrency(record.pagado, locale, currency) : t('manageContributions.card.notPaid');
        const realizado = record.realizado === 'S' ? t('calendar.table.yes') : t('calendar.table.no');
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

      docInstance.save(t('contributionReport.fileName'));
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

  // --- Lógica para el nuevo reporte con tarjetas ---
  Font.register({
    family: 'Helvetica',
    fonts: [
      { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-regular-webfont.ttf', fontWeight: 'normal' },
      { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-bold-webfont.ttf', fontWeight: 'bold' },
    ]
  });

  const styles = StyleSheet.create({
    page: {
      padding: 20,
      fontFamily: 'Helvetica',
      backgroundColor: '#F9FAFB', // gray-50
    },
    title: {
      fontSize: 24,
      textAlign: 'center',
      marginBottom: 20,
      fontWeight: 'bold',
      color: '#1F2937', // gray-800
    },
    cardContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
    },
    header: {
      position: 'absolute',
      top: 10,
      left: 20,
      right: 20,
      height: 50,
      flexDirection: 'row',
      alignItems: 'center',
    },
    logo: {
      width: 40,
      height: 40,
    },
    footer: {
      position: 'absolute',
      bottom: 10,
      left: 20,
      right: 20,
      textAlign: 'center',
      color: 'grey',
      fontSize: 10,
    },
  });

  const PdfCardDocument = (
    <Document>
      <Page size="A4" style={styles.page} wrap>
        {/* eslint-disable-next-line jsx-a11y/alt-text -- La prop 'alt' no es aplicable en react-pdf */}
        {logoBase64 && <Image style={styles.logo} src={logoBase64} fixed />}
        <Text style={styles.title} fixed>{t('contributionReport.title')}</Text>
        <View style={styles.cardContainer} wrap>
          {filteredAndSortedRecords.map((record) => (
            <PdfContributionCard key={`${record.id_casa}-${record.id_contribucion}-${record.fecha}`} record={record} t={t} locale={locale} currency={currency} />
          ))}
        </View>
        <Text style={styles.footer} render={({ pageNumber, totalPages }) => (`${t('contributionReport.generatedOn')} ${new Date().toLocaleDateString(locale)} | ${pageNumber} / ${totalPages}`)} fixed />
      </Page>
    </Document>
  );

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

          return { id_casa, id_contribucion, fecha, pagado, realizado };
        });

        if (recordsToInsert.length === 0) {
          throw new Error('No se encontraron registros válidos para insertar en el CSV.');
        }

        const { error: insertError } = await supabase.from('contribucionesporcasa').insert(recordsToInsert);
        if (insertError) throw insertError;

        alert(`${recordsToInsert.length} registros insertados correctamente.`);
        fetchData();
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
  }, [supabase, fetchData]);

  return (
      <div className="bg-gray-50 p-4 sm:p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-1xl font-bold text-gray-800 text-center">{t('manageContributions.title')}</h1>

          {/* Contenedor de Acciones */}
          <div className="relative flex items-center gap-2">
            {/* Botón de Filtros (solo para móvil) */}
            <button
              onClick={() => setIsFilterModalOpen(true)}
              className="p-2 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-400"
              aria-label={t('manageContributions.ariaLabels.openFilters')}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 md:w-6 md:h-6 text-gray-700">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 01-.659 1.591l-5.432 5.432a2.25 2.25 0 00-.659 1.591v2.927a2.25 2.25 0 01-1.244 2.013L9.75 21v-6.572a2.25 2.25 0 00-.659-1.591L3.659 7.409A2.25 2.25 0 013 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0112 3z" />
              </svg>
            </button>
            
            {/* Botón de Ordenamiento (solo para móvil) */}
            <div className="relative" ref={sortMenuRef}>
              <button
                onClick={() => setIsSortMenuOpen(prev => !prev)}
                className="p-2 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-400"
                aria-label={t('manageContributions.ariaLabels.openSortMenu')}
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 md:w-6 md:h-6 text-gray-700">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 7.5L7.5 3m0 0L12 7.5M7.5 3v13.5m13.5 0L16.5 21m0 0L12 16.5m4.5 4.5V7.5" />
                </svg>
              </button>
              {isSortMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border border-gray-200">
                  <div className="py-1">
                    <button onClick={() => { handleSort('fecha'); setIsSortMenuOpen(false); }} className="w-full text-left px-2 py-0.5 md:px-4 md:py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2 md:gap-3">{t('manageContributions.sortMenu.byDate')}</button>
                    <button onClick={() => { handleSort('usuarios'); setIsSortMenuOpen(false); }} className="w-full text-left px-2 py-0.5 md:px-4 md:py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2 md:gap-3">{t('manageContributions.sortMenu.byHouse')}</button>
                    <button onClick={() => { handleSort('contribuciones'); setIsSortMenuOpen(false); }} className="w-full text-left px-2 py-1 md:px-4 md:py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2 md:gap-3">{t('manageContributions.sortMenu.byContribution')}</button>
                    <button onClick={() => { handleSort('realizado'); setIsSortMenuOpen(false); }} className="w-full text-left px-2 py-0.5 md:px-4 md:py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2 md:gap-3">{t('manageContributions.sortMenu.byStatus')}</button>
                  </div>
                </div>
              )}
            </div>

            {/* Botón de Menú de Acciones */}
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setIsMenuOpen(prev => !prev)}
                className="p-2 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-400"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-gray-700">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 12.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 18.75a.75.75 0 110-1.5.75.75 0 010 1.5z" />
                </svg>
              </button>

              {/* Menú Desplegable */}
              {isMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg z-10 border border-gray-200">
                  <div className="py-1">
                    <button onClick={() => { handleOpenModal(null); setIsMenuOpen(false); }} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-3" disabled={isUploadingCsv} >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                      {t('manageContributions.actionsMenu.addNew')}
                    </button>
                    <button onClick={() => { fileInputRef.current?.click(); setIsMenuOpen(false); }} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-3" disabled={loading || isUploadingCsv} >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" /></svg>
                      {isUploadingCsv ? t('manageContributions.actionsMenu.processing') : t('manageContributions.actionsMenu.uploadCsv')}
                    </button>
                    <button onClick={() => { handleGeneratePDF(); setIsMenuOpen(false); }} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-3" disabled={loading || isUploadingCsv} >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>
                      {t('manageContributions.actionsMenu.pdfReport')}
                    </button>
                    <PDFDownloadLink document={PdfCardDocument} fileName={t('contributionReport.fileName')}>
                      {({ loading: pdfLoading }) => (
                        <button
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-3"
                          disabled={loading || isUploadingCsv || pdfLoading}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75l3 3m0 0l3-3m-3 3v-7.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                          {pdfLoading ? t('manageContributions.actionsMenu.processing') : t('manageContributions.actionsMenu.pdfCardReport')}
                        </button>
                      )}
                    </PDFDownloadLink>
                  </div>
                </div>
              )}
            </div>
          </div>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            className="hidden"
            accept=".csv"
          />
        </div>

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
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
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
