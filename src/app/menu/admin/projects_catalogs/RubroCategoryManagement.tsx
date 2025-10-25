'use client';

import RubroCategoryModal from './RubroCategoryModal';
import CatalogManagement from './CatalogManagement';

type RubroCategoria = {
  id_categoria: number; // JS number can handle bigint
  nombre: string;
};

type RubroCategoryManagementProps = {
  onCardClick?: (item: RubroCategoria) => void;
}

export default function RubroCategoryManagement({ onCardClick }: RubroCategoryManagementProps) {
  return (
    <CatalogManagement<RubroCategoria, object>
      entityNameKey="catalog.rubro_categories"
      idKey="id_categoria"
      onCardClick={onCardClick}
      colorPalette={['border-purple-400', 'border-pink-500', 'border-orange-400', 'border-yellow-400']}
      fetchRpc={{
        name: 'fn_gestionar_rubro_categorias',
        params: {
          p_accion: 'SELECT',
          p_id_categoria: null,
          p_nombre: null,
        },
      }}
      saveRpcName="fn_gestionar_rubro_categorias"
      deleteRpcName="fn_gestionar_rubro_categorias"
      i18nKeys={{ add: 'catalog.buttons.addRubroCategory', emptyState: 'catalog.emptyState.noRubroCategories' }}
      ModalComponent={RubroCategoryModal}
      renderCardContent={(item) => (
        <h4 className="text-lg font-semibold">{item.nombre}</h4>
      )}
      getSaveParams={(item, isEditing) => ({
        p_accion: isEditing ? 'UPDATE' : 'INSERT',
        p_id_categoria: item.id_categoria,
        p_nombre: item.nombre,
      })}
    />
  );
}