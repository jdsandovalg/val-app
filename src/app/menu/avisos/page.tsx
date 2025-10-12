'use client';

/**
 * @file /src/app/menu/avisos/page.tsx
 * @fileoverview Página de avisos y registro de pagos.
 * @description Esta pantalla muestra al usuario su próximo compromiso de pago pendiente. Si existe uno,
 * presenta un formulario para registrar el pago, incluyendo el monto y un comprobante en imagen.
 * Si el usuario está al día, muestra un mensaje de felicitación.
 *
 * @accesible_desde Menú inferior -> Ícono de "Avisos" (campana).
 * @acceso_a_datos Realiza una consulta a la vista `v_usuarios_contribuciones` para obtener el registro más próximo con `realizado = 'N'`.
 */
import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/utils/supabase/client';
import type { Usuario } from '@/types/database';
import { useI18n } from '@/app/i18n-provider';
import { formatDate } from '@/utils/format';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';

type ProximoCompromiso = {
  id_contribucion: string;
  descripcion: string;
  fecha: string;
  dias_restantes: number;
};

export default function AvisosPage() {
  const supabase = createClient();
  const router = useRouter();
  const { t, lang } = useI18n();
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [proximoCompromiso, setProximoCompromiso] = useState<ProximoCompromiso | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [amount, setAmount] = useState(0);
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchAvisoData = useCallback(async () => {
    const storedUser = localStorage.getItem('usuario');
    if (!storedUser) {
      router.push('/');
      return;
    }

    try {
      const user: Usuario = JSON.parse(storedUser);
      setUsuario(user);

      const { data, error } = await supabase.rpc('get_proximo_compromiso', {
        p_user_id: user.id,
      });

      if (error) throw error;

      if (data && data.length > 0) {
        setProximoCompromiso(data[0]);
      }
    } catch (e) {
      toast.error(`${t('notices.alerts.dbError', { message: e instanceof Error ? e.message : '' })}`);
      router.push('/menu');
    } finally {
      setIsLoading(false);
    }
  }, [supabase, router, t]);

  useEffect(() => {
    fetchAvisoData();
  }, [fetchAvisoData]);

  const handleSavePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!proximoCompromiso || !usuario || !file || amount <= 0) {
      toast.error(t('notices.alerts.fillAllFields'));
      return;
    }

    setIsSubmitting(true);

    const filePath = `${usuario.id}/${Date.now()}-${file.name}`;
    const { error: uploadError } = await supabase.storage.from('imagenespagos').upload(filePath, file);

    if (uploadError) {
      toast.error(t('notices.alerts.uploadError', { message: uploadError.message }));
      setIsSubmitting(false);
      return;
    }

    const { error: dbError } = await supabase
      .from('contribucionesporcasa')
      .update({
        pagado: amount,
        realizado: 'S',
        fechapago: new Date().toISOString(),
        url_comprobante: filePath,
      })
      .eq('id_casa', usuario.id)
      .eq('id_contribucion', proximoCompromiso.id_contribucion)
      .eq('fecha', proximoCompromiso.fecha);

    if (dbError) {
      toast.error(t('notices.alerts.dbError', { message: dbError.message }));
    } else {
      toast.success(t('notices.alerts.success'));
      router.push('/menu');
      router.refresh(); // Refresca los datos en el layout
    }
    setIsSubmitting(false);
  };

  if (isLoading) {
    return <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-gray-300">{t('notices.loading')}</div>;
  }

  if (!proximoCompromiso) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-green-500">
        <h1 className="text-2xl font-bold text-gray-800 text-center">{t('notices.title')}</h1>
        <p className="mt-4 text-gray-600">{t('notices.noPending')}</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md max-w-lg mx-auto border-l-4 border-yellow-500">
      <h1 className="text-2xl font-bold text-gray-800 text-center">{t('notices.registerPaymentTitle')}</h1>
      <p className="mt-2 text-gray-600">
        {t('notices.aboutToPay')} <span className="font-semibold">{proximoCompromiso.descripcion}</span> ({formatDate(proximoCompromiso.fecha, lang)})
      </p>

      <form onSubmit={handleSavePayment} className="mt-6 space-y-4">
        <div>
          <label htmlFor="amount" className="block text-sm font-medium text-gray-700">{t('notices.form.amount')}</label>
          <input
            type="number"
            id="amount"
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">{t('notices.form.proof')}</label>
          <div className="mt-1 flex items-center">
            <label htmlFor="file-upload" className="cursor-pointer bg-blue-500 text-white font-bold py-2 px-4 rounded-md text-sm hover:bg-blue-600 whitespace-nowrap">
              {t('paymentModal.selectFileButton')}
            </label>
            <input 
              id="file-upload"
              name="file-upload"
              type="file" 
              className="hidden"
              onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)} 
              accept="image/*" 
              required />
            <span className="ml-3 text-sm text-gray-500 truncate" title={file?.name}>{file ? file.name : t('paymentModal.noFileChosen')}</span>
          </div>
        </div>
        <button type="submit" disabled={isSubmitting} className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400">
          {isSubmitting ? t('notices.form.submitting') : t('notices.form.submit')}
        </button>
      </form>
    </div>
  );
}