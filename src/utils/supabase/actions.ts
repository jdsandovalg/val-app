import type { Database } from '@/types/database';
import { createClient } from './client';

interface ContributionPayment {
  id_contribucion: string;
  fecha: string;
}

interface UserInfo {
  id: number;
}

export async function saveContributionPayment(
  contribution: ContributionPayment,
  user: UserInfo,
  amount: number,
  file: File
): Promise<string> {
  // 1. Subir la imagen a Supabase Storage
  const supabase = createClient();
  const fileExt = file.name.split('.').pop();
  const fileName = `${user.id}-${contribution.id_contribucion}-${contribution.fecha}-${Date.now()}.${fileExt}`;
  const filePath = `${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('imagenespagos')
    .upload(filePath, file);

  if (uploadError) {
    throw new Error(`Error al subir el archivo: ${uploadError.message}`);
  }

  // 3. Actualizar el registro en la base de datos
  const { error: updateError } = await supabase.from('contribucionesporcasa').update({
    realizado: 'S',
    pagado: amount,
    fechapago: new Date().toISOString(),
    url_comprobante: filePath, // Guardar solo la ruta del archivo
  }).eq('id_casa', user.id).eq('id_contribucion', contribution.id_contribucion).eq('fecha', contribution.fecha);

  if (updateError) throw updateError;
  return filePath;
}