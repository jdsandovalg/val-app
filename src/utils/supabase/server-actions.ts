'use server';

import { createClient } from '@/utils/supabase/server';

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
  const supabase = createClient();

  // 1. Subir la imagen a Supabase Storage
  const fileExt = file.name.split('.').pop();
  const fileName = `${user.id}-${contribution.id_contribucion}-${contribution.fecha}-${Date.now()}.${fileExt}`;
  const filePath = `${fileName}`;

  const { error: uploadError } = await supabase.storage.from('imagenespagos').upload(filePath, file);

  if (uploadError) {
    throw new Error(`Error al subir el archivo: ${uploadError.message}`);
  }

  // 2. Actualizar el registro en la base de datos
  const { error: updateError } = await supabase.from('contribucionesporcasa').update({
    realizado: 'S',
    pagado: amount,
    fechapago: new Date().toISOString(),
    url_comprobante: filePath,
  }).eq('id_casa', user.id).eq('id_contribucion', contribution.id_contribucion).eq('fecha', contribution.fecha);

  if (updateError) throw updateError;
  return filePath;
}