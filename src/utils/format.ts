/**
 * Formatea una fecha en formato YYYY-MM-DD a un formato localizado (ej. DD/MM/YYYY).
 * @param dateString La fecha en formato 'YYYY-MM-DD'.
 * @param locale El código del locale (ej. 'es-GT', 'en-US').
 * @returns La fecha formateada según el locale.
 */
export function formatDate(dateInput: string | Date, locale: string): string {
  let date: Date;
  if (typeof dateInput === 'string') {
    // Añadimos 'T00:00:00' para asegurar que la fecha se interprete en la zona horaria local
    // y no se desplace un día por diferencias con UTC.
    date = new Date(`${dateInput}T00:00:00`);
  } else {
    date = dateInput;
  }
  return new Intl.DateTimeFormat(locale, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
}
/**
 * Formatea un número como una moneda localizada.
 * @param amount El monto numérico.
 * @param locale El código del locale.
 * @param currency El código de la moneda de 3 letras (ISO 4217).
 * @returns El monto formateado con el símbolo de moneda correcto para ese locale.
 */
export function formatCurrency(amount: number, locale: string, currency: string): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
  }).format(amount);
}
