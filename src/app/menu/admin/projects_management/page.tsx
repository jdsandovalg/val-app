'use client';

import { useState, useCallback } from 'react';
import { useI18n } from '@/app/i18n-provider';
import { createClient } from '@/utils/supabase/client';
import { toast } from 'react-hot-toast';

import SupplierManagement from './SupplierManagement';
import RelationshipView from './RelationshipView';
import ProjectList from './ProjectList';
import ProjectModal from './ProjectModal';
import ProjectContributions from './ProjectContributions';
import ProjectExpenses from './ProjectExpenses';
import FinancialDetail from './FinancialDetail';
import FinancialReport from './FinancialReport';

type ProyectoPayload = {
  id_tipo_proyecto: number;
  descripcion_tarea: string;
  detalle_tarea?: string | null;
  frecuencia_sugerida?: string | null;
  notas_clave?: string | null;
  valor_estimado?: number | null;
};

export default function ProjectClassificationManagementPage() {
  const { t } = useI18n();
  const [activeView, setActiveView] = useState('projects'); // Cambiado a 'projects' como vista por defecto
  const supabase = createClient();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTypeId, setSelectedTypeId] = useState<number | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);

  const handleOpenModal = useCallback((typeId: number) => {
    setSelectedTypeId(typeId);
    setIsModalOpen(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setSelectedTypeId(null);
  }, []);

  const handleProjectSelect = useCallback((projectId: number) => {
    setSelectedProjectId(prevId => {
      // Si se hace clic en el mismo proyecto, se deselecciona.
      if (prevId === projectId) {
        // Si ya estamos en una vista de detalle, no cambiamos la vista, solo deseleccionamos.
        if (activeView !== 'contributions' && activeView !== 'expenses') {
          setActiveView('projects');
        }
        return null;
      }
      return projectId;
    });
  }, [activeView, setActiveView]);

  const handleSaveProject = useCallback(async (projectData: ProyectoPayload) => {
    try {
      const { error } = await supabase.rpc('gestionar_proyectos', {
        p_action: 'INSERT',
        p_id_tipo_proyecto: projectData.id_tipo_proyecto,
        p_descripcion_tarea: projectData.descripcion_tarea,
        p_detalle_tarea: projectData.detalle_tarea,
        p_frecuencia_sugerida: projectData.frecuencia_sugerida,
        p_notas_clave: projectData.notas_clave,
        p_valor_estimado: projectData.valor_estimado,
      });

      if (error) throw error;

      toast.success(t('projects.alerts.saveSuccess'));
      handleCloseModal();
      // Forzamos un refresh para que ProjectList y otros componentes se actualicen.
      // Una mejora futura podría ser actualizar el estado localmente.
      window.location.reload();

    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      toast.error(t('projects.alerts.saveError', { message }));
    }
  }, [supabase, t, handleCloseModal]);

  return (
    <div>
      <div className="rounded-xl border bg-card text-card-foreground shadow">
        <div className="flex flex-col space-y-1.5 p-6">
          <h3 className="font-semibold leading-none tracking-tight">{t('projects.title')}</h3>
        </div>
        <div className="p-6 pt-0">
          <div className="flex justify-center mb-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
              <button
                onClick={() => setActiveView('projects')}
                className={`inline-flex items-center justify-center whitespace-nowrap rounded-md px-4 py-2 text-xs sm:text-sm font-medium transition-colors ${
                  activeView === 'projects' ? 'bg-gray-900 text-white shadow' : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                {t('projects.activeProjectsTitle')}
              </button>
              <button
                onClick={() => setActiveView('contributions')}
                disabled={!selectedProjectId}
                className={`inline-flex items-center justify-center whitespace-nowrap rounded-md px-4 py-2 text-xs sm:text-sm font-medium transition-colors ${
                  activeView === 'contributions' ? 'bg-gray-900 text-white shadow' : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {t('projects.contributions.title')}
              </button>
              <button
                onClick={() => setActiveView('expenses')}
                disabled={!selectedProjectId}
                className={`inline-flex items-center justify-center whitespace-nowrap rounded-md px-4 py-2 text-xs sm:text-sm font-medium transition-colors ${
                  activeView === 'expenses' ? 'bg-gray-900 text-white shadow' : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {t('projects.expenses.title')}
              </button>
              <button
                onClick={() => setActiveView('summary')}
                disabled={!selectedProjectId}
                className={`inline-flex items-center justify-center whitespace-nowrap rounded-md px-4 py-2 text-xs sm:text-sm font-medium transition-colors ${
                  activeView === 'summary' ? 'bg-gray-900 text-white shadow' : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {t('projects.summary.title')}
              </button>
              <FinancialReport projectId={selectedProjectId} />
              <button
                onClick={() => setActiveView('overview')}
                className={`inline-flex items-center justify-center whitespace-nowrap rounded-md px-4 py-2 text-xs sm:text-sm font-medium transition-colors ${
                  activeView === 'overview' ? 'bg-gray-900 text-white shadow' : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                {t('catalog.toggle_overview')}
              </button>
            </div>
          </div>
          {activeView === 'projects' && <ProjectList onProjectSelect={handleProjectSelect} selectedProjectId={selectedProjectId} />}
          {activeView === 'suppliers' && <SupplierManagement />}
          {activeView === 'overview' && <RelationshipView onTypeClick={handleOpenModal} />}
          {activeView === 'contributions' && <ProjectContributions projectId={selectedProjectId} />}
          {activeView === 'expenses' && <ProjectExpenses projectId={selectedProjectId} />}
          {activeView === 'summary' && <FinancialDetail projectId={selectedProjectId} />}
        </div>
      </div>

      {isModalOpen && (
        <ProjectModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onSave={handleSaveProject}
          id_tipo_proyecto={selectedTypeId}
        />
      )}
    </div>
  );
}