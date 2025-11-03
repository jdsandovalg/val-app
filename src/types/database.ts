// Este archivo define los tipos de datos basados en tu esquema de Supabase.
// Asegúrate de que coincida con tu base de datos. Si usas la generación de tipos de Supabase,
// puedes reemplazar este contenido con los tipos generados.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      contribuciones: {
        Row: {
          descripcion: string | null
          id_contribucion: number
          nombre: string | null
          color_del_borde: string | null
          dia_cargo: number | null
          periodicidad_dias: number | null
          tipo_cargo: "casa" | "grupo" | null
        }
        Insert: {
          id_contribucion?: number
          descripcion?: string | null
          nombre?: string | null
          color_del_borde?: string | null
          dia_cargo?: number | null
          periodicidad_dias?: number | null
          tipo_cargo?: "casa" | "grupo" | null
        }
        Update: {
          id_contribucion?: number
          descripcion?: string | null
          nombre?: string | null
          color_del_borde?: string | null
          dia_cargo?: number | null
          periodicidad_dias?: number | null
          tipo_cargo?: "casa" | "grupo" | null
        }
      }
      contribucionesporcasa: {
        Row: {
          id_casa: number
          id_contribucion: string
          fecha: string
          pagado: number | null
          realizado: string // 'S' or 'N'
          fechapago: string | null
          url_comprobante: string | null
        }
        Insert: {
          id_casa: number
          id_contribucion: string
          fecha: string
          pagado?: number | null
          realizado?: string
          fechapago?: string | null
          url_comprobante?: string | null
        }
        Update: {
          id_casa?: number
          id_contribucion?: string
          fecha?: string
          pagado?: number | null
          realizado?: string
          fechapago?: string | null
          url_comprobante?: string | null
        }
      }
      usuarios: {
        Row: {
          id: number
          created_at: string
          responsable: string
          clave: string
          tipo_usuario: string | null
          ubicacion: string | null
          email: string | null
          avatar_url: string | null
        }
        Insert: {
          id: number
          created_at?: string
          responsable: string
          clave: string
          tipo_usuario?: string | null
          ubicacion?: string | null
          email?: string | null
          avatar_url?: string | null
        }
        Update: {
          id?: number
          created_at?: string
          responsable?: string
          clave?: string
          tipo_usuario?: string | null
          ubicacion?: string | null
          email?: string | null
          avatar_url?: string | null
        }
      }
    }
    Views: {
      [key: string]: never
    }
    Functions: {
      [key: string]: never
    }
  }
}

// Definición de tipo más estricta para los roles de usuario
export type TipoUsuario = 'ADM' | 'PRE' | 'OPE';

// Tipos extraídos para un uso más sencillo en la aplicación
export type Usuario = Database['public']['Tables']['usuarios']['Row'];
export type ContribucionPorCasa = Database['public']['Tables']['contribucionesporcasa']['Row'];
export type Contribuciones = Database['public']['Tables']['contribuciones']['Row'];

// Tipo para los registros del calendario del usuario
export type CalendarRecord = {
  id_contribucion: string;
  descripcion: string;
  fecha_limite: string;
  pagado: boolean;
  status: string;
  statusKey: string
};