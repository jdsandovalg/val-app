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
          id_contribucion: string
          descripcion: string | null
          monto_sugerido: number | null
        }
        Insert: {
          id_contribucion: string
          descripcion?: string | null
          monto_sugerido?: number | null
        }
        Update: {
          id_contribucion?: string
          descripcion?: string | null
          monto_sugerido?: number | null
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
          responsable: string
          tipo_usuario: string | null // 'ADM' or other
        }
        Insert: {
          id: number
          responsable: string
          tipo_usuario?: string | null
        }
        Update: {
          id?: number
          responsable?: string
          tipo_usuario?: string | null
        }
      }
    }
    Views: {
      // Define tus vistas aquí si las tienes
    }
    Functions: {
      // Define tus funciones aquí si las tienes
    }
  }
}

// Tipos extraídos para un uso más sencillo en la aplicación
export type Usuario = Database['public']['Tables']['usuarios']['Row'];
export type ContribucionPorCasa = Database['public']['Tables']['contribucionesporcasa']['Row'];

