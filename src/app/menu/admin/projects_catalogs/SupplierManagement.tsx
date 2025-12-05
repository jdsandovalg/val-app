'use client';

import SupplierModal from './SupplierModal';
import CatalogManagement from './CatalogManagement';

type Supplier = {
  nit: string;
  nombre: string;
  direccion: string;
};

export default function SupplierManagement() {
  return (
    <CatalogManagement<Supplier, object>
      entityNameKey="catalog.toggle_suppliers"
      idKey="nit"
      colorPalette={['border-orange-400', 'border-lime-500', 'border-cyan-400', 'border-fuchsia-400']}
      fetchRpc={{
        name: 'gestionar_nit',
        params: {
          p_action: 'SELECT',
          p_nit: null,
          p_nombre: null,
          p_direccion: null,
        },
      }}
      saveRpcName="gestionar_nit"
      deleteRpcName="gestionar_nit"
      i18nKeys={{ add: 'catalog.buttons.addSupplier', emptyState: 'catalog.emptyState.noSuppliers' }}
      ModalComponent={SupplierModal}
      renderCardContent={(item) => (
        <>
          <h4 className="text-lg font-semibold">{item.nombre}</h4>
          <p className="text-sm text-muted-foreground">{item.nit}</p>
          <p className="text-xs text-gray-500 mt-1">{item.direccion}</p>
        </>
      )}
      getSaveParams={(item, isEditing) => ({
        p_action: isEditing ? 'UPDATE' : 'INSERT',
        p_nit: item.nit,
        p_nombre: item.nombre,
        p_direccion: item.direccion,
      })}
      getDeleteParams={(item) => ({
        p_action: 'DELETE',
        p_nit: item.nit,
      })}
    />
  );
}