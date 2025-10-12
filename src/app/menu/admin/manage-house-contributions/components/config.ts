/**
 * Moneda principal de la aplicación (código ISO 4217).
 * Se obtiene de una variable de entorno para que sea configurable por despliegue.
 */
export const APP_CURRENCY = process.env.NEXT_PUBLIC_APP_CURRENCY || 'GTQ';