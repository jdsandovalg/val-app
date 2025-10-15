'use client';

import { useI18n } from '@/app/i18n-provider';
import SupplierModal from './SupplierModal';
import CatalogManagement from './CatalogManagement';

type Supplier = {
  nit: string;
  nombre: string;
  direccion: string;
};

export default function SupplierManagement() {
  const { t } = useI18n();

  return (
    <CatalogManagement<Supplier, object>
      entityNameKey="catalog.toggle_suppliers"
      idKey="nit"
      colorPalette={['border-red-400', 'border-orange-400', 'border-lime-400', 'border-cyan-400', 'border-rose-400']}
      fetchRpc={{ name: 'gestionar_nit' }}
      saveRpcName="gestionar_nit"
      deleteRpcName="gestionar_nit"
      i18nKeys={{ add: 'catalog.buttons.addSupplier', emptyState: 'catalog.emptyState.noSuppliers' }}
      ModalComponent={SupplierModal}
      renderCardContent={(item) => (
        <>
          <h4 className="text-lg font-semibold">{item.nombre}</h4>
          <p className="text-sm text-muted-foreground">
            {t('catalog.fields.nit')}: {item.nit}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            {t('catalog.fields.address')}: {item.direccion}
          </p>
        </>
      )}
      getSaveParams={(item, isEditing) => ({
        p_action: isEditing ? 'UPDATE' : 'INSERT',
        p_nit: item.nit,
        p_nombre: item.nombre,
        p_direccion: item.direccion,
      })}
    />
  );
}