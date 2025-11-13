'use client';

import { useMemo, useState } from 'react';
import { useI18n } from '@/app/i18n-provider';
import CatalogManagement from '@/app/menu/admin/projects_catalogs/CatalogManagement'; 
import EvidenceUploader from './EvidenceUploader';
import { formatDate, formatCurrency } from '@/utils/format'; // Assuming you have a formatDate utility

// Define the type for an Evidence item
type Evidencia = {
  id_evidencia: number;
  id_proyecto: number;
  descripcion_evidencia: string;
  fecha_evidencia: string; // DATE from DB (e.g., "YYYY-MM-DD")
  nombre_archivo: string;
  url_publica: string;
  tipo_mime: string | null;
  tipo_evidencia: string; // NUEVO CAMPO
  tamano_bytes: number | null;
  valor_de_referencia: number | null; // NUEVO CAMPO
  fecha_subida: string; // TIMESTAMP WITH TIME ZONE from DB (e.g., "ISO string")
};

// Dummy modal component for CatalogManagement.
// The actual upload UI will be separate and handled in Step 3.
const DummyEvidenceModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<Evidencia>) => void;
  item: Partial<Evidencia> | null;
}> = ({ isOpen }) => {
  if (!isOpen) return null;
  // This modal will not actually be used for adding/editing evidences.
  // It's a placeholder to satisfy CatalogManagement's prop requirements.
  return null;
};

type EvidenceManagementProps = {
  projectId: number | null;
};

export default function EvidenceManagement({ projectId }: EvidenceManagementProps) {
  const { t, locale, currency } = useI18n();
  const [refetchTrigger, setRefetchTrigger] = useState(0);

  const fetchRpcConfig = useMemo(() => ({
    name: 'fn_gestionar_proyecto_evidencias', // Nombre de la función RPC
    params: { p_accion: 'SELECT', p_id_proyecto: projectId } // Parámetros para la función
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [projectId, refetchTrigger]);

  // getSaveParams is a placeholder here. The actual INSERT will be handled
  // by the file upload logic in Step 3, not by a generic modal.
  // UPDATE is not typically supported for evidences (they are deleted and re-uploaded if changed).
  const getSaveParams = (item: Partial<Evidencia>, isEditing: boolean) => {
    return {
      p_accion: isEditing ? 'UPDATE' : 'INSERT', // UPDATE not really applicable for evidences
      p_id_evidencia: item.id_evidencia,
      p_id_proyecto: item.id_proyecto,
      p_descripcion_evidencia: item.descripcion_evidencia,
      p_fecha_evidencia: item.fecha_evidencia,
      p_nombre_archivo: item.nombre_archivo,
      p_url_publica: item.url_publica,
      p_tipo_mime: item.tipo_mime,
      p_tamano_bytes: item.tamano_bytes,
      p_tipo_evidencia: item.tipo_evidencia,
    };
  };

  const getDeleteParams = (item: Evidencia) => ({
    p_accion: 'DELETE',
    p_id_evidencia: item.id_evidencia,
  });

  if (!projectId) {
    return <p className="text-center text-gray-500 py-4">{t('projects.emptyState.noProjectSelected')}</p>;
  }

  return (
    <div className="space-y-4">
      <EvidenceUploader projectId={projectId!} onUploadSuccess={() => setRefetchTrigger(c => c + 1)} />
      <CatalogManagement<Evidencia, object>
        entityNameKey="projects.evidence.title"
        idKey="id_evidencia"
        colorPalette={['border-blue-400', 'border-green-400', 'border-purple-400', 'border-orange-400', 'border-red-400']}
        fetchRpc={fetchRpcConfig}
        saveRpcName="fn_gestionar_proyecto_evidencias" // Placeholder, actual save is via upload
        deleteRpcName="fn_gestionar_proyecto_evidencias"
        i18nKeys={{ add: 'projects.evidence.buttons.add', emptyState: 'projects.evidence.emptyState' }}
        ModalComponent={DummyEvidenceModal} // Using a dummy modal
        hideAddButton={true} // Ocultamos el botón de añadir genérico
        renderCardContent={(item) => (
          <>
            <h4 className="text-lg font-semibold">{item.descripcion_evidencia}</h4>
            <p className="text-sm text-muted-foreground">{item.nombre_archivo}</p>
            <p className="text-xs font-medium text-blue-600 uppercase mt-1">{t(`evidenceTypes.${item.tipo_evidencia}`)}</p>
            {/* Mostrar el valor de referencia si existe */}
            {item.valor_de_referencia != null && (
              <p className="text-lg font-bold text-green-600 mt-2">
                {formatCurrency(item.valor_de_referencia, locale, currency)}
              </p>
            )}
            <p className="text-xs text-gray-500 mt-1">{t('projects.evidence.fields.date')}: {formatDate(item.fecha_evidencia, locale)}</p>
            <a
              href={item.url_publica}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:underline text-sm mt-2 block"
            >
              {t('projects.evidence.buttons.viewFile')}
            </a>
          </>
        )}
        getSaveParams={getSaveParams}
        getDeleteParams={getDeleteParams}
        // onCardClick will not be used for evidences, as they are viewed via link
      />
    </div>
  );
}