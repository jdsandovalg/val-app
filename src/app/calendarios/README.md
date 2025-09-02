# Val-App: Aplicación de Gestión de Condominio

Esta es una aplicación web construida con Next.js para la gestión de aportaciones y comunicación en un condominio.

## Issues Pendientes

Aquí se listan los problemas conocidos o funcionalidades pendientes de resolver.

### 1. Carga de Imágenes de Comprobantes
- **Descripción:** Al intentar ver un comprobante de pago subido, la imagen no se carga y muestra un error. La URL generada parece ser correcta y el archivo existe en el bucket de Supabase Storage, pero la conexión entre la URL y el archivo no se establece correctamente en el frontend.
- **Estado:** Pendiente de investigación.
- **Posibles causas:**
    - Problema con las políticas de seguridad (RLS) del bucket de Supabase.
    - Inconsistencia en la generación de la URL pública.
    - Problema de CORS o de red al intentar acceder al recurso.