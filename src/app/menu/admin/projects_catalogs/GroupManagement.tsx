'use client';

import { useI18n } from '@/app/i18n-provider';
import GroupModal from './GroupModal';
import CatalogManagement from './CatalogManagement';

type GrupoMantenimiento = {
  id_grupo: number;
  nombre_grupo: string;
  orden: number;
};

export default function GroupManagement() {
  const { t } = useI18n();

  return (
    <CatalogManagement<GrupoMantenimiento, object>
      entityNameKey="catalog.toggle_groups"
      idKey="id_grupo"
      colorPalette={['border-blue-400', 'border-green-400', 'border-purple-400', 'border-pink-400', 'border-yellow-500', 'border-indigo-400', 'border-teal-400']}
      fetchRpc={{ name: 'gestionar_grupo_mantenimiento' }}
      saveRpcName="gestionar_grupo_mantenimiento"
      deleteRpcName="gestionar_grupo_mantenimiento"
      i18nKeys={{ add: 'catalog.buttons.addGroup', emptyState: 'catalog.emptyState.noGroups' }}
      ModalComponent={GroupModal}
      renderCardContent={(item) => (
        <>
          <h4 className="text-lg font-semibold">{item.nombre_grupo}</h4>
          <p className="text-sm text-muted-foreground">
            {t('catalog.fields.order')}: {item.orden}
          </p>
        </>
      )}
      getSaveParams={(item, isEditing) => ({
        p_action: isEditing ? 'UPDATE' : 'INSERT',
        p_id_grupo: item.id_grupo,
        p_nombre_grupo: item.nombre_grupo,
        p_orden: item.orden,
      })}
    />
  );
}