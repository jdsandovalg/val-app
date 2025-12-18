'use client';

import { useState, useEffect, useCallback, Fragment } from 'react';
import { createClient } from '@/utils/supabase/client';
import type { Usuario } from '@/types/database';
import { useI18n } from '@/app/i18n-provider';
import { toast } from 'react-hot-toast';
import { FilePenLine, Gavel } from 'lucide-react';
import { Disclosure, Transition } from '@headlessui/react';

type ProjectStatus = 'abierto' | 'en_votacion' | 'aprobado' | 'rechazado' | 'en_progreso' | 'terminado' | 'cancelado';

type Proyecto = {
  id_proyecto: number;
  id_tipo_proyecto: number;
  descripcion_tarea: string;
  detalle_tarea: string | null;
  frecuencia_sugerida: string | null;
  notas_clave: string | null;
  valor_estimado: number | null;
  es_propuesta: boolean; // Campo que indica si es una propuesta (true) o heredado (false)
  activo: boolean;
  estado: ProjectStatus;
  fecha_inicial_proyecto?: string | null;
  fecha_final_proyecto?: string | null;
};

type ProjectListProps = {
  projects: Proyecto[]; // NUEVO: Recibe los proyectos como prop
  loading: boolean; // NUEVO: Recibe el estado de carga
  onProjectSelect: (project: Proyecto | null) => void;
  selectedProject: Proyecto | null;
  onEditProject: (project: Proyecto) => void;
  onSendToVote: (projectId: number) => void; // Nueva prop para la acción de votar
};

export default function ProjectList({ projects, loading, onProjectSelect, selectedProject, onEditProject, onSendToVote }: ProjectListProps) {
  const { t } = useI18n();
  const [userProfile, setUserProfile] = useState<string | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('usuario');
    if (storedUser) {
      try {
        const user: Usuario = JSON.parse(storedUser);
        setUserProfile(user.tipo_usuario);
      } catch (e) {
        console.error("Error parsing user data from localStorage", e);
      }
    }
  }, []);

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

  const activeProjects = projects.filter(p => !['terminado', 'cancelado'].includes(p.estado));
  const archivedProjects = projects.filter(p => ['terminado', 'cancelado'].includes(p.estado));

  const handleSelect = (project: Proyecto) => {
    if (selectedProject?.id_proyecto === project.id_proyecto) {
      onProjectSelect(null);
    } else {
      onProjectSelect(project);
    }
  };

  return (
    <div className="mb-8">
      <h3 className="text-xl font-semibold mb-4 text-gray-800">{t('projects.activeProjectsTitle')}</h3>
      {activeProjects.length === 0 ? (
        <p className="text-center text-gray-500 py-4 bg-gray-100 rounded-lg">{t('projects.emptyState.noActiveProjects')}</p>
      ) : (
        <div className="space-y-3">
          {activeProjects.map(project => {
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
                  <div className="flex items-center gap-2">
                    {(project.valor_estimado === null || project.valor_estimado === 0) ? (
                      <span className="text-xs font-semibold text-blue-800 bg-blue-100 border-l-4 border-blue-500 px-2 py-1 rounded-r-md hidden sm:inline">
                        {t('projects.modals.tabs.newProject')}
                      </span>
                    ) : (
                      <span className="text-xs font-semibold text-yellow-800 bg-yellow-100 border-l-4 border-yellow-500 px-2 py-1 rounded-r-md hidden sm:inline">
                        {t('projects.modals.tabs.projectWithCosts')}
                      </span>
                    )}
                    <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${statusStyles[project.estado]?.badge || 'bg-gray-200 text-gray-800'}`}>
                      {t(`projectStatus.${project.estado}`)}
                    </span>
                    {/* Botón para Enviar a Votación */}
                    {userProfile === 'ADM' && project.estado === 'abierto' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSendToVote(project.id_proyecto);
                        }}
                        disabled={!project.es_propuesta}
                        className="p-1 rounded-full hover:bg-blue-100 disabled:hover:bg-transparent disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        title={project.es_propuesta ? t('projects.tooltips.sendToVote') : t('projects.tooltips.addQuotesToVote')}
                      >
                        <Gavel size={16} className="text-blue-600" />
                      </button>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditProject(project);
                      }}
                      className="p-1 rounded-full hover:bg-gray-200 transition-colors"
                      title={t('manageUsers.card.edit')}
                    >
                      <FilePenLine size={16} className="text-gray-600" />
                    </button>
                  </div>
                </div>
                {project.detalle_tarea && <p className="text-sm text-gray-600 mt-2">{project.detalle_tarea}</p>}
              </div>
            );
          })}
        </div>
      )}

      {archivedProjects.length > 0 && (
        <Disclosure as="div" className="mt-8">
          {({ open }) => (
            <>
              <Disclosure.Button className="w-full text-left text-lg font-semibold mb-4 text-gray-600 flex justify-between items-center p-2 rounded-md hover:bg-gray-100">
                Proyectos Archivados ({archivedProjects.length})
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-6 h-6 transition-transform ${open ? 'rotate-180' : ''}`}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                </svg>
              </Disclosure.Button>
              <Transition
                as={Fragment}
                enter="transition ease-out duration-200"
                enterFrom="opacity-0 -translate-y-1"
                enterTo="opacity-100 translate-y-0"
                leave="transition ease-in duration-150"
                leaveFrom="opacity-100 translate-y-0"
                leaveTo="opacity-0 -translate-y-1"
              >
                <Disclosure.Panel className="space-y-3">
                  {archivedProjects.map(project => {
                    const isSelected = selectedProject?.id_proyecto === project.id_proyecto;
                    return (
                      <div
                        key={project.id_proyecto}
                        onClick={() => handleSelect(project)}
                        className={`p-4 rounded-lg border-l-4 shadow-sm cursor-pointer transition-all opacity-80 ${
                          isSelected
                            ? `bg-blue-50 ${statusStyles[project.estado]?.border || 'border-gray-400'} ring-2 ring-blue-300`
                            : `bg-white ${statusStyles[project.estado]?.border || 'border-gray-400'} hover:bg-gray-50`
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <h4 className="font-semibold text-gray-900 flex-1 pr-4">{project.descripcion_tarea}</h4>
                          <div className="flex items-center gap-2">
                            {(project.valor_estimado === null || project.valor_estimado === 0) ? (
                              <span className="text-xs font-semibold text-blue-800 bg-blue-100 border-l-4 border-blue-500 px-2 py-1 rounded-r-md hidden sm:inline">
                                {t('projects.modals.tabs.newProject')}
                              </span>
                            ) : (
                              <span className="text-xs font-semibold text-yellow-800 bg-yellow-100 border-l-4 border-yellow-500 px-2 py-1 rounded-r-md hidden sm:inline">
                                {t('projects.modals.tabs.projectWithCosts')}
                              </span>
                            )}
                            <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${statusStyles[project.estado]?.badge || 'bg-gray-200 text-gray-800'}`}>
                              {t(`projectStatus.${project.estado}`)}
                            </span>
                            {userProfile === 'ADM' && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onEditProject(project);
                                }}
                                className="p-1 rounded-full hover:bg-gray-200 transition-colors"
                                title={t('manageUsers.card.edit')}
                              >
                                <FilePenLine size={16} className="text-gray-600" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </Disclosure.Panel>
              </Transition>
            </>
          )}
        </Disclosure>
      )}
    </div>
  );
}
