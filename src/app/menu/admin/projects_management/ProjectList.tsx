'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useI18n } from '@/app/i18n-provider';
import { toast } from 'react-hot-toast';
import { formatCurrency } from '@/utils/format';

type Proyecto = {
  id_proyecto: number;
  id_tipo_proyecto: number;
  descripcion_tarea: string;
  detalle_tarea: string | null;
  frecuencia_sugerida: string | null;
  notas_clave: string | null;
  valor_estimado: number | null;
  activo: boolean;
};

type ProjectListProps = {
  onProjectSelect: (projectId: number) => void;
  selectedProjectId: number | null;
};

export default function ProjectList({ onProjectSelect, selectedProjectId }: ProjectListProps) {
  const supabase = createClient();
  const { t, locale, currency } = useI18n();
  const [projects, setProjects] = useState<Proyecto[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('gestionar_proyectos', {
        p_action: 'SELECT',
        p_activo: true,
      });

      if (error) throw error;
      setProjects(data || []);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      toast.error(t('projects.alerts.fetchError', { message }));
    } finally {
      setLoading(false);
    }
  }, [supabase, t]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  if (loading) {
    return <p className="text-center text-gray-500 py-4">{t('loading')}</p>;
  }

  return (
    <div className="mb-8">
      <h3 className="text-xl font-semibold mb-4 text-gray-800">{t('projects.activeProjectsTitle')}</h3>
      {projects.length === 0 ? (
        <p className="text-center text-gray-500 py-4 bg-gray-100 rounded-lg">{t('projects.emptyState.noActiveProjects')}</p>
      ) : (
        <div className="space-y-3">
          {projects.map((project) => (
            <div
              key={project.id_proyecto}
              onClick={() => onProjectSelect(project.id_proyecto)}
              className={`p-4 rounded-lg border shadow-sm cursor-pointer transition-all ${
                selectedProjectId === project.id_proyecto ? 'bg-blue-50 border-blue-400 ring-2 ring-blue-300' : 'bg-white border-gray-200 hover:bg-gray-50'
              }`}
            >
              <div className="flex justify-between items-start">
                <h4 className="font-semibold text-gray-900 flex-1 pr-4">{project.descripcion_tarea}</h4>
                <span className="text-sm font-bold text-green-600">
                  {formatCurrency(project.valor_estimado || 0, locale, currency)}
                </span>
              </div>
              {project.notas_clave && (
                <p className="text-sm text-gray-600 mt-2">{project.notas_clave}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}