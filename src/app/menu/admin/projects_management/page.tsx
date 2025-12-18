'use client';

import { useState, useCallback, useEffect, Fragment } from 'react';
import { useI18n } from '@/app/i18n-provider';
import { createClient } from '@/utils/supabase/client';
import { toast } from 'react-hot-toast';

//import SupplierManagement from './SupplierManagement';
import RelationshipView from './RelationshipView';
import ProjectList from './ProjectList';
import ProjectModal from './ProjectModal';
import ProjectContributions from './ProjectContributions';
import ProjectExpenses from './ProjectExpenses';
import ProposalDetail from './components/ProposalDetail';
import FinancialDetail from './FinancialDetail';
import EvidenceManagement from './components/EvidenceManagement';
import RubroModal from '../projects_catalogs/RubroModal';
import FinancialReport from './FinancialReport';
import { Tab } from '@headlessui/react';

type ProjectStatus = 'abierto' | 'en_votacion' | 'aprobado' | 'rechazado' | 'en_progreso' | 'terminado' | 'cancelado';

type Proyecto = {
  id_proyecto: number;
  id_tipo_proyecto: number;
  descripcion_tarea: string;
  detalle_tarea: string | null;
  frecuencia_sugerida: string | null;
  notas_clave: string | null;
  valor_estimado: number | null;
  es_propuesta: boolean;
  activo: boolean;
  estado: ProjectStatus;
  fecha_inicial_proyecto?: string | null;
  fecha_final_proyecto?: string | null;
};

type RubroCatalogo = {
  id_rubro: number;
  nombre: string;
  descripcion: string | null;
  id_categoria: number | null;
};

type CategoriaRubro = {
  id_categoria: number;
  nombre: string; // Corregido de 'nombre_categoria' a 'nombre'
  descripcion: string | null;
};

