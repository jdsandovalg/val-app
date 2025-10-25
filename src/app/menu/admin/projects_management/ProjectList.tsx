'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useI18n } from '@/app/i18n-provider';
import { toast } from 'react-hot-toast';

type ProjectStatus = 'abierto' | 'en_votacion' | 'aprobado' | 'rechazado' | 'en_progreso' | 'terminado' | 'cancelado';

type Proyecto = {
  id_proyecto: number;
  id_tipo_proyecto: number;
  descripcion_tarea: string;
  detalle_tarea: string | null;
  frecuencia_sugerida: string | null;
  notas_clave: string | null;
  valor_estimado: number | null;
  activo: boolean;
  estado: ProjectStatus;
};

type ProjectListProps = {
  onProjectSelect: (project: Proyecto | null) => void;
  selectedProject: Proyecto | null;
};

export default function ProjectList({ onProjectSelect, selectedProject }: ProjectListProps) {
  const supabase = createClient();
  const { t } = useI18n();
  const [projects, setProjects] = useState<Proyecto[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('gestionar_proyectos', {
        p_action: 'SELECT',
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

  const statusStyles: Record<ProjectStatus, { badge: string; border: string }> = {
    abierto: { badge: 'bg-yellow-100 text-yellow-800', border: 'border-yellow-400' },
    en_votacion: { badge: 'bg-purple-100 text-purple-800', border: 'border-purple-400' },
    aprobado: { badge: 'bg-teal-100 text-teal-800', border: 'border-teal-400' },
    en_progreso: { badge: 'bg-blue-100 text-blue-800', border: 'border-blue-400' },
    terminado: { badge: 'bg-green-100 text-green-800', border: 'border-green-400' },
    rechazado: { badge: 'bg-pink-100 text-pink-800', border: 'border-pink-400' },
    cancelado: { badge: 'bg-red-100 text-red-800', border: 'border-red-400' },
  };

  const handleSelect = (project: Proyecto) => {
    if (selectedProject?.id_proyecto === project.id_proyecto) {
      onProjectSelect(null); // Deseleccionar si se hace clic en el mismo
    } else {
      onProjectSelect(project);
    }
  };

  return (
    <div className="mb-8">
      <h3 className="text-xl font-semibold mb-4 text-gray-800">{t('projects.activeProjectsTitle')}</h3>
      {projects.length === 0 ? (
        <p className="text-center text-gray-500 py-4 bg-gray-100 rounded-lg">{t('projects.emptyState.noActiveProjects')}</p>
      ) : (
        <div className="space-y-3">
          {projects.map(project => {
            const isSelected = selectedProject?.id_proyecto === project.id_proyecto;
            return (
              <div
                key={project.id_proyecto}
                onClick={() => handleSelect(project)}
                className={`p-4 rounded-lg border-l-4 shadow-sm cursor-pointer transition-all ${
                  isSelected
                    ? `bg-blue-50 ${statusStyles[project.estado]?.border || 'border-gray-400'} ring-2 ring-blue-300`
                    : `bg-white ${statusStyles[project.estado]?.border || 'border-gray-400'} hover:bg-gray-50`
                }`}
              >
                <div className="flex justify-between items-start">
                  <h4 className="font-semibold text-gray-900 flex-1 pr-4">{project.descripcion_tarea}</h4>
                  <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${statusStyles[project.estado]?.badge || 'bg-gray-200 text-gray-800'}`}>
                    {t(`projectStatus.${project.estado}`)}
                  </span>
                </div>
                {project.notas_clave && <p className="text-sm text-gray-600 mt-2">{project.notas_clave}</p>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}