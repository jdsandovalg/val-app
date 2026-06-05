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

/**
 * Convierte un número a su representación en letras (español - Guatemala).
 * @param amount El monto numérico.
 * @param currency El código de la moneda.
 * @returns El monto escrito en letras.
 */
export function numberToWordsGT(amount: number, currency: string): string {
  const UNIDADES = ['', 'UNO', 'DOS', 'TRES', 'CUATRO', 'CINCO', 'SEIS', 'SIETE', 'OCHO', 'NUEVE', 'DIEZ', 'ONCE', 'DOCE', 'TRECE', 'CATORCE', 'QUINCE', 'DIECISÉIS', 'DIECISIETE', 'DIECIOCHO', 'DIECINUEVE'];
  const DECENAS = ['', '', 'VEINTE', 'TREINTA', 'CUARENTA', 'CINCUENTA', 'SESENTA', 'SETENTA', 'OCHENTA', 'NOVENTA'];
  const CENTENAS = ['', 'CIENTO', 'DOSCIENTOS', 'TRESCIENTOS', 'CUATROCIENTOS', 'QUINIENTOS', 'SEISCIENTOS', 'SETECIENTOS', 'OCHOCIENTOS', 'NOVECIENTOS'];

  const getCurrencySymbol = (curr: string) => {
    const symbols: Record<string, { singular: string; plural: string }> = {
      'GTQ': { singular: 'QUETZAL', plural: 'QUETZALES' },
      'USD': { singular: 'DÓLAR', plural: 'DÓLARES' },
      'EUR': { singular: 'EURO', plural: 'EUROS' },
    };
    return symbols[curr] || { singular: 'UNIDADES', plural: 'UNIDADES' };
  };

  const convertThreeDigits = (n: number): string => {
    let result = '';
    const hundreds = Math.floor(n / 100);
    const remainder = n % 100;
    const tens = Math.floor(remainder / 10);
    const units = remainder % 10;

    if (hundreds > 0) {
      result += CENTENAS[hundreds];
      if (remainder > 0) result += ' ';
    }

    if (tens === 1 && units === 0) {
      result += 'DIEZ';
    } else if (tens === 1) {
      result += UNIDADES[10 + units];
    } else if (tens === 2 && units === 0) {
      result += 'VEINTE';
    } else if (tens === 2 && units > 0) {
      result += `VEINTI${UNIDADES[units].toLowerCase()}`;
    } else if (tens > 2) {
      result += DECENAS[tens];
      if (units > 0) result += ` Y ${UNIDADES[units]}`;
    } else {
      result += UNIDADES[units];
    }
    return result;
  };

  const integer = Math.floor(amount);
  const decimal = Math.round((amount - integer) * 100);

  if (integer === 0) return `CERO ${getCurrencySymbol(currency).plural}`;

  let words = '';
  const billions = Math.floor(integer / 1000000000);
  const millions = Math.floor((integer % 1000000000) / 1000000);
  const thousands = Math.floor((integer % 1000000) / 1000);
  const hundreds = integer % 1000;

  if (billions > 0) {
    words += `${convertThreeDigits(billions)} MIL `;
  }
  if (millions > 0) {
    if (millions === 1) {
      words += 'UN MILLÓN ';
    } else if (millions > 1) {
      words += `${convertThreeDigits(millions)} MILLONES `;
    }
  }
  if (thousands > 0) {
    words += `${convertThreeDigits(thousands)} MIL `;
  }
  if (hundreds > 0 || words === '') {
    words += convertThreeDigits(hundreds);
  }

  const { singular, plural } = getCurrencySymbol(currency);
  const currencyWord = integer === 1 ? singular : plural;

  words += ` ${currencyWord}`;

  if (decimal > 0) {
    const decimalTens = Math.floor(decimal / 10);
    const decimalUnits = decimal % 10;
    words += ` CON ${UNIDADES[decimalTens * 10 + decimalUnits]} CENTAVOS`;
  }

  return words.trim();
}
