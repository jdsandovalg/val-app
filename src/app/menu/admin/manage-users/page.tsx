'use client';

/**
 * @file /src/app/admin/manage-users/page.tsx
 * @fileoverview Página de administración para la gestión de usuarios (casas).
 * @description Esta pantalla permite a los administradores realizar operaciones CRUD (Crear, Leer, Actualizar, Eliminar)
 * sobre los usuarios del sistema. Proporciona una vista de tabla para escritorio y tarjetas para móvil,
 * con funcionalidades de filtrado y ordenamiento.
 *
 * @accesible_desde Menú de "Admin" en el encabezado -> Opción "Usuarios".
 * @acceso_a_datos Utiliza el hook `useUsersData` para obtener todos los usuarios de la tabla `usuarios`.
 * El filtrado y la ordenación se realizan en el lado del cliente mediante `useMemo`.
 */import { useRef } from 'react';
import { useMemo, useState, useEffect, useCallback } from 'react';
import type { Usuario } from '@/types/database';
import UserModal from './components/UserModal';
import UserCard from './components/UserCard';
import { createClient } from '@/utils/supabase/client';
import { useI18n } from '@/app/i18n-provider';
import { toast } from 'react-hot-toast';

type SortableKeys = keyof Usuario;

export default function ManageUsersPage() {
  const supabase = createClient();

  const [users, setUsers] = useState<Usuario[]>([]);
  const { t } = useI18n();
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [uiError, setUiError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<Partial<Usuario> | null>(null);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [isSortMenuOpen, setIsSortMenuOpen] = useState(false);

  const [sortConfig, setSortConfig] = useState<{ key: SortableKeys; direction: 'ascending' | 'descending' } | null>({
    key: 'id',
    direction: 'ascending',
  });

  const [filters, setFilters] = useState({
    id: '',
    responsable: '',
    tipo_usuario: '',
  });

  const sortMenuRef = useRef<HTMLDivElement>(null);
  const actionsMenuRef = useRef<HTMLDivElement>(null); // Asumo que podría haber un menú de acciones aquí también

  const fetchData = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    try {
      // Se llama a la función con los parámetros correctos. Para SELECT, solo se necesita p_action.
      const { data, error } = await supabase.rpc('manage_user_data', {
        p_action: 'SELECT'
      });
      if (error) throw error;
      setUsers(data || []);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Ocurrió un error desconocido.';
      setFetchError(t('manageUsers.fetchError', { message }));
    } finally {
      setLoading(false);
    }
  }, [supabase, t]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (sortMenuRef.current && !sortMenuRef.current.contains(event.target as Node)) {
        setIsSortMenuOpen(false);
      }
      // Si hubiera otro menú, se añadiría aquí una lógica similar con actionsMenuRef
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [fetchData]);

  const handleOpenModal = (user: Partial<Usuario> | null = null) => {
    setEditingUser(user);
    setIsModalOpen(true);
  };

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setEditingUser(null);
  }, []);

  const handleSave = useCallback(async (userData: Partial<Usuario>) => {
    setUiError(null);
    try {
      if (!userData.id || !userData.responsable || !userData.clave) {
        throw new Error(t('manageUsers.alerts.validationError'));
      }

      // Se construye el objeto de parámetros para que coincida con la nueva firma de la función.
      const action = editingUser ? 'UPDATE' : 'INSERT';
      const params = {
        p_action: action,
        p_id: userData.id,
        p_responsable: userData.responsable,
        p_clave: userData.clave,
        p_tipo_usuario: userData.tipo_usuario || 'PRE' // Valor por defecto si no se proporciona
      };

      const { data: updatedUsers, error } = await supabase.rpc('manage_user_data', params);

      if (error) throw error;

      // Actualizar el estado con la lista de usuarios devuelta por la función.
      setUsers(updatedUsers || []);
      toast.success(t('manageUsers.alerts.saveSuccess'));
    } catch (err: unknown) {
      let message = 'desconocido';
      if (err && typeof err === 'object' && 'message' in err) {
        message = (err as { message: string }).message;
      }
      const errorMessage = t('manageUsers.alerts.saveError', { message });
      setUiError(errorMessage);
      toast.error(errorMessage, {
        duration: 6000, // Duración más larga para errores detallados
      });
    } finally {
      handleCloseModal();
      // Ya no es necesario llamar a fetchData() porque la RPC devuelve la lista actualizada.
    }
  }, [supabase, editingUser, t, handleCloseModal]);

  // La función 'manage_user_data' no tiene una acción 'DELETE', por lo que se elimina la funcionalidad.
  const handleDelete = useCallback(async () => {
    toast.error(t('manageUsers.alerts.deleteNotImplemented'));
  }, [t]);

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

  const filteredAndSortedUsers = useMemo(() => {
    let filteredItems = [...users];

    if (filters.id) {
      filteredItems = filteredItems.filter(user => String(user.id).includes(filters.id));
    }
    if (filters.responsable) {
      filteredItems = filteredItems.filter(user =>
        user.responsable.toLowerCase().includes(filters.responsable.toLowerCase())
      );
    }
    if (filters.tipo_usuario) {
      filteredItems = filteredItems.filter(user =>
        (user.tipo_usuario || '').toLowerCase().includes(filters.tipo_usuario.toLowerCase())
      );
    }

    if (sortConfig !== null) {
      filteredItems.sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];

        if (aValue === null || aValue === undefined) return 1;
        if (bValue === null || bValue === undefined) return -1;

        if (aValue < bValue) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    return filteredItems;
  }, [users, sortConfig, filters]);

  return (
    <div className="bg-gray-50 p-4 sm:p-8">
      <div className="flex justify-between items-center mb-6">
        

        <h1 className="text-1xl font-bold text-gray-800 text-center">{t('manageUsers.title')}</h1>

        <div className="relative flex items-center gap-2">
          <button
            onClick={() => setIsFilterModalOpen(true)}
            className="p-2 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-400"
            aria-label={t('manageUsers.ariaLabels.openFilters')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 md:w-6 md:h-6 text-gray-700">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 01-.659 1.591l-5.432 5.432a2.25 2.25 0 00-.659 1.591v2.927a2.25 2.25 0 01-1.244 2.013L9.75 21v-6.572a2.25 2.25 0 00-.659-1.591L3.659 7.409A2.25 2.25 0 013 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0112 3z" />
            </svg>
          </button>

          <div className="relative" ref={sortMenuRef}>
            <button
              onClick={() => setIsSortMenuOpen(prev => !prev)}
              className="p-2 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-400"
              aria-label={t('manageUsers.ariaLabels.openSortMenu')}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 md:w-6 md:h-6 text-gray-700">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 7.5L7.5 3m0 0L12 7.5M7.5 3v13.5m13.5 0L16.5 21m0 0L12 16.5m4.5 4.5V7.5" />
              </svg>
            </button>
            {isSortMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border border-gray-200">
                <div className="py-1">
                  <button onClick={() => { handleSort('id'); setIsSortMenuOpen(false); }} className="w-full text-left px-2 py-0.2 md:px-4 md:py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2 md:gap-3">{t('manageUsers.sortMenu.byHouse')}</button>
                  <button onClick={() => { handleSort('responsable'); setIsSortMenuOpen(false); }} className="w-full text-left px-2 py-0.2 md:px-4 md:py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2 md:gap-3">{t('manageUsers.sortMenu.byResponsible')}</button>
                  <button onClick={() => { handleSort('tipo_usuario'); setIsSortMenuOpen(false); }} className="w-full text-left px-2 py-0.2 md:px-4 md:py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2 md:gap-3">{t('manageUsers.sortMenu.byType')}</button>
                </div>
              </div>
            )}
          </div>

          <button
            onClick={() => handleOpenModal(null)}
            className="p-2 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-400"
            aria-label={t('manageUsers.ariaLabels.addUser')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-gray-700">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
          </button>
        </div>
      </div>

      {loading && <p className="text-center">{t('manageUsers.loading')}</p>}
      {fetchError && <p className="text-center text-red-500 bg-red-100 p-3 rounded">{t('manageUsers.loadError')} {fetchError}</p>}
      {uiError && <p className="text-center text-red-500 bg-red-100 p-3 rounded">{t('manageUsers.operationError')} {uiError}</p>}

      {!loading && !fetchError && users.length === 0 ? (
        <div className="text-center py-10 bg-white shadow-md rounded-lg">
          <p className="text-gray-500">{t('manageUsers.emptyState.noUsers')}</p>
          <p className="text-sm text-gray-400 mt-2">
            {t('manageUsers.emptyState.addUserHint')}
          </p>
        </div>
      ) : (
        <>
          {/* La vista de tabla ha sido eliminada para unificar la interfaz a "Mobile-Only" */}
          <div className="block">
            {filteredAndSortedUsers.map((user) => (
              <UserCard
                key={user.id}
                user={user}
                onDelete={handleDelete}
                onOpenModal={handleOpenModal}
              />
            ))}
          </div>

          {users.length > 0 && filteredAndSortedUsers.length === 0 && (
            <div className="text-center py-10 bg-white shadow-md rounded-lg mt-4">
              <p className="text-gray-500">{t('manageUsers.noResults')}</p>
            </div>
          )}
        </>
      )}

      <UserModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSave}
        user={editingUser}
      />

      {isFilterModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-sm">
            <h2 className="text-xl font-bold mb-4">{t('manageUsers.filterModal.title')}</h2>
            <div className="space-y-4">
              <input name="id" value={filters.id} onChange={handleFilterChange} placeholder={t('manageUsers.filterModal.housePlaceholder')} className="w-full p-2 border rounded" />
              <input name="responsable" value={filters.responsable} onChange={handleFilterChange} placeholder={t('manageUsers.filterModal.responsiblePlaceholder')} className="w-full p-2 border rounded" />
              <select name="tipo_usuario" value={filters.tipo_usuario} onChange={handleFilterChange} className="w-full p-2 border rounded">
                <option value="">{t('manageUsers.filterModal.allTypes')}</option>
                <option value="ADM">{t('manageUsers.filterModal.admin')}</option>
                <option value="PRE">{t('manageUsers.filterModal.owner')}</option>
              </select>
            </div>
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setIsFilterModalOpen(false)}
                className="bg-blue-500 text-white font-bold py-2 px-4 rounded hover:bg-blue-700"
              >
                {t('manageUsers.filterModal.close')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}