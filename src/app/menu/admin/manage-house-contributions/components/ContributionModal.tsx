'use client';

import { useState, useEffect } from 'react';
import type { ContribucionPorCasaExt } from '@/types';
import { useI18n } from '@/app/i18n-provider';
import type { Usuario } from '@/types/database';
import { createClient } from '@/utils/supabase/client';
import { toast } from 'react-hot-toast';

interface ContributionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<ContribucionPorCasaExt>) => Promise<void>;
  record: Partial<ContribucionPorCasaExt> | null;
  usuarios: Pick<Usuario, 'id' | 'responsable'>[];
  contribuciones: { id_contribucion: string; descripcion: string | null }[];
}

const BUCKET_NAME = 'imagenespagos';

function ContributionModal({
  isOpen,
  onClose,
  onSave,
  record,
  usuarios,
  contribuciones,
}: ContributionModalProps) {
  const supabase = createClient();
  const { t } = useI18n();
  const [formData, setFormData] = useState<Partial<ContribucionPorCasaExt>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (record) {
      // Normalizar 'realizado' a 'S'/'N' ya que la vista puede devolver 'PAGADO'
      const isPaid = record.realizado === 'PAGADO' || record.realizado === 'S';
      setFormData({ ...record, realizado: isPaid ? 'S' : 'N' });
    } else {
      setFormData({
        fecha: new Date().toISOString().split('T')[0],
        fechapago: new Date().toISOString().split('T')[0],
        pagado: null,
        realizado: 'N',
      });
    }
    setFile(null); // Resetear archivo al abrir/cambiar registro
  }, [record]);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const isCheckbox = type === 'checkbox';

    if (isCheckbox && name === 'realizado') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({ ...prev, [name]: checked ? 'S' : 'N' }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: isCheckbox ? (e.target as HTMLInputElement).checked : value,
      }));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setUploading(true);

    let urlComprobante = formData.url_comprobante;

    try {
      // Si hay un archivo seleccionado, subirlo a Supabase Storage
      if (file) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
        const filePath = `pagos/${fileName}`; // Carpeta 'pagos' dentro del bucket

        const { error: uploadError } = await supabase.storage
          .from(BUCKET_NAME)
          .upload(filePath, file);

        if (uploadError) {
          throw new Error(`Error al subir imagen: ${uploadError.message}`);
        }

        const { data: publicUrlData } = supabase.storage
          .from(BUCKET_NAME)
          .getPublicUrl(filePath);

        urlComprobante = publicUrlData.publicUrl;
      }

      // Guardar datos incluyendo la URL (nueva o existente)
      await onSave({ ...formData, url_comprobante: urlComprobante });
      
    } catch (error: any) {
      console.error('Error en handleSubmit:', error);
      toast.error(error.message || 'Error al guardar');
    }
    setUploading(false);
    setIsSaving(false);
  };

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex justify-center items-center p-4">
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4">
          {record && record.id_casa ? t('contributionModal.titleEdit') : t('contributionModal.titleAdd')}
        </h2>
        <form onSubmit={handleSubmit}>
          {/* Select Casa */}
          <div className="mb-4">
            <label htmlFor="id_casa" className="block text-sm font-medium text-gray-700">{t('contributionModal.houseLabel')}</label>
            <select name="id_casa" id="id_casa" value={formData.id_casa || ''} onChange={handleChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm">
              <option value="" disabled>{t('contributionModal.housePlaceholder')}</option>
              {usuarios.map(u => <option key={u.id} value={u.id}>{t('groups.house')} #{u.id} - {u.responsable}</option>)}
            </select>
          </div>

          {/* Select Contribución */}
          <div className="mb-4">
            <label htmlFor="id_contribucion" className="block text-sm font-medium text-gray-700">{t('contributionModal.contributionTypeLabel')}</label>
            <select name="id_contribucion" id="id_contribucion" value={formData.id_contribucion || ''} onChange={handleChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm">
              <option value="" disabled>{t('contributionModal.contributionTypePlaceholder')}</option>
              {contribuciones.map((c) => (
                <option key={c.id_contribucion} value={c.id_contribucion}>{c.descripcion}</option>
              ))}
            </select>
          </div>

          <div className="mb-4">
            <label htmlFor="fecha" className="block text-sm font-medium text-gray-700">{t('contributionModal.dateLabel')}</label>
            <input 
              type="date" 
              name="fecha" 
              id="fecha" 
              value={formData.fecha || ''} 
              onChange={handleChange} 
              required 
              disabled={!!record}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed" 
            />
          </div>
          <div className="mb-4">
            <label htmlFor="fechapago" className="block text-sm font-medium text-gray-700">{t('contributionModal.paymentDateLabel', { defaultValue: 'Fecha de Pago' })}</label>
            <input type="date" name="fechapago" id="fechapago" value={formData.fechapago || ''} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
          </div>

          <div className="mb-4">
            <label htmlFor="pagado" className="block text-sm font-medium text-gray-700">{t('contributionModal.amountPaidLabel')}</label>
            <input type="number" name="pagado" id="pagado" value={formData.pagado ?? ''} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" placeholder={t('contributionModal.amountPaidPlaceholder')} step="0.01" />
          </div>

          {/* Input para Comprobante */}
          <div className="mb-4">
            <label htmlFor="comprobante" className="block text-sm font-medium text-gray-700">
              Comprobante de Pago (Imagen/PDF)
            </label>
            <input
              type="file"
              id="comprobante"
              accept="image/*,application/pdf"
              onChange={handleFileChange}
              className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
            />
            {formData.url_comprobante && !file && (
              <div className="mt-2 text-sm">
                <a href={formData.url_comprobante} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">
                  Ver comprobante actual
                </a>
              </div>
            )}
          </div>

          <div className="flex items-center mb-6">
            <div className="flex items-center">
              <input id="realizado" name="realizado" type="checkbox" checked={formData.realizado === 'S'} onChange={handleChange} className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
              <label htmlFor="realizado" className="ml-2 block text-sm text-gray-900">{t('contributionModal.statusLabel')}</label>
            </div>
          </div>

          {/* Acciones */}
          <div className="flex justify-end gap-4">
            <button type="button" onClick={onClose} className="bg-gray-200 text-gray-800 font-bold py-2 px-4 rounded hover:bg-gray-300">{t('contributionModal.cancelButton')}</button>
            <button type="submit" disabled={isSaving || uploading} className="bg-blue-500 text-white font-bold py-2 px-4 rounded hover:bg-blue-700 disabled:bg-gray-400">
              {uploading ? 'Subiendo...' : (isSaving ? t('contributionModal.savingButton') : t('contributionModal.saveButton'))}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ContributionModal;
