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
import { createClient } from '@/utils/supabase/client';
import type { ContribucionPorCasa } from '@/types/database';
import type { ContribucionPorCasaExt, SortableKeys } from '@/types';
import ContributionModal from './components/ContributionModal';
import ContributionTable from './components/ContributionTable';
import ContributionCard from './components/ContributionCard';

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// --- Componente Principal de la Página ---
export default function ManageHouseContributionsPage() {
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
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

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleOpenModal = (record: Partial<ContribucionPorCasaExt> | null = null) => {
    setEditingRecord(record);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingRecord(null);
  };

  const handleSave = async (recordData: Partial<ContribucionPorCasaExt>) => {
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

      alert('¡Registro guardado exitosamente!');
    } catch (err: unknown) {
      console.error('Error en handleSave:', err);
      let message = 'desconocido';
      if (err && typeof err === 'object' && 'message' in err) {
        message = (err as { message: string }).message;
      }
      const errorMessage = `Error al guardar el registro: ${message}.\n\nVerifique que tiene permisos para INSERTAR/ACTUALIZAR en la tabla (RLS en Supabase) y que todos los campos obligatorios tienen un valor.`;
      setError(errorMessage);
      alert(errorMessage);
    } finally {
      handleCloseModal();
      fetchData(); // Recargar datos
    }
  };

  const handleDelete = async (recordToDelete: ContribucionPorCasa) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este registro?')) {
      // CORRECCIÓN: Usar una operación DELETE directa a la tabla.
      const { error } = await supabase
        .from('contribucionesporcasa')
        .delete()
        .match({ id_casa: recordToDelete.id_casa, id_contribucion: recordToDelete.id_contribucion, fecha: recordToDelete.fecha });

      if (error) {
        const errorMessage = `Error al eliminar: ${error.message}`;
        setError(errorMessage);
        alert(errorMessage);
      } else {
        fetchData(); // Recargar datos
      }
    }
  };

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
      alert('No hay datos para generar el reporte. Pruebe cambiando los filtros.');
      return;
    }

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    const generatePdfContent = (docInstance: jsPDF) => {
      // Encabezado del reporte
      docInstance.setFontSize(22);
      docInstance.setFont('helvetica', 'bold');
      docInstance.text('Reporte de Aportaciones', pageWidth / 2, 22, { align: 'center' });
      
      docInstance.setFontSize(10);
      docInstance.setFont('helvetica', 'normal');
      docInstance.text(`Generado el: ${new Date().toLocaleDateString()}`, pageWidth - 14, 22, { align: 'right' });

      // Preparar datos para la tabla
      const tableColumn = ["Casa", "Contribución", "Fecha", "Monto Pagado", "Realizado"];
      const tableRows = filteredAndSortedRecords.map(record => {
        const casa = record.usuarios
          ? `Casa #${record.usuarios.id} - ${record.usuarios.responsable}`
          : `Casa ID: ${record.id_casa} (No encontrado)`;
        const contribucion = record.contribuciones?.descripcion ?? `ID: ${record.id_contribucion} (No encontrada)`;
        const pagado = record.pagado != null ? `$${Number(record.pagado).toFixed(2)}` : 'No pagado';
        const realizado = record.realizado === 'S' ? 'Sí' : 'No';
        return [casa, contribucion, record.fecha, pagado, realizado];
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

      docInstance.save('Reporte_Aportaciones.pdf');
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
  }, [filteredAndSortedRecords]);

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
          <h1 className="text-1xl font-bold text-gray-800 text-center">Gestionar Aportaciones</h1>

          {/* Contenedor de Acciones */}
          <div className="relative flex items-center gap-2">
            {/* Botón de Filtros (solo para móvil) */}
            <button
              onClick={() => setIsFilterModalOpen(true)}
              className="p-2 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-400 md:hidden"
              aria-label="Abrir filtros"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 md:w-6 md:h-6 text-gray-700">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 01-.659 1.591l-5.432 5.432a2.25 2.25 0 00-.659 1.591v2.927a2.25 2.25 0 01-1.244 2.013L9.75 21v-6.572a2.25 2.25 0 00-.659-1.591L3.659 7.409A2.25 2.25 0 013 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0112 3z" />
              </svg>
            </button>
            
            {/* Botón de Ordenamiento (solo para móvil) */}
            <div className="relative md:hidden">
              <button
                onClick={() => setIsSortMenuOpen(prev => !prev)}
                className="p-2 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-400"
                aria-label="Abrir menú de ordenamiento"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 md:w-6 md:h-6 text-gray-700">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 7.5L7.5 3m0 0L12 7.5M7.5 3v13.5m13.5 0L16.5 21m0 0L12 16.5m4.5 4.5V7.5" />
                </svg>
              </button>
              {isSortMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border border-gray-200">
                  <div className="py-1">
                    <button onClick={() => { handleSort('fecha'); setIsSortMenuOpen(false); }} className="w-full text-left px-2 py-0.5 md:px-4 md:py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2 md:gap-3">Ordenar por Fecha</button>
                    <button onClick={() => { handleSort('usuarios'); setIsSortMenuOpen(false); }} className="w-full text-left px-2 py-0.5 md:px-4 md:py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2 md:gap-3">Ordenar por Casa</button>
                    <button onClick={() => { handleSort('contribuciones'); setIsSortMenuOpen(false); }} className="w-full text-left px-2 py-1 md:px-4 md:py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2 md:gap-3">Ordenar por Contribución</button>
                    <button onClick={() => { handleSort('realizado'); setIsSortMenuOpen(false); }} className="w-full text-left px-2 py-0.5 md:px-4 md:py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2 md:gap-3">Ordenar por Estado</button>
                  </div>
                </div>
              )}
            </div>

            {/* Botón de Menú de Acciones */}
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
                    Agregar Nuevo
                  </button>
                  <button onClick={() => { fileInputRef.current?.click(); setIsMenuOpen(false); }} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-3" disabled={loading || isUploadingCsv} >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" /></svg>
                    {isUploadingCsv ? 'Procesando...' : 'Cargar CSV'}
                  </button>
                  <button onClick={() => { handleGeneratePDF(); setIsMenuOpen(false); }} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-3" disabled={loading || isUploadingCsv} >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>
                    Reporte PDF
                  </button>
                </div>
              </div>
            )}
          </div>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            className="hidden"
            accept=".csv"
          />
        </div>

      {loading && <p>Cargando datos de la tabla...</p>}
      {isUploadingCsv && <p className="text-purple-600">Procesando archivo CSV, por favor espere...</p>}
      {fetchError && <p className="text-red-500 bg-red-100 p-3 rounded">Error de carga: {fetchError}</p>}
      {error && <p className="text-red-500 bg-red-100 p-3 rounded">Error de operación: {error}</p>}

      {!loading && !fetchError && records.length === 0 ? (
        <div className="text-center py-10 bg-white shadow-md rounded-lg">
          <p className="text-gray-500">No hay aportaciones para mostrar.</p>
          <p className="text-sm text-gray-400 mt-2">
            Puedes agregar una nueva aportación usando el botón &apos;+ Agregar Nuevo&apos;.
          </p>
        </div>
      ) : (
        <>
          {/* Vista de Tabla para pantallas medianas y grandes (md y superior) */}
          <div className="hidden md:block">
            <ContributionTable
              records={filteredAndSortedRecords}
              sortConfig={sortConfig}
              filters={filters}
              handleSort={handleSort}
              handleFilterChange={handleFilterChange}
              handleDelete={handleDelete}
              handleOpenModal={handleOpenModal}
            />
          </div>

          {/* Vista de Tarjetas para pantallas pequeñas (hasta md) */}
          <div className="block md:hidden">
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
              <p className="text-gray-500">No se encontraron registros que coincidan con los filtros.</p>
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
            <h2 className="text-xl font-bold mb-4">Filtrar Registros</h2>
            <div className="space-y-4">
              <input name="casa" value={filters.casa} onChange={handleFilterChange} placeholder="Filtrar por casa..." className="w-full p-2 border rounded" />
              <input name="contribucion" value={filters.contribucion} onChange={handleFilterChange} placeholder="Filtrar por contribución..." className="w-full p-2 border rounded" />
              <input name="fecha" value={filters.fecha} onChange={handleFilterChange} placeholder="Filtrar por fecha (YYYY-MM-DD)..." className="w-full p-2 border rounded" />
              <input name="pagado" value={filters.pagado} onChange={handleFilterChange} placeholder="Filtrar por monto..." className="w-full p-2 border rounded" />
              <input name="realizado" value={filters.realizado} onChange={handleFilterChange} placeholder="Filtrar por estado (sí/no)..." className="w-full p-2 border rounded" />
            </div>
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setIsFilterModalOpen(false)}
                className="bg-blue-500 text-white font-bold py-2 px-4 rounded hover:bg-blue-700"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
  );
}
