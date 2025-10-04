import type { Usuario, ContribucionPorCasa } from '@/types/database';

export type ContribucionPorCasaExt = ContribucionPorCasa & {
    usuarios: Pick<Usuario, 'id' | 'responsable'> | null;
    contribuciones: {
      id_contribucion: string;
      descripcion: string | null;
      color_del_borde: string | null;
    } | null;
  };
export type SortableKeys = keyof Pick<ContribucionPorCasaExt, 'usuarios' | 'contribuciones' | 'fecha' | 'pagado' | 'realizado'>;
