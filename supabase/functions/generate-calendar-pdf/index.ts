import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'
import { createClient } from '@supabase/supabase-js'
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'

console.log(`Edge Function "generate-calendar-pdf" is up and running!`);

serve(async (req) => {
  // Manejar la solicitud pre-vuelo (preflight) de CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { user_id } = await req.json();
    if (!user_id) {
      throw new Error("Se requiere el ID del usuario (user_id).");
    }

    // Crear un cliente de Supabase con privilegios de administrador para usar dentro de la función
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Obtener los datos de las contribuciones para el usuario
    // Se consultan las tablas base directamente, siguiendo los principios de arquitectura.
    const { data: contribuciones, error: dbError } = await supabaseAdmin
      .from('contribucionesporcasa')
      .select(`
        fecha,
        realizado,
        contribuciones (descripcion, color_del_borde)
      `)
      .eq('id_casa', user_id)
      .order('fecha', { ascending: true });

    if (dbError) throw dbError;

    // --- Lógica de Generación de PDF con pdf-lib ---
    const pdfDoc = await PDFDocument.create();
    let page = pdfDoc.addPage(); // Renombrado para evitar conflicto con la variable de bucle
    const { width, height } = page.getSize();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    const margin = 50;
    let y = height - margin;

    // Título del reporte
    page.drawText(`Reporte de Aportaciones - Casa #${user_id}`, {
      x: margin,
      y: y,
      font: fontBold,
      size: 24,
      color: rgb(0.1, 0.3, 0.4),
    });
    y -= 40;

    // Dibujar las tarjetas de contribuciones
    for (const contrib of contribuciones) {
      const cardHeight = 80;
      if (y < margin + cardHeight) {
        page = pdfDoc.addPage(); // Usar la variable renombrada
        y = height - margin;
      }

      // Color del borde (si existe)
      // Ajustar el acceso a los datos anidados
      const contribDetails = Array.isArray(contrib.contribuciones) ? contrib.contribuciones[0] : contrib.contribuciones;
      const borderColor = contribDetails?.color_del_borde ? hexToRgb(contribDetails.color_del_borde) : rgb(0.8, 0.8, 0.8);

      page.drawRectangle({
        x: margin,
        y: y - cardHeight,
        width: width - margin * 2,
        height: cardHeight,
        borderColor: borderColor,
        borderWidth: 2,
        borderRadius: 5,
        color: rgb(0.98, 0.98, 0.98),
      });

      // Contenido de la tarjeta
      const textX = margin + 15;
      const descripcion = contribDetails?.descripcion || 'Sin Descripción';

      page.drawText(descripcion, {
        x: textX,
        y: y - 25,
        font: fontBold,
        size: 14,
        color: rgb(0.2, 0.2, 0.2),
      });

      page.drawText(`Fecha Límite: ${contrib.fecha}`, {
        x: textX,
        y: y - 45,
        font: font,
        size: 11,
      });

      const estado = contrib.realizado === 'S' ? 'Realizado' : 'Pendiente';
      const estadoColor = contrib.realizado === 'S' ? rgb(0.1, 0.5, 0.1) : rgb(0.8, 0.2, 0.2);
      page.drawText(`Estado: ${estado}`, {
        x: textX,
        y: y - 60,
        font: fontBold,
        size: 11,
        color: estadoColor,
      });

      y -= cardHeight + 15; // Espacio entre tarjetas
    }

    const pdfBytes = await pdfDoc.save();

    return new Response(pdfBytes, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'inline; filename="reporte.pdf"',
      },
      status: 200,
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});

// Función de utilidad para convertir color HEX a RGB para pdf-lib
function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16) / 255,
        g: parseInt(result[2], 16) / 255,
        b: parseInt(result[3], 16) / 255,
      }
    : { r: 0.5, g: 0.5, b: 0.5 }; // Color gris por defecto si el formato es inválido
}
