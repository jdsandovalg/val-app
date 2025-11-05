'use client';

import { useState } from 'react';
import { useI18n } from '@/app/i18n-provider';
import { createClient } from '@/utils/supabase/client';
import { toast } from 'react-hot-toast';

type EvidenceUploaderProps = {
  projectId: number;
  onUploadSuccess: () => void;
};

export default function EvidenceUploader({ projectId, onUploadSuccess }: EvidenceUploaderProps) {
  const { t } = useI18n();
  const supabase = createClient();
  const [isUploading, setIsUploading] = useState(false);
  const [description, setDescription] = useState('');
  const [evidenceDate, setEvidenceDate] = useState(new Date().toISOString().split('T')[0]);
  const [evidenceType, setEvidenceType] = useState('COTIZACION'); // Valor por defecto
  const [file, setFile] = useState<File | null>(null);

  const evidenceTypes = [
    'COTIZACION',
    'FACTURA',
    'RECIBO',
    'TRANSFERENCIA',
    'RECOMENDACION',
    'FOTOGRAFIA_01',
    'FOTOGRAFIA_02',
    'FOTOGRAFIA_03'
  ];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!file || !description || !evidenceDate || !evidenceType) {
      toast.error(t('catalog.alerts.allFieldsRequired'));
      return;
    }

    setIsUploading(true);
    const toastId = toast.loading(t('manageContributions.uploading'));

    try {
      // 1. Subir el archivo a Supabase Storage
      const filePath = `${projectId}/${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('evidencias_imagenes')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // 2. Obtener la URL pública
      const { data: urlData } = supabase.storage
        .from('evidencias_imagenes')
        .getPublicUrl(filePath);

      // 3. Guardar los metadatos en la base de datos
      const { error: rpcError } = await supabase.rpc('fn_gestionar_proyecto_evidencias', {
        p_accion: 'INSERT',
        p_id_proyecto: projectId,
        p_descripcion_evidencia: description,
        p_fecha_evidencia: evidenceDate,
        p_nombre_archivo: file.name,
        p_tipo_evidencia: evidenceType, // Añadido el nuevo campo
        p_url_publica: urlData.publicUrl,
        p_tipo_mime: file.type,
        p_tamano_bytes: file.size,
      });

      if (rpcError) throw rpcError;

      toast.success(t('projects.evidence.alerts.uploadSuccess'), { id: toastId });
      // Limpiar formulario y notificar al padre para que refresque la lista
      setDescription('');
      setEvidenceDate(new Date().toISOString().split('T')[0]);
      setEvidenceType('COTIZACION');
      setFile(null);
      if (e.target instanceof HTMLFormElement) e.target.reset();
      onUploadSuccess();
    } catch (error: unknown) { // Cambiado de 'any' a 'unknown'
      // Manejo de errores más seguro con 'unknown'
      const message = error instanceof Error ? error.message : String(error);
      toast.error(t('projects.evidence.alerts.uploadError', { message }), { id: toastId });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 border-l-4 border-yellow-400 bg-yellow-50 rounded-lg shadow-sm mb-6">
      <div className="space-y-4">
        <div>
          <label htmlFor="evidenceType" className="block text-sm font-medium text-gray-700 mb-1">{t('projects.evidence.fields.type')}</label>
          <select id="evidenceType" value={evidenceType} onChange={(e) => setEvidenceType(e.target.value)} required className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 bg-white">
            {evidenceTypes.map(type => (
              <option key={type} value={type}>{t(`evidenceTypes.${type}`)}</option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">{t('projects.evidence.fields.description')}</label>
            <input id="description" value={description} onChange={(e) => setDescription(e.target.value)} required className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 bg-white" />
          </div>
          <div>
            <label htmlFor="evidenceDate" className="block text-sm font-medium text-gray-700 mb-1">{t('projects.evidence.fields.date')}</label>
            <input id="evidenceDate" type="date" value={evidenceDate} onChange={(e) => setEvidenceDate(e.target.value)} required className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 bg-white" />
          </div>
          <div>
            <label htmlFor="file-upload" className="block text-sm font-medium text-gray-700 mb-1">{t('paymentModal.proof')}</label>
            <div className="mt-1 flex items-center">
              <label htmlFor="file-upload-evidence" className="cursor-pointer bg-white text-gray-700 font-medium py-2 px-4 border border-gray-300 rounded-md text-sm hover:bg-gray-50 whitespace-nowrap">
                {t('paymentModal.selectFileButton')}
              </label>
              <input id="file-upload-evidence" type="file" className="hidden" onChange={handleFileChange} accept="image/*,application/pdf" required />
              <span className="ml-3 text-sm text-gray-500 truncate" title={file?.name}>{file ? file.name : t('paymentModal.noFileChosen')}</span>
            </div>
          </div>
        </div>
        <div className="flex justify-end">
          <button type="submit" disabled={isUploading} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed">
            {isUploading ? t('loading') : t('projects.evidence.buttons.add')}
          </button>
        </div>
      </div>
    </form>
  );
}