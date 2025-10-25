'use client';

import { useMemo } from 'react';
import { useI18n } from '@/app/i18n-provider';
import RubroModal from './RubroModal';
import CatalogManagement from './CatalogManagement';

type Rubro = {
  id_rubro: number; // JS number can handle bigint
  nombre: string;
  descripcion: string | null;
  categoria: string | null; // Campo de texto heredado
  id_categoria: number | null; // JS number can handle bigint
  categoria_nombre: string | null;
};

type RubroCategoria = {
  id_categoria: number; // JS number can handle bigint
  nombre: string;
};

type RubroManagementProps = {
  categoryFilter: number | null;
  onClearFilter: () => void;
  categorias: RubroCategoria[];
};

export default function RubroManagement({ categoryFilter, onClearFilter, categorias }: RubroManagementProps) {
  const { t } = useI18n();
 
  const filterName = useMemo(() => categoryFilter ? categorias.find(c => c.id_categoria === categoryFilter)?.nombre : null, [categoryFilter, categorias]);

  return (
    <div>
      {filterName && (
        <div className="flex justify-between items-center bg-blue-50 border border-blue-200 text-blue-800 px-4 py-2 rounded-lg mb-4">
          <span className="font-medium">{t('catalog.filteringBy', { category: filterName })}</span>
          <button onClick={onClearFilter} className="text-sm font-semibold hover:underline">
            {t('catalog.buttons.clearFilter')}
          </button>
        </div>
      )}
      <CatalogManagement<Rubro, { categorias: RubroCategoria[] }>
        entityNameKey="catalog.rubros_catalog"
        idKey="id_rubro"
        colorPalette={['border-rose-400', 'border-amber-500', 'border-teal-400', 'border-indigo-400', 'border-lime-500']}
        fetchRpc={{ 
          name: 'fn_gestionar_rubros_catalogo',
          params: { p_accion: 'SELECT', p_id_categoria: categoryFilter }
        }}
        saveRpcName="fn_gestionar_rubros_catalogo"
        deleteRpcName="fn_gestionar_rubros_catalogo"
        i18nKeys={{ add: 'catalog.buttons.addRubro', emptyState: 'catalog.emptyState.noRubros' }}
        ModalComponent={RubroModal}
        additionalModalProps={{ categorias }}
        renderCardContent={(item) => (
          <>
            <h4 className="text-lg font-semibold">{item.nombre}</h4>
            <p className="text-sm text-muted-foreground">{item.descripcion}</p>
            <p className="text-xs text-gray-500 mt-1">{item.categoria_nombre || t('catalog.fields.noGroup')}</p>
          </>
        )}
        getSaveParams={(item, isEditing) => ({
          p_accion: isEditing ? 'UPDATE' : 'INSERT',
          p_id_rubro: item.id_rubro,
          p_nombre: item.nombre,
          p_descripcion: item.descripcion,
          p_categoria: null, // No se gestiona desde la UI, se pasa null
          p_id_categoria: item.id_categoria === 0 ? null : item.id_categoria,
        })}
      />
    </div>
  );
}
