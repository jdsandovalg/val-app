'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { createClient } from '@/utils/supabase/client';
import type { Usuario, ContribucionPorCasa } from '@/types/database';
import { useRouter } from 'next/navigation';

// Tipo extendido para incluir los datos de las tablas relacionadas
type ContribucionPorCasaExt = ContribucionPorCasa & {
  usuarios: Pick<Usuario, 'id' | 'responsable'> | null;
  contribuciones: {
    id_contribucion: string;
    descripcion: string | null;
  } | null;
};

type SortableKeys = keyof Pick<ContribucionPorCasaExt, 'usuarios' | 'contribuciones' | 'fecha' | 'pagado' | 'realizado'>;

// --- Componente Modal para Añadir/Editar ---
function ContributionModal({
  isOpen,
  onClose,
  onSave,
  record,
  usuarios,
  contribuciones,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<ContribucionPorCasaExt>) => Promise<void>;
  record: Partial<ContribucionPorCasaExt> | null;
  usuarios: Pick<Usuario, 'id' | 'responsable'>[];
  contribuciones: { id_contribucion: string; descripcion: string | null }[];
}) {
  const [formData, setFormData] = useState<Partial<ContribucionPorCasaExt>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setFormData(
      record || {
        fecha: new Date().toISOString().split('T')[0],
        pagado: null,
        realizado: 'N', // Usar 'N' como valor por defecto para consistencia
      }
    );
  }, [record]);

  if (!isOpen) return null;

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    const isCheckbox = type === 'checkbox';

    if (isCheckbox && name === 'realizado') {
      // Manejo específico para el checkbox 'realizado' para que guarde 'S' o 'N'
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked ? 'S' : 'N' }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: isCheckbox ? (e.target as HTMLInputElement).checked : value,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await onSave(formData);
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4">
          {record && record.id_casa ? 'Editar' : 'Agregar'} Aportación
        </h2>
        <form onSubmit={handleSubmit}>
          {/* Select Casa */}
          <div className="mb-4">
            <label htmlFor="casa_id" className="block text-sm font-medium text-gray-700">Casa</label>
            <select name="id_casa" id="id_casa" value={formData.id_casa || ''} onChange={handleChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm">
              <option value="" disabled>Seleccione una casa</option>
              {usuarios.map(u => <option key={u.id} value={u.id}>Casa #{u.id} - {u.responsable}</option>)}
            </select>
          </div>

          {/* Select Contribución */}
          <div className="mb-4">
            <label htmlFor="id_contribucion" className="block text-sm font-medium text-gray-700">Tipo de Contribución</label>
            <select name="id_contribucion" id="id_contribucion" value={formData.id_contribucion || ''} onChange={handleChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm">
              <option value="" disabled>Seleccione una contribución</option>
              {contribuciones.map((c) => (
                <option key={c.id_contribucion} value={c.id_contribucion}>{c.descripcion}</option>
              ))}
            </select>
          </div>

          <div className="mb-4">
            <label htmlFor="fecha" className="block text-sm font-medium text-gray-700">Fecha</label>
            <input type="date" name="fecha" id="fecha" value={formData.fecha || ''} onChange={handleChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
          </div>

          <div className="mb-4">
            <label htmlFor="pagado" className="block text-sm font-medium text-gray-700">Monto Pagado</label>
            <input type="number" name="pagado" id="pagado" value={formData.pagado ?? ''} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" placeholder="0.00" step="0.01" />
          </div>
          <div className="flex items-center mb-6">
            <div className="flex items-center">
              <input id="realizado" name="realizado" type="checkbox" checked={formData.realizado === 'S'} onChange={handleChange} className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
              <label htmlFor="realizado" className="ml-2 block text-sm text-gray-900">Realizado</label>
            </div>
          </div>

          {/* Acciones */}
          <div className="flex justify-end gap-4">
            <button type="button" onClick={onClose} className="bg-gray-200 text-gray-800 font-bold py-2 px-4 rounded hover:bg-gray-300">Cancelar</button>
            <button type="submit" disabled={loading} className="bg-blue-500 text-white font-bold py-2 px-4 rounded hover:bg-blue-700 disabled:bg-gray-400">
              {loading ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


// --- Componente Principal de la Página ---
export default function ManageHouseContributionsPage() {
  const supabase = createClient();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [records, setRecords] = useState<ContribucionPorCasaExt[]>([]);
  const [usuarios, setUsuarios] = useState<Pick<Usuario, 'id' | 'responsable'>[]>([]);
  const [contribuciones, setContribuciones] = useState<
    { id_contribucion: string; descripcion: string | null }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<Partial<ContribucionPorCasaExt> | null>(null);
  const [isUploadingCsv, setIsUploadingCsv] = useState(false);
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
    setError(null);
    try {
      // 1. Se obtienen los datos de cada tabla por separado para mayor robustez.
      //    Esto evita depender de la inferencia automática de joins de Supabase,
      //    que puede fallar si las claves foráneas no están configuradas como se espera.
      const [recordsRes, usuariosRes, contribucionesRes] = await Promise.all([
        supabase.from('contribucionesporcasa').select('*').order('fecha', { ascending: false }),
        supabase.from('usuarios').select('id, responsable'),
        supabase.from('contribuciones').select('id_contribucion, descripcion'),
      ]);

      if (recordsRes.error) throw recordsRes.error;
      if (usuariosRes.error) throw usuariosRes.error;
      if (contribucionesRes.error) throw contribucionesRes.error;

      const recordsData = recordsRes.data || [];
      const usuariosData = usuariosRes.data || [];
      const contribucionesData = contribucionesRes.data || [];

      // 2. Se combinan los datos manualmente en el frontend.
      const usuariosMap = new Map(usuariosData.map(u => [u.id, u]));
      const contribucionesMap = new Map(contribucionesData.map(c => [c.id_contribucion, c]));

      const combinedRecords = recordsData.map(record => ({
        ...record,
        usuarios: usuariosMap.get(record.id_casa) || null,
        contribuciones: contribucionesMap.get(record.id_contribucion) || null,
      }));

      setRecords(combinedRecords);
      setUsuarios(usuariosData);
      setContribuciones(contribucionesData);
    } catch (err: unknown) {
      console.error('Error en fetchData:', err);
      if (err instanceof Error) {
        setError(`Error al cargar datos: ${err.message}`);
      } else {
        setError('Ocurrió un error desconocido al cargar los datos.');
      }
    } finally {
      setLoading(false);
    }
  }, [supabase]); // supabase client es estable y no causará re-renders.

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleOpenModal = (record: Partial<ContribucionPorCasaExt> | null = null) => {
    setEditingRecord(record);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingRecord(null);
  };

  const handleSave = async (recordData: Partial<ContribucionPorCasaExt>) => {
    setError(null);
    try {
      const { usuarios: _u, contribuciones: _c, ...dataToSave } = recordData;

      const finalData = {
        ...dataToSave,
        pagado: dataToSave.pagado != null && String(dataToSave.pagado).trim() !== '' ? parseFloat(String(dataToSave.pagado)) : null,
        id_casa: dataToSave.id_casa ? parseInt(String(dataToSave.id_casa), 10) : null,
        id_contribucion: dataToSave.id_contribucion ? String(dataToSave.id_contribucion) : null,
      };

      let rpcError: { message: string } | null = null;

      // Si editingRecord existe, es una ACTUALIZACIÓN. Usamos la llave primaria original para la cláusula WHERE.
      if (editingRecord && editingRecord.id_casa && editingRecord.id_contribucion && editingRecord.fecha) {
        const { error } = await supabase
          .from('contribucionesporcasa')
          .update(finalData)
          .eq('id_casa', editingRecord.id_casa)
          .eq('id_contribucion', editingRecord.id_contribucion)
          .eq('fecha', editingRecord.fecha)
        rpcError = error;
      } else {
        // De lo contrario, es una INSERCIÓN.
        const { error } = await supabase.from('contribucionesporcasa').insert(finalData);
        rpcError = error;
      }

      if (rpcError) throw rpcError;

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
      const { error } = await supabase
        .from('contribucionesporcasa')
        .delete()
        .eq('id_casa', recordToDelete.id_casa)
        .eq('id_contribucion', recordToDelete.id_contribucion)
        .eq('fecha', recordToDelete.fecha);

      if (error) {
        const errorMessage = `Error al eliminar: ${error.message}`;
        setError(errorMessage);
        alert(errorMessage);
      } else {
        fetchData(); // Recargar datos
      }
    }
  };

  const handleRegresar = () => {
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
        (record.contribuciones?.descripcion ?? `ID: ${record.id_contribucion}`)
          .toLowerCase()
          .includes(filters.contribucion.toLowerCase())
      );
    }
    if (filters.fecha) {
      filteredItems = filteredItems.filter(record =>
        record.fecha?.includes(filters.fecha)
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
      sortableItems.sort((a: ContribucionPorCasaExt, b: ContribucionPorCasaExt) => {
        let aValue: string | number | null | undefined | boolean;
        let bValue: string | number | null | undefined | boolean;

        switch (sortConfig.key) {
          case 'usuarios':
            aValue = a.usuarios?.responsable?.toLowerCase();
            bValue = b.usuarios?.responsable?.toLowerCase();
            break;
          case 'contribuciones':
            aValue = a.contribuciones?.descripcion?.toLowerCase();
            bValue = b.contribuciones?.descripcion?.toLowerCase();
            break;
          case 'pagado':
            aValue = a.pagado ?? -Infinity; // Treat null as the smallest value
            bValue = b.pagado ?? -Infinity;
            break;
          default:
            aValue = a[sortConfig.key as 'fecha' | 'realizado'];
            bValue = b[sortConfig.key as 'fecha' | 'realizado'];
        }

        const valA = aValue ?? '';
        const valB = bValue ?? '';

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

    setIsUploadingCsv(true);
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
    <div className="min-h-screen bg-gray-50 p-4 sm:p-8">
      <div className="mb-4">
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

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Gestionar Aportaciones por Casa</h1>
        <div className="flex items-center gap-4">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            className="hidden"
            accept=".csv"
          />
          <button
            onClick={handleGeneratePDF}
            className="bg-red-500 text-white font-bold py-2 px-4 rounded hover:bg-red-700 flex items-center shadow-sm"
            disabled={loading || isUploadingCsv}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
            Reporte PDF
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="bg-purple-500 text-white font-bold py-2 px-4 rounded hover:bg-purple-700 flex items-center shadow-sm"
            disabled={loading || isUploadingCsv}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
            </svg>
            {isUploadingCsv ? 'Procesando...' : 'Cargar CSV'}
          </button>
          <button
            onClick={() => handleOpenModal(null)}
            className="bg-green-500 text-white font-bold py-2 px-4 rounded hover:bg-green-700 flex items-center shadow-sm"
            disabled={isUploadingCsv}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Agregar Nuevo
          </button>
        </div>
      </div>

      {loading && <p>Cargando datos de la tabla...</p>}
      {isUploadingCsv && <p className="text-purple-600">Procesando archivo CSV, por favor espere...</p>}
      {error && <p className="text-red-500 bg-red-100 p-3 rounded">Error: {error}</p>}

      {!loading && !error && records.length === 0 ? (
        <div className="text-center py-10 bg-white shadow-md rounded-lg">
          <p className="text-gray-500">No hay aportaciones para mostrar.</p>
          <p className="text-sm text-gray-400 mt-2">
            Puedes agregar una nueva aportación usando el botón &quot;+ Agregar Nuevo&quot;.
          </p>
        </div>
      ) : (
        <>
          <div className="bg-white shadow-md rounded-lg overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <button onClick={() => handleSort('usuarios')} className="flex items-center gap-1">
                      Casa
                      {sortConfig?.key === 'usuarios' && (sortConfig.direction === 'ascending' ? '▲' : '▼')}
                    </button>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <button onClick={() => handleSort('contribuciones')} className="flex items-center gap-1">
                      Contribución
                      {sortConfig?.key === 'contribuciones' && (sortConfig.direction === 'ascending' ? '▲' : '▼')}
                    </button>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <button onClick={() => handleSort('fecha')} className="flex items-center gap-1">
                      Fecha
                      {sortConfig?.key === 'fecha' && (sortConfig.direction === 'ascending' ? '▲' : '▼')}
                    </button>
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <button onClick={() => handleSort('pagado')} className="flex items-center gap-1 w-full justify-end">
                      Monto Pagado
                      {sortConfig?.key === 'pagado' && (sortConfig.direction === 'ascending' ? '▲' : '▼')}
                    </button>
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <button onClick={() => handleSort('realizado')} className="flex items-center gap-1 w-full justify-center">
                      Realizado
                      {sortConfig?.key === 'realizado' && (sortConfig.direction === 'ascending' ? '▲' : '▼')}
                    </button>
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                </tr>
                {/* Fila de Filtros */}
                <tr>
                  <th className="px-4 py-2"><input name="casa" onChange={handleFilterChange} placeholder="Filtrar casa..." className="text-xs p-1 border rounded w-full font-normal" /></th>
                  <th className="px-4 py-2"><input name="contribucion" onChange={handleFilterChange} placeholder="Filtrar contribución..." className="text-xs p-1 border rounded w-full font-normal" /></th>
                  <th className="px-4 py-2"><input name="fecha" onChange={handleFilterChange} placeholder="Filtrar fecha..." className="text-xs p-1 border rounded w-full font-normal" /></th>
                  <th className="px-4 py-2"><input name="pagado" onChange={handleFilterChange} placeholder="Filtrar monto..." className="text-xs p-1 border rounded w-full font-normal" /></th>
                  <th className="px-4 py-2"><input name="realizado" onChange={handleFilterChange} placeholder="Filtrar estado..." className="text-xs p-1 border rounded w-full font-normal" /></th>
                  <th className="px-4 py-2"></th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredAndSortedRecords.map((record) => (
                  <tr key={`${record.id_casa}-${record.id_contribucion}-${record.fecha}`}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {record.usuarios
                        ? `Casa #${record.usuarios.id} - ${record.usuarios.responsable}`
                        : `Casa ID: ${record.id_casa} (No encontrado)`}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {record.contribuciones?.descripcion ?? `ID: ${record.id_contribucion} (No encontrada)`}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{record.fecha}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                      {record.pagado != null
                        ? `$${Number(record.pagado).toFixed(2)}`
                        : 'No pagado'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center">{record.realizado === 'S' ? '✅' : '❌'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button onClick={() => handleOpenModal(record)} className="text-indigo-600 hover:text-indigo-900 mr-4">Editar</button>
                      <button onClick={() => handleDelete(record)} className="text-red-600 hover:text-red-900">Eliminar</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
    </div>
  );
}
