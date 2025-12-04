import type {  ContribucionPorCasa } from '@/types/database';

export type ContribucionPorCasaExt = ContribucionPorCasa & {
  // Campos directos de la vista v_usuarios_contribuciones
  responsable: string;
  contribucion: string | null; // alias de c.nombre
  descripcion: string | null;
  dias_restantes: number | null;
  id_grupo: number | null;
  color_del_borde: string | null;
  ubicacion: string | null;
  fecha_maxima_pago: string | null;

  // Objetos anidados para compatibilidad con componentes existentes
  usuarios: {
    id: number;
    responsable: string;
  } | null;
  contribuciones: {
    id_contribucion: string;
    descripcion: string | null;
    color_del_borde: string | null;
  } | null;
};
export type SortableKeys = 'usuarios' | 'contribuciones' | 'fecha' | 'pagado' | 'realizado' | 'ubicacion';
