'use client';

import { useState, useEffect, useCallback } from 'react';
import { useI18n } from '@/app/i18n-provider';
import { createClient } from '@/utils/supabase/client';
import TypeModal from './TypeModal';
import CatalogManagement from './CatalogManagement';
import { toast } from 'react-hot-toast';

type TipoProyecto = {
  id_tipo: number;
  nombre_tipo: string;
  id_grupo: number;
};

type GrupoMantenimiento = {
  id_grupo: number;
  nombre_grupo: string;
  orden: number;
};

export default function TypeManagement() {
  const { t } = useI18n();
  const supabase = createClient();
  const [groups, setGroups] = useState<GrupoMantenimiento[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchGroups = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('gestionar_grupo_mantenimiento', { p_action: 'SELECT' });
      if (error) throw error;
      setGroups(data || []);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      toast.error(t('catalog.alerts.fetchError', { entity: t('catalog.toggle_groups'), message }));
    } finally {
      setLoading(false);
    }
  }, [supabase, t]);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  return (
    loading ? <p className="text-center text-gray-500">{t('loading')}</p> :
    <CatalogManagement<TipoProyecto, { groups: GrupoMantenimiento[] }>
      entityNameKey="catalog.toggle_types"
      idKey="id_tipo"
      colorPalette={['border-sky-400', 'border-emerald-400', 'border-violet-400', 'border-fuchsia-400', 'border-amber-500', 'border-cyan-400']}
      fetchRpc={{ 
        name: 'gestionar_tipo_proyecto_catalogo',
        params: {
          p_action: 'SELECT',
          p_id_tipo: null,
        }
      }}
      saveRpcName="gestionar_tipo_proyecto_catalogo"
      deleteRpcName="gestionar_tipo_proyecto_catalogo"
      i18nKeys={{ add: 'catalog.buttons.addType', emptyState: 'catalog.emptyState.noTypes' }}
      ModalComponent={TypeModal}
      additionalModalProps={{ groups }}
      searchFunction={(item, term) => {
        const groupName = groups.find(g => g.id_grupo === item.id_grupo)?.nombre_grupo || '';
        return (
          item.nombre_tipo.toLowerCase().includes(term) ||
          groupName.toLowerCase().includes(term)
        );
      }}
      renderCardContent={(item) => (
        <>
          <h4 className="text-lg font-semibold">{item.nombre_tipo}</h4>
          <p className="text-sm text-muted-foreground">
            {t('catalog.fields.group')}: {groups.find((g) => g.id_grupo === item.id_grupo)?.nombre_grupo || t('catalog.fields.noGroup')}
          </p>
        </>
      )}
      getSaveParams={(item, isEditing) => ({
        p_action: isEditing ? 'UPDATE' : 'INSERT',
        p_id_tipo: item.id_tipo,
        p_nombre_tipo: item.nombre_tipo,
        p_id_grupo: item.id_grupo,
      })}
    />
  );
}