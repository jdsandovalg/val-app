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
      console.error("Error al obtener datos de avisos:", e);
      router.push('/menu');
    } finally {
      setIsLoading(false);
    }
  }, [supabase, router]);

  useEffect(() => {
    fetchAvisoData();
  }, [fetchAvisoData]);

  const handleSavePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!proximoCompromiso || !usuario || !file || amount <= 0) {
      alert('Por favor, complete todos los campos.');
      return;
    }

    setIsSubmitting(true);

    const filePath = `${usuario.id}/${Date.now()}-${file.name}`;
    const { error: uploadError } = await supabase.storage.from('imagenespagos').upload(filePath, file);

    if (uploadError) {
      alert(`Error al subir el comprobante: ${uploadError.message}`);
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
      alert(`Error al registrar el pago: ${dbError.message}`);
    } else {
      alert('¡Pago registrado exitosamente!');
      router.push('/menu');
      router.refresh(); // Refresca los datos en el layout
    }
    setIsSubmitting(false);
  };

  if (isLoading) {
    return <div className="bg-white p-6 rounded-lg shadow">Cargando avisos...</div>;
  }

  if (!proximoCompromiso) {
    return (
      <div className="bg-white p-6 rounded-lg shadow">
        <h1 className="text-2xl font-bold text-gray-800 text-center">Avisos</h1>
        <p className="mt-4 text-gray-600">No tienes compromisos de pago pendientes. ¡Estás al día!</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow max-w-lg mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 text-center">Registrar Pago</h1>
      <p className="mt-2 text-gray-600">
        Estás a punto de registrar el pago para: <span className="font-semibold">{proximoCompromiso.descripcion}</span>
      </p>

      <form onSubmit={handleSavePayment} className="mt-6 space-y-4">
        <div>
          <label htmlFor="amount" className="block text-sm font-medium text-gray-700">Monto Pagado</label>
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
          <label htmlFor="file" className="block text-sm font-medium text-gray-700">Comprobante de Pago</label>
          <input
            type="file"
            id="file"
            onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)}
            className="mt-1 block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 focus:outline-none"
            required
          />
        </div>
        <button type="submit" disabled={isSubmitting} className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400">
          {isSubmitting ? 'Guardando...' : 'Guardar Pago'}
        </button>
      </form>
    </div>
  );
}