export default function ProjectClassificationManagementPage() {
  const { t } = useI18n();
  const supabase = createClient();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTypeId, setSelectedTypeId] = useState<number | null>(null);
  const [selectedProject, setSelectedProject] = useState<Proyecto | null>(null);
  const [editingProject, setEditingProject] = useState<Proyecto | null>(null);
  const [rubrosCatalogo, setRubrosCatalogo] = useState<RubroCatalogo[]>([]);
  const [projects, setProjects] = useState<Proyecto[]>([]);
  const [rubroCategorias, setRubroCategorias] = useState<CategoriaRubro[]>([]);
  // --- INICIO: Estados para el modal de Rubros ---
  const [isRubroModalOpen, setIsRubroModalOpen] = useState(false);
  // --- FIN: Estados para el modal de Rubros ---
  
  const [selectedIndex, setSelectedIndex] = useState(0);

  const handleTabChange = (index: number) => {
    // Si se deselecciona un proyecto, siempre volver a la primera pestaña.
    if (!selectedProject) {
      setSelectedIndex(0);
    }
    setSelectedIndex(index);
  };

  const fetchProjects = useCallback(async () => {
    try {
      const { data, error } = await supabase.rpc('gestionar_proyectos', {
        p_action: 'SELECT',
        p_id_proyecto: null,
        p_id_tipo_proyecto: null,
        p_descripcion_tarea: null,
        p_detalle_tarea: null,
        p_frecuencia_sugerida: null,
        p_notas_clave: null,
        p_valor_estimado: null,
        p_estado: null,
        p_fecha_inicial_proyecto: null,
        p_fecha_final_proyecto: null,
      });
      if (error) throw error;
      setProjects(data || []);
    } catch (error) {
      toast.error(t('projects.alerts.fetchError', { message: (error as Error).message }));
      setProjects([]);
    }
  }, [supabase, t]);

  const fetchRubrosCatalogo = useCallback(async () => {
    try {
      const { data, error } = await supabase.rpc('fn_gestionar_rubros_catalogo', {
        p_accion: 'SELECT',
        p_id_rubro: null,
        p_nombre: null,
        p_descripcion: null,
        p_categoria: null,
        p_id_categoria: null
      });
      if (error) throw error;
      setRubrosCatalogo(data || []);
    } catch (error) {
      toast.error(t('catalog.alerts.fetchError', { entity: t('catalog.rubros_catalog'), message: (error as Error).message }));
    }
  }, [supabase, t]);

  const fetchRubroCategorias = useCallback(async () => {
    try {
      // CORRECCIÓN FINAL: Usar la función correcta que sí existe en la BD.
      const { data, error } = await supabase.rpc('fn_get_rubro_categorias');
      if (error) throw error;
      setRubroCategorias(data || []);
    } catch (error) {
      toast.error(t('catalog.alerts.fetchError', { entity: t('catalog.rubro_categories'), message: (error as Error).message }));
    }
  }, [supabase, t]);

  useEffect(() => {
    // Cargar el catálogo de rubros una sola vez al montar la página
    fetchProjects();
    fetchRubrosCatalogo();
    fetchRubroCategorias();
  }, [fetchProjects, fetchRubrosCatalogo, fetchRubroCategorias]);

  const handleOpenModal = useCallback((typeId: number) => {
    setSelectedTypeId(typeId);
    setIsModalOpen(true);
  }, []);

  const handleOpenEditModal = useCallback((project: Proyecto) => {
    setEditingProject(project);
    setSelectedTypeId(project.id_tipo_proyecto); // Aseguramos que el tipo de proyecto esté seleccionado
    setIsModalOpen(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setSelectedTypeId(null);
    setEditingProject(null); // Limpiamos el proyecto en edición al cerrar
  }, []);

  // --- INICIO: Lógica para el modal de Rubros ---
  const handleOpenRubroModal = useCallback(() => {
    setIsRubroModalOpen(true);
  }, []);

  const handleCloseRubroModal = useCallback(() => {
    setIsRubroModalOpen(false);
  }, []);

  const handleSaveRubro = useCallback(async (rubroData: Partial<RubroCatalogo>) => {
    try {
      const { error } = await supabase.rpc('fn_gestionar_rubros_catalogo', {
        p_accion: 'INSERT',
        p_nombre: rubroData.nombre,
        p_descripcion: rubroData.descripcion,
        p_id_categoria: rubroData.id_categoria,
      });
      if (error) throw error;
      toast.success(t('catalog.alerts.saveSuccess', { entity: t('catalog.rubros_catalog') }));
      fetchRubrosCatalogo(); // Recargar el catálogo
      handleCloseRubroModal();
    } catch (error) {
      toast.error(t('catalog.alerts.saveError', { entity: t('catalog.rubros_catalog'), message: (error as Error).message }));
    }
  }, [supabase, t, fetchRubrosCatalogo, handleCloseRubroModal]);
  // --- FIN: Lógica para el modal de Rubros ---

  const handleProjectSelect = useCallback((project: Proyecto | null) => {
    setSelectedProject(prevProject => {
      // Si se hace clic en el mismo proyecto o se pasa null, se deselecciona y se vuelve a la primera pestaña.
      if (!project || prevProject?.id_proyecto === project.id_proyecto) {
        setSelectedIndex(0);
        return null;
      }
      return project;
    });
  }, []);

  const handleSendToVote = useCallback(async (projectId: number) => {
    // Usamos una promesa con toast para una mejor UX
    const promise = (async () => {
      const { error } = await supabase.rpc('gestionar_proyectos', {
        p_action: 'UPDATE',
        p_id_proyecto: projectId,
        p_estado: 'en_votacion'
      });
      if (error) throw error;
    })();

    toast.promise(promise, {
      loading: t('projects.alerts.sendingToVote'),
      success: () => {
        // Forzamos un refresh para que la lista se actualice con el nuevo estado.
        // TODO: Reemplazar con actualización de estado local para una mejor UX.
        window.location.reload();
        return t('projects.alerts.sendToVoteSuccess');
      },
      error: (err: unknown) => {
        // Corregido para manejar el tipo 'unknown' de forma segura
        const errorMessage = (err && typeof err === 'object' && 'message' in err) ? String((err as { message: string }).message) : t('calendar.payment.unknownError');
        return t('projects.alerts.sendToVoteError', { message: errorMessage });
      }
    });
  }, [supabase, t]);

  const handleSaveProject = useCallback(async (projectData: Partial<Proyecto>) => {
    const isEditing = !!projectData.id_proyecto;

    try {
      let action: string;
      if (isEditing) {
        action = 'UPDATE';
      } else {
        // Determine action based on es_propuesta flag
        action = projectData.valor_estimado && projectData.valor_estimado > 0 ? 'INSERT' : 'INSERT_PROPOSAL';
      }

      const successMessageKey = isEditing ? 'catalog.alerts.saveSuccess' : (action === 'INSERT' ? 'projects.alerts.saveSuccess' : 'projects.alerts.proposalSaveSuccess');

      const { error } = await supabase.rpc('gestionar_proyectos', {
        p_action: action,
        p_id_proyecto: projectData.id_proyecto,
        p_id_tipo_proyecto: projectData.id_tipo_proyecto,
        p_descripcion_tarea: projectData.descripcion_tarea,
        p_detalle_tarea: projectData.detalle_tarea,
        p_frecuencia_sugerida: projectData.frecuencia_sugerida,
        p_notas_clave: projectData.notas_clave,
        p_valor_estimado: projectData.valor_estimado, // Always send, DB function will handle if it's a proposal
        p_estado: projectData.estado, // Enviamos el nuevo estado
        p_fecha_inicial_proyecto: projectData.fecha_inicial_proyecto || null,
        p_fecha_final_proyecto: projectData.fecha_final_proyecto || null,
        //p_es_propuesta: projectData.es_propuesta // NUEVO: Enviar el flag es_propuesta
      });

      if (error) throw error;

      toast.success(t(successMessageKey));
      handleCloseModal();
      // Refrescamos la lista de proyectos para mostrar los cambios
      fetchProjects();

    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error); // Mantener esto por ahora
      toast.error(t('projects.alerts.saveError', { message }));
    }
  }, [supabase, t, handleCloseModal, fetchProjects]);

  // Lógica para deshabilitar botones según el estado del proyecto
  const isContributionsDisabled = !selectedProject || ['en_votacion', 'rechazado', 'terminado', 'cancelado'].includes(selectedProject.estado);
  const isExpensesDisabled = !selectedProject || ['en_votacion', 'rechazado', 'terminado', 'cancelado'].includes(selectedProject.estado);
  // El resumen SÍ debe estar disponible para proyectos terminados o cancelados.
  const isSummaryDisabled = !selectedProject || ['abierto', 'en_votacion', 'rechazado'].includes(selectedProject.estado);

  const selectedProjectId = selectedProject?.id_proyecto ?? null;
  
  const tabs = [
    { name: t('projects.activeProjectsTitle'), view: 'projects', disabled: false },
    { 
      name: selectedProject?.estado === 'abierto' ? t('projects.evidenceAppendix.title') : t('projects.contributions.title'),
      view: selectedProject?.estado === 'abierto' ? 'evidence_management' : 'contributions',
      disabled: isContributionsDisabled 
    },
    { 
      name: selectedProject?.estado === 'abierto' ? t('projects.proposalDetail.title') : t('projects.expenses.title'),
      view: selectedProject?.estado === 'abierto' ? 'proposal_detail' : 'expenses',
      disabled: isExpensesDisabled
    },
    { name: t('projects.summary.title'), view: 'summary', disabled: isSummaryDisabled },
    { name: 'PDF', view: 'pdf_report', disabled: isSummaryDisabled, isComponent: true },
    { name: t('catalog.toggle_overview'), view: 'overview', disabled: false },
  ];

  return (
    <div>
      <div className="rounded-xl border bg-card text-card-foreground shadow">
        <div className="flex flex-col space-y-1.5 p-6">
          <h3 className="font-semibold leading-none tracking-tight">{t('projects.title')}</h3>
        </div>
        <Tab.Group selectedIndex={selectedIndex} onChange={handleTabChange}>
          <Tab.List className="flex justify-center flex-wrap gap-2 p-6 pt-0">
            {tabs.map((tab, index) => (
              tab.isComponent ? (
                <FinancialReport key={index} projectId={tab.disabled ? null : selectedProjectId} />
              ) : (
                <Tab as={Fragment} key={index} disabled={tab.disabled}>
                  {({ selected }) => (
                    <button
                      className={`inline-flex items-center justify-center whitespace-nowrap rounded-md px-4 py-2 text-xs sm:text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 ${
                        selected ? 'bg-gray-900 text-white shadow' : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {tab.name}
                    </button>
                  )}
                </Tab>
              )
            ))}
          </Tab.List>
          <Tab.Panels className="p-6 pt-0">
            <Tab.Panel>
              <ProjectList projects={projects} loading={false} onProjectSelect={handleProjectSelect} selectedProject={selectedProject} onEditProject={handleOpenEditModal} onSendToVote={handleSendToVote} />
            </Tab.Panel>
            <Tab.Panel>
              {selectedProject?.estado === 'abierto' ? <EvidenceManagement projectId={selectedProjectId} /> : <ProjectContributions projectId={selectedProjectId} />}
            </Tab.Panel>
            <Tab.Panel>
              {selectedProject?.estado === 'abierto' ? (selectedProject && <ProposalDetail project={selectedProject} rubrosCatalogo={rubrosCatalogo} onAddNewRubro={handleOpenRubroModal} />) : <ProjectExpenses projectId={selectedProjectId} />}
            </Tab.Panel>
            <Tab.Panel>
              <FinancialDetail projectId={selectedProjectId} />
            </Tab.Panel>
            <Tab.Panel>
              <RelationshipView onTypeClick={handleOpenModal} />
            </Tab.Panel>
            <Tab.Panel>
              {/* Panel vacío para el componente de reporte PDF, que no renderiza contenido aquí. */}
            </Tab.Panel>
          </Tab.Panels>
        </Tab.Group>
      </div>

      {isModalOpen && (
        <ProjectModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onSave={handleSaveProject}
          id_tipo_proyecto={selectedTypeId}
          projectToEdit={editingProject}
        />
      )}

      {isRubroModalOpen && (
        <RubroModal
          isOpen={isRubroModalOpen}
          onClose={handleCloseRubroModal}
          onSave={handleSaveRubro}
          item={null} // Pasamos null porque es para crear, no para editar
          categorias={rubroCategorias} // Pasamos el catálogo de categorías
        />
      )}
    </div>
  );
}