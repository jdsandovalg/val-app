import { NextResponse } from 'next/server';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  renderToStream,
} from '@react-pdf/renderer';
import React from 'react';
import PdfCalendarCard from '@/app/menu/calendarios/components/PdfCalendarCard';
import type { CalendarRecord } from '@/types/database';

// Importar las traducciones directamente
import es from '@/locales/es.json';
import en from '@/locales/en.json';
import fr from '@/locales/fr.json';

type TranslationValue = string | { [key: string]: TranslationValue };

const translations: { [key: string]: Record<string, TranslationValue> } = {
  es, en, fr,
};

// Registrar fuentes (si es necesario, asegúrate de que las rutas sean correctas)
// Font.register({
//   family: 'Helvetica',
//   fonts: [
//     { src: '/fonts/Helvetica.ttf' },
//     { src: '/fonts/Helvetica-Bold.ttf', fontWeight: 'bold' },
//   ],
// });

const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#F3F4F6', // gray-100
    padding: 20,
    fontFamily: 'Helvetica',
  },
  header: {
    marginBottom: 20,
    textAlign: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937', // gray-800
  },
  cardContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
});

// Componente del contenido PDF
const CalendarContent = ({
  data,
  t,
  locale,
}: { data: Array<CalendarRecord>; t: (key: string, params?: { [key: string]: string | number }) => string; locale: string;
}) => {
  const cards = data.map((record, index) =>
    React.createElement(PdfCalendarCard, { key: index, record, t, locale })
  );
  return React.createElement(Page, { size: "A4", style: styles.page },
    React.createElement(View, { style: styles.header },
      React.createElement(Text, { style: styles.title }, t('calendar.reportTitle'))),
    React.createElement(View, { style: styles.cardContainer }, ...cards));
};

export async function POST(request: Request) {
  try {
    const { reportData, locale, lang } = await request.json();

    // Función de traducción simple para el servidor
    const t = (key: string, params?: { [key: string]: string | number }): string => {
      const langKey = lang === 'Español' ? 'es' : lang === 'English' ? 'en' : 'fr';
      let result: TranslationValue | undefined = translations[langKey];
      for (const k of key.split('.')) {
        if (typeof result === 'object' && result !== null && k in result) {
          result = result[k];
        } else {
          return key; // Devuelve la clave si no se encuentra la traducción
        }
      }

      if (typeof result === 'string' && params) {
        return Object.entries(params).reduce((acc, [pKey, pValue]) => acc.replace(`{${pKey}}`, String(pValue)), result);
      }
      return typeof result === 'string' ? result : key;
    };

    const stream = await renderToStream(
      React.createElement(Document, null,
        React.createElement(CalendarContent, { data: reportData, t, locale })
      )
    );

    return new Response(stream as unknown as ReadableStream, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
      },
    });
  } catch (error) {
    console.error('Error generating PDF:', error);
    return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 });
  }
}
