'use client';

import { useState, useEffect, useCallback, type ReactNode } from 'react';
import { useI18n } from '@/app/i18n-provider';
import { createClient } from '@/utils/supabase/client';
import CatalogCard from './CatalogCard';
import { toast } from 'react-hot-toast';

type BaseItem = {
  [key: string]: unknown;
};

type CatalogManagementProps<T, TModalProps = object> = {
  // Nombre de la entidad para los mensajes de i18n
  entityNameKey: string;
  // Clave del ID para el mapeo (ej. 'id_grupo')
  idKey: keyof T;
  // Paleta de colores para las tarjetas
  colorPalette: string[];
  // Función RPC para obtener los datos
  fetchRpc: { name: string; params?: object };
  // Función RPC para guardar (INSERT/UPDATE)
  saveRpcName: string;
  // Función RPC para eliminar
  deleteRpcName: string;
  // Claves de i18n para los botones y estados
  i18nKeys: {
    add: string;
    emptyState: string;
  };
  // Componente del Modal para edición/creación
  ModalComponent: React.ComponentType<{ isOpen: boolean; onClose: () => void; onSave: (data: Partial<T>) => void | Promise<void>; item: Partial<T> | null; } & TModalProps>;
  // Props adicionales para el modal (ej. lista de grupos)
  additionalModalProps?: TModalProps;
  // Función que renderiza el contenido de una tarjeta
  renderCardContent: (item: T) => ReactNode;
  // Función para obtener los parámetros para la RPC de guardado
  getSaveParams: (item: Partial<T>, isEditing: boolean) => object;
  // Función para obtener los parámetros para la RPC de borrado (opcional)
  getDeleteParams?: (item: T) => object;
  // Handler opcional para el clic en la tarjeta
  onCardClick?: (item: T) => void;
};

export default function CatalogManagement<T extends BaseItem, TModalProps>({
  entityNameKey,
  idKey,
  colorPalette,
  fetchRpc,
  saveRpcName,
  deleteRpcName,
  i18nKeys,
  ModalComponent,
  additionalModalProps = {} as TModalProps,
  renderCardContent,
  getSaveParams,
  getDeleteParams,
  onCardClick,
}: CatalogManagementProps<T, TModalProps>) {
  const { t } = useI18n();
  const supabase = createClient();
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Partial<T> | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc(fetchRpc.name, fetchRpc.params || { p_action: 'SELECT' });
      if (error) throw error;
      setItems(data || []);
    } catch (error: unknown) {
      let errorMessage = t('calendar.payment.unknownError');
      if (typeof error === 'object' && error !== null && 'message' in error) {
        errorMessage = (error as { message: string }).message;
      }
      toast.error(t('catalog.alerts.fetchError', { entity: t(entityNameKey), message: errorMessage }));
    } finally {
      setLoading(false);
    }
  }, [supabase, t, fetchRpc, entityNameKey]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleOpenModal = (item: Partial<T> | null = null) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
  };

  const handleSave = async (itemData: Partial<T>) => {
    try {
      const isEditing = !!(editingItem && editingItem[idKey]);
      const params = getSaveParams(itemData, isEditing);
      const { error } = await supabase.rpc(saveRpcName, params);
      if (error) throw error;

      toast.success(t('catalog.alerts.saveSuccess'));
      fetchData();
      handleCloseModal();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      toast.error(t('catalog.alerts.saveError', { message }));
    }
  };

  const handleDelete = (item: T) => {
    toast(
      (toastInstance) => (
        <span>
          {t('catalog.alerts.deleteConfirm')}
          <div className="flex gap-2 mt-2">
            <button className="px-3 py-1 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700" onClick={async () => {
                toast.dismiss(toastInstance.id);
                try {
                  const deleteParams = getDeleteParams
                    ? getDeleteParams(item)
                    : { [`p_${String(idKey)}`]: item[idKey], p_action: 'DELETE' };

                  const { error } = await supabase.rpc(deleteRpcName, deleteParams);
                  if (error) throw error;
                  toast.success(t('catalog.alerts.deleteSuccess'));
                  fetchData();
                } catch (error: unknown) {
                  const message = error instanceof Error ? error.message : String(error);
                  toast.error(t('catalog.alerts.deleteError', { message }));
                }
              }}>{t('manageContributions.card.delete')}</button>
            <button className="px-3 py-1 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200" onClick={() => toast.dismiss(toastInstance.id)}>{t('userModal.cancelButton')}</button>
          </div>
        </span>
      ),
      { duration: 6000 }
    );
  };

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <button onClick={() => handleOpenModal(null)} className="px-4 py-2 text-sm font-medium text-white bg-gray-800 border border-transparent rounded-md hover:bg-gray-900">
          {t(i18nKeys.add)}
        </button>
      </div>
      {loading ? <p className="text-center text-gray-500">{t('loading')}</p> : items.length === 0 ? <p className="text-center text-gray-500">{t(i18nKeys.emptyState)}</p> : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {items.map((item, index) => (
            <CatalogCard
              key={item[idKey] as React.Key}
              colorClass={colorPalette[index % colorPalette.length]}
              onEdit={() => handleOpenModal(item)}
              onDelete={() => handleDelete(item)}
              onCardClick={onCardClick ? () => onCardClick(item) : undefined}>
              {renderCardContent(item)}
            </CatalogCard>
          ))}
        </div>
      )}
      {isModalOpen && <ModalComponent isOpen={isModalOpen} onClose={handleCloseModal} onSave={handleSave} item={editingItem} {...additionalModalProps} />}
    </div>
  );
}