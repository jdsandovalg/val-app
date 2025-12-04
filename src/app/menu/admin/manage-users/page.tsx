'use client';

/**
 * @file /src/app/admin/manage-users/page.tsx
 * @fileoverview Página de administración para la gestión de usuarios (casas).
 * @description Esta pantalla permite a los administradores realizar operaciones CRUD (Crear, Leer, Actualizar, Eliminar)
 * sobre los usuarios del sistema. Proporciona una vista de tabla para escritorio y tarjetas para móvil,
 * con funcionalidades de filtrado y ordenamiento.
 *
 * @acceso_a_datos Utiliza el hook `useUsersData` para obtener todos los usuarios de la tabla `usuarios`.
 * El filtrado y la ordenación se realizan en el lado del cliente mediante `useMemo`.
 */
import { Fragment, useMemo, useState, useEffect, useCallback } from 'react';
import type { Usuario } from '@/types/database';
import UserModal, { type UserFormData } from './components/UserModal';
import UserCard from './components/UserCard';
import { createClient } from '@/utils/supabase/client';
import { useI18n } from '@/app/i18n-provider';
import { toast } from 'react-hot-toast';
import { Menu, Transition, Popover, Listbox } from '@headlessui/react';

type SortableKeys = keyof Usuario;

export default function ManageUsersPage() {
  const supabase = createClient();

  const [users, setUsers] = useState<Usuario[]>([]);
  const { t } = useI18n();
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [currentUserRole, setCurrentUserRole] = useState<string | undefined>(undefined);
  const [uiError, setUiError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<Partial<Usuario> | null>(null);

  const [sortConfig, setSortConfig] = useState<{ key: SortableKeys; direction: 'ascending' | 'descending' } | null>({
    key: 'id',
    direction: 'ascending',
  });

  const [filters, setFilters] = useState({
    id: '',
    responsable: '',
    tipo_usuario: '',
  });

  const userTypesForFilter = useMemo(() => [
    { id: '', name: t('manageUsers.filterModal.allTypes') },
    { id: 'ADM', name: t('manageUsers.filterModal.admin') },
    { id: 'OPE', name: t('manageUsers.filterModal.operativo') },
    { id: 'PRE', name: t('manageUsers.filterModal.owner') },
  ], [t]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    try {
      // Se llama a la función con los parámetros correctos. Para SELECT, solo se necesita p_action.
      const { data, error } = await supabase.rpc('manage_user_data', {
        p_accion: 'SELECT',
        p_id: null,
        p_responsable: null,
        p_clave: null,
        p_tipo_usuario: null,
        p_ubicacion: null,
        p_email: null,
        p_avatar_url: null
      });
      if (error) throw error;
      setUsers(data || []);
    } catch (err: unknown) {
      let message = 'Ocurrió un error desconocido.';
      if (err && typeof err === 'object' && 'details' in err && typeof err.details === 'string') {
        message = err.details;
      } else if (err instanceof Error) {
        message = err.message;
      } else if (typeof err === 'string') {
        message = err;
      }
      setFetchError(t('manageUsers.fetchError', { message }));
    } finally {
      setLoading(false);
    }
  }, [supabase, t]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Obtener el rol del usuario actual de la sesión de Supabase
  useEffect(() => {
    const fetchUserRoleFromStorage = () => {
      const storedUser = localStorage.getItem('usuario');
      if (storedUser) {
        const user: Usuario = JSON.parse(storedUser);
        console.log('DEBUG: Rol del usuario desde localStorage:', user.tipo_usuario);
        setCurrentUserRole(user.tipo_usuario ?? undefined);
      } else {
        console.log('DEBUG: No se pudo obtener el usuario desde localStorage.');
      }
    };
    fetchUserRoleFromStorage();
  }, []);

  const handleOpenModal = (user: Partial<Usuario> | null = null) => {
    setEditingUser(user);
    setIsModalOpen(true);
  };

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    // Retrasar el reseteo del usuario para evitar parpadeos en el modal al cerrar
    // El estado se limpiará la próxima vez que se abra con handleOpenModal.
    // setEditingUser(null); 
  }, []);

  const handleSave = useCallback(async (userData: UserFormData) => {
    setUiError(null);
    try {
      const action = editingUser ? 'UPDATE' : 'INSERT';
      const userId = userData.id;

      // Validación explícita para asegurar que los datos requeridos están presentes.
      if (!userId || !userData.responsable || (action === 'INSERT' && !userData.clave)) {
        throw new Error(t('manageUsers.alerts.validationError'));
      }

      // Unificamos la llamada a `manage_user_data` para ambas acciones.
      // El ID lo provee el usuario desde el formulario, incluso para nuevos usuarios.
      const { error: mainError } = await supabase.rpc('manage_user_data', {
        p_accion: action,
        p_id: Number(userId),
        p_responsable: userData.responsable,
        p_clave: userData.clave || null,
        p_tipo_usuario: userData.tipo_usuario || 'PRE',
        p_ubicacion: userData.ubicacion,
        p_email: userData.email || null,
        p_avatar_url: null, // El avatar se gestiona en un paso posterior.
      });

      if (mainError) throw mainError;

      // // La lógica para subir el avatar es la misma para crear y actualizar.
      // if (userData.avatarFile) {
      //   const avatarFile = userData.avatarFile as File;
      //   const fileExt = avatarFile.name.split('.').pop();
      //   const fileName = `${userId}-${Date.now()}.${fileExt}`;
      //   const filePath = `${fileName}`;

      //   const { error: uploadError } = await supabase.storage
      //     .from('avatars')
      //     .upload(filePath, avatarFile, { upsert: true });

      //   if (uploadError) throw uploadError;

      //   const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(filePath);
      //   const newAvatarUrl = urlData.publicUrl;

      //   // Se llama a la función específica para actualizar solo el avatar.
      //   const { error: avatarError } = await supabase.rpc('update_user_avatar', {
      //     p_id: Number(userId),
      //     p_avatar_url: newAvatarUrl,
      //   });

      //   if (avatarError) throw avatarError;
      // }

      await fetchData();
      toast.success(t('manageUsers.alerts.saveSuccess'));
    } catch (err: unknown) {
      let message = 'desconocido';
      if (err && typeof err === 'object' && 'details' in err && typeof err.details === 'string') {
        message = err.details;
      } else if (err instanceof Error) {
        message = err.message;
      } else if (typeof err === 'string') {
        message = err;
      }
      const errorMessage = t('manageUsers.alerts.saveError', { message });
      setUiError(errorMessage);
      toast.error(errorMessage, {
        duration: 6000,
      });
    } finally {
      handleCloseModal();
    }
  }, [supabase, editingUser, t, handleCloseModal, fetchData]);

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

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement> | { target: { name: string, value: string } }) => {
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
          <Popover className="relative">
            {({ open }) => (
              <>
                <Popover.Button
                  className={`p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 ${open ? 'bg-gray-200' : 'hover:bg-gray-200'}`}
                  aria-label={t('manageUsers.ariaLabels.openFilters')}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 md:w-6 md:h-6 text-gray-700">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 01-.659 1.591l-5.432 5.432a2.25 2.25 0 00-.659 1.591v2.927a2.25 2.25 0 01-1.244 2.013L9.75 21v-6.572a2.25 2.25 0 00-.659-1.591L3.659 7.409A2.25 2.25 0 013 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0112 3z" />
                  </svg>
                </Popover.Button>
                <Transition
                  as={Fragment}
                  enter="transition ease-out duration-200"
                  enterFrom="opacity-0 translate-y-1"
                  enterTo="opacity-100 translate-y-0"
                  leave="transition ease-in duration-150"
                  leaveFrom="opacity-100 translate-y-0"
                  leaveTo="opacity-0 translate-y-1"
                >
                  <Popover.Panel className="absolute right-0 z-10 mt-2 w-64 transform px-4 sm:px-0">
                    <div className="rounded-lg shadow-lg ring-1 ring-black ring-opacity-5">
                      <div className="relative bg-white p-4 space-y-4">
                        <div>
                          <label htmlFor="filter-id" className="block text-sm font-medium text-gray-700">{t('manageUsers.filterModal.houseLabel')}</label>
                          <input id="filter-id" name="id" value={filters.id} onChange={handleFilterChange} placeholder={t('manageUsers.filterModal.housePlaceholder')} className="mt-1 w-full p-2 border rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
                        </div>
                        <div>
                          <label htmlFor="filter-responsable" className="block text-sm font-medium text-gray-700">{t('manageUsers.filterModal.responsibleLabel')}</label>
                          <input id="filter-responsable" name="responsable" value={filters.responsable} onChange={handleFilterChange} placeholder={t('manageUsers.filterModal.responsiblePlaceholder')} className="mt-1 w-full p-2 border rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
                        </div>
                        <div>
                          <Listbox value={filters.tipo_usuario} onChange={(value) => handleFilterChange({ target: { name: 'tipo_usuario', value } })}>
                            <Listbox.Label className="block text-sm font-medium text-gray-700">{t('manageUsers.filterModal.userTypeLabel')}</Listbox.Label>
                            <div className="relative mt-1">
                              <Listbox.Button className="relative w-full cursor-default rounded-md border border-gray-300 bg-white py-2 pl-3 pr-10 text-left shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm">
                                <span className="block truncate">{(userTypesForFilter.find(type => type.id === filters.tipo_usuario) || userTypesForFilter[0]).name}</span>
                                <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-5 w-5 text-gray-400" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 15L12 18.75 15.75 15m-7.5-6L12 5.25 15.75 9" /></svg></span>
                              </Listbox.Button>
                              <Listbox.Options className="absolute z-40 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                                {userTypesForFilter.map((type) => (
                                  <Listbox.Option key={type.id} className={({ active }) => `relative cursor-default select-none py-2 pl-10 pr-4 ${active ? 'bg-indigo-100 text-indigo-900' : 'text-gray-900'}`} value={type.id}>
                                    {({ selected }) => <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>{type.name}</span>}
                                  </Listbox.Option>
                                ))}
                              </Listbox.Options>
                            </div>
                          </Listbox>
                        </div>
                      </div>
                    </div>
                  </Popover.Panel>
                </Transition>
              </>
            )}
          </Popover>

          <Menu as="div" className="relative">
            <Menu.Button className="p-2 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-400" aria-label={t('manageUsers.ariaLabels.openSortMenu')}>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 md:w-6 md:h-6 text-gray-700">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 7.5L7.5 3m0 0L12 7.5M7.5 3v13.5m13.5 0L16.5 21m0 0L12 16.5m4.5 4.5V7.5" />
              </svg>
            </Menu.Button>
            <Transition
              as={Fragment}
              enter="transition ease-out duration-100"
              enterFrom="transform opacity-0 scale-95"
              enterTo="transform opacity-100 scale-100"
              leave="transition ease-in duration-75"
              leaveFrom="transform opacity-100 scale-100"
              leaveTo="transform opacity-0 scale-95"
            >
              <Menu.Items className="absolute right-0 mt-2 w-56 origin-top-right divide-y divide-gray-100 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
                <div className="px-1 py-1">
                  <Menu.Item>
                    {({ active }) => (
                      <button onClick={() => handleSort('id')} className={`${active ? 'bg-indigo-500 text-white' : 'text-gray-900'} group flex w-full items-center rounded-md px-2 py-2 text-sm`}>{t('manageUsers.sortMenu.byHouse')}</button>
                    )}
                  </Menu.Item>
                  <Menu.Item>
                    {({ active }) => (
                      <button onClick={() => handleSort('responsable')} className={`${active ? 'bg-indigo-500 text-white' : 'text-gray-900'} group flex w-full items-center rounded-md px-2 py-2 text-sm`}>{t('manageUsers.sortMenu.byResponsible')}</button>
                    )}
                  </Menu.Item>
                  <Menu.Item>
                    {({ active }) => (
                      <button onClick={() => handleSort('tipo_usuario')} className={`${active ? 'bg-indigo-500 text-white' : 'text-gray-900'} group flex w-full items-center rounded-md px-2 py-2 text-sm`}>{t('manageUsers.sortMenu.byType')}</button>
                    )}
                  </Menu.Item>
                </div>
              </Menu.Items>
            </Transition>
          </Menu>

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
        currentUserRole={currentUserRole}
        user={editingUser}
      />
    </div>
  );
}