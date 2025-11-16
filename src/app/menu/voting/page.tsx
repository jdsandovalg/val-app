'use client';

import { useState, useEffect } from 'react';
import { useI18n } from '@/app/i18n-provider';
import { createClient } from '@/utils/supabase/client';
import { toast } from 'react-hot-toast';
import { Home, CheckCircle2, FileText, Download, CheckCircle, XCircle, Ban } from 'lucide-react';
import type { Usuario } from '@/types/database'; 
import { formatCurrency } from '@/utils/format';

type EvidenciaVotacion = {
  id_evidencia: number;
  descripcion_evidencia: string;
  url_publica: string;
  valor_de_referencia: number | null;
};

type Casa = {
  id: number; // Es el id de usuario (numero de casa en este esquema)
  // Mantener id_casa opcional por compatibilidad si alguna fuente la retorna
  id_casa?: number;
};

type Vote = {
  id_voto?: number;
  id_proyecto?: number;
  id_evidencia?: number;
  id_usuario?: number;
  votante_proxy_id?: number | null;
  responsable?: string; // Agregado para la nueva función RPC
};

// Definición LOCAL del tipo Proyecto, basada en la estructura que devuelve la RPC.
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
  fecha_inicial_proyecto: string | null;
  fecha_final_proyecto: string | null;
  es_propuesta: boolean;
};

export default function VotingPage() {
  const { t, locale, currency } = useI18n();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<Usuario | null>(null);
  const [casas, setCasas] = useState<Casa[]>([]);
  const [votes, setVotes] = useState<Vote[]>([]);
  const [cotizaciones, setCotizaciones] = useState<EvidenciaVotacion[]>([]);
  const [votableProjects, setVotableProjects] = useState<Proyecto[]>([]);
  const [selectedCasa, setSelectedCasa] = useState<Casa | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');

  // Obtener los proyectos y seleccionar el primero en votación
  useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(true);
      try {
        // Obtener usuario actual desde localStorage si existe
        const storedUser = localStorage.getItem('usuario');
        if (storedUser) {
          const user: Usuario = JSON.parse(storedUser);
          setCurrentUser(user);
        }

        const { data: projectsData, error: projectsError } = await supabase.rpc('gestionar_proyectos', { p_action: 'SELECT_ALL' });
        if (projectsError) {
          console.error('Error completo:', projectsError);
          throw new Error(projectsError.message || JSON.stringify(projectsError));
        }

        // Mostrar proyectos en votación, aprobados, rechazados o cancelados
        const projectsInVoting = (projectsData || []).filter((p: Proyecto) => 
          ['en_votacion', 'aprobado', 'rechazado', 'cancelado'].includes(p.estado)
        );
        setVotableProjects(projectsInVoting);

        if (projectsInVoting.length > 0) {
          setSelectedProjectId(String(projectsInVoting[0].id_proyecto));
        }
      } catch (error: unknown) {
        console.error('Error detallado:', error);
        const message = error instanceof Error ? error.message : String(error);
        toast.error(`Error al cargar proyectos: ${message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, [supabase, t]);

  useEffect(() => {
    if (!selectedProjectId) {
      setLoading(false);
      return;
    };

    const fetchProjectDetails = async () => {
      setLoading(true);
      try {
        const { data: casasData, error: casasError } = await supabase
          .from('usuarios')
          .select('id')
          .in('tipo_usuario', ['PRE', 'ADM', 'OPE'])
          .order('id');
        if (casasError) throw casasError;
        setCasas(casasData as Casa[]);

        // Lógica de autoselección de casa
        if (currentUser) {
          const casasList = casasData as Casa[];
          const userCasa = (currentUser.tipo_usuario === 'PRE' || currentUser.tipo_usuario === 'OPE')
            ? casasList.find(c => c.id === currentUser.id)
            : casasList[0];
          setSelectedCasa(userCasa || null);
        }

        // Cargar las cotizaciones para el proyecto seleccionado
        const { data: cotizacionesData, error: cotizacionesError } = await supabase.rpc('fn_gestionar_proyecto_evidencias', { p_accion: 'SELECT', p_id_proyecto: Number(selectedProjectId), p_tipo_evidencia: 'COTIZACION_PARA_VOTACION' });
        if (cotizacionesError) throw cotizacionesError;
        setCotizaciones((cotizacionesData as EvidenciaVotacion[]).sort((a, b) => (a.valor_de_referencia || Infinity) - (b.valor_de_referencia || Infinity)));

        // Cargar votos existentes para este proyecto
        const { data: votesData, error: votesError } = await supabase.rpc('fn_gestionar_votos', { p_accion: 'SELECT', p_id_proyecto: Number(selectedProjectId) });
        if (votesError) throw votesError;
        setVotes(votesData || []);

      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        toast.error(`${t('projects.alerts.fetchError', { message: 'detalles del proyecto' })}: ${message}`);
      } finally {
        setLoading(false);
      }
    };
    fetchProjectDetails();
  }, [selectedProjectId, supabase, currentUser, t]);

  const handleCasaSelect = (casa: Casa) => {
    const isDisabled = (currentUser?.tipo_usuario === 'PRE' || currentUser?.tipo_usuario === 'OPE') && currentUser?.id !== casa.id;
    if (!isDisabled) setSelectedCasa(casa);
  };

  const hasCasaVoted = (casaId: number) => {
    return votes.some(v => Number(v.id_usuario) === Number(casaId));
  };

  const hasCasaVotedForEvidence = (casaId: number, evidenciaId: number) => {
    return votes.some(v => Number(v.id_usuario) === Number(casaId) && Number(v.id_evidencia) === Number(evidenciaId));
  };

  const handleVote = async (evidenciaId: number) => {
    if (!selectedProjectId || !selectedCasa) return;
    // RPC ahora acepta p_id_usuario y p_votante_proxy_id como bigint (numero de casa).
    // Pasamos el id de la casa seleccionada directamente.
    const payload: Record<string, unknown> = {
      p_accion: 'VOTAR',
      p_id_proyecto: Number(selectedProjectId),
      p_id_evidencia: Number(evidenciaId),
      p_id_usuario: selectedCasa.id,
      // Si el usuario actual es ADM y votó por otra casa, pasar el id del admin como proxy.
      // De lo contrario, null (voto directo del residente).
      p_votante_proxy_id: (currentUser?.tipo_usuario === 'ADM' && currentUser?.id !== selectedCasa.id)
        ? currentUser.id
        : null,
    };

    await toast.promise(
      (async () => {
        const { error } = await supabase.rpc('fn_gestionar_votos', payload);
        if (error) throw error;
      })(),
      {
        loading: 'Registrando voto...',
        success: '¡Voto registrado!',
        error: (err) => `Error registrando voto: ${err?.message || String(err)}`,
      }
    );

    // Refrescar votos
    const { data: votesData, error: votesError } = await supabase.rpc('fn_gestionar_votos', { p_accion: 'SELECT', p_id_proyecto: Number(selectedProjectId) });
    if (!votesError) setVotes(votesData || []);
  };

  const handleUnvote = async () => {
    if (!selectedProjectId || !selectedCasa) return;
    // Pasar el id de la casa seleccionada como p_id_usuario (bigint).
    const payload: Record<string, unknown> = {
      p_accion: 'ANULAR_VOTO',
      p_id_proyecto: Number(selectedProjectId),
      p_id_usuario: selectedCasa.id,
    };

    await toast.promise(
      (async () => {
        const { error } = await supabase.rpc('fn_gestionar_votos', payload);
        if (error) throw error;
      })(),
      {
        loading: 'Anulando voto...',
        success: '¡Voto anulado!',
        error: (err) => `Error anulando voto: ${err?.message || String(err)}`,
      }
    );

    // Refrescar votos
    const { data: votesData, error: votesError } = await supabase.rpc('fn_gestionar_votos', { p_accion: 'SELECT', p_id_proyecto: Number(selectedProjectId) });
    if (!votesError) setVotes(votesData || []);
  };

  const handleGenerateReport = async () => {
    if (!selectedProjectId) return;

    try {
      // Obtener información del proyecto completa
      const selectedProject = votableProjects.find(p => String(p.id_proyecto) === selectedProjectId);
      if (!selectedProject) {
        toast.error('No se encontró el proyecto');
        return;
      }

      // Obtener información adicional del proyecto (tipo, grupo)
      const { data: projectDetailsData, error: detailsError } = await supabase.rpc('get_project_info_with_status', {
        p_id_proyecto: Number(selectedProjectId),
      });
      if (detailsError) throw detailsError;

      const projectDetails = projectDetailsData?.[0] || {};
      const projectInfo = {
        descripcion_tarea: selectedProject.descripcion_tarea,
        detalle_tarea: selectedProject.detalle_tarea,
        notas_clave: null, // No mostrar notas clave en el reporte
        tipo_proyecto: projectDetails.tipo_proyecto || 'N/A',
        grupo_mantenimiento: projectDetails.grupo_mantenimiento || 'N/A',
        estado: selectedProject.estado,
        fecha_inicial_proyecto: selectedProject.fecha_inicial_proyecto,
        fecha_final_proyecto: selectedProject.fecha_final_proyecto,
      };

      // Obtener votos con responsables usando la nueva función RPC
      const { data: votesWithResponsable, error: votesError } = await supabase.rpc('fn_gestionar_votos_con_responsable', {
        p_id_proyecto: Number(selectedProjectId),
      });

      if (votesError) throw votesError;

      const votosData = votesWithResponsable || [];

      // Crear objeto de cotizaciones con conteo de votos y responsables
      const cotizacionesConVotos = cotizaciones.map(cot => {
        const votosCot = votosData.filter((v: Vote) => Number(v.id_evidencia) === Number(cot.id_evidencia));
        const conteoVotos = votosCot.length;

        // Obtener los responsables de todas las casas que votaron
        const responsables = votosCot
          .map((v: Vote) => `Casa ${v.id_usuario} - ${v.responsable}`)
          .join(', ');

        return {
          id_evidencia: cot.id_evidencia,
          descripcion_evidencia: cot.descripcion_evidencia,
          valor_de_referencia: cot.valor_de_referencia,
          url_publica: cot.url_publica,
          votos: conteoVotos,
          responsables: responsables || null,
        };
      });

      const fileName = `Reporte_Votacion_${selectedProject.descripcion_tarea.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;

      const reportData = {
        projectInfo,
        cotizaciones: cotizacionesConVotos,
        fileName,
      };

      localStorage.setItem('votingReportData', JSON.stringify(reportData));

      // Navegar a la página de reporte
      window.location.href = '/menu/voting/report';
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      toast.error(`Error al generar reporte: ${message}`);
    }
  };

  const handleApproveProject = async () => {
    if (!selectedProjectId) return;

    // Encontrar la cotización ganadora (la que tiene todos los votos)
    const totalCasas = casas.length;
    const cotizacionGanadora = cotizaciones.find(cot => {
      const votosCot = votes.filter(v => Number(v.id_evidencia) === Number(cot.id_evidencia));
      return votosCot.length === totalCasas;
    });

    if (!cotizacionGanadora) {
      toast.error('No se encontró la cotización ganadora');
      return;
    }

    if (!cotizacionGanadora.valor_de_referencia || cotizacionGanadora.valor_de_referencia <= 0) {
      toast.error('La cotización ganadora no tiene un monto válido');
      return;
    }

    await toast.promise(
      (async () => {
        // Llamada única que maneja la transacción completa
        const { error } = await supabase.rpc('aprobar_proyecto_y_generar_contribuciones', {
          p_id_proyecto: Number(selectedProjectId),
          p_valor_cotizacion: cotizacionGanadora.valor_de_referencia,
        });
        if (error) throw error;

        // Recargar proyectos para actualizar el estado
        const { data: projectsData, error: projectsError } = await supabase.rpc('gestionar_proyectos', { p_action: 'SELECT_ALL' });
        if (!projectsError) {
          const projectsInVoting = (projectsData || []).filter((p: Proyecto) => 
            ['en_votacion', 'aprobado', 'rechazado', 'cancelado'].includes(p.estado)
          );
          setVotableProjects(projectsInVoting);
        }
      })(),
      {
        loading: 'Aprobando proyecto y generando contribuciones...',
        success: `¡Proyecto aprobado! Contribuciones generadas: ${formatCurrency(cotizacionGanadora.valor_de_referencia / totalCasas, locale, currency)} por casa`,
        error: (err) => `Error: ${err?.message || String(err)}`,
      }
    );
  };

  const handleChangeProjectState = async (newState: 'rechazado' | 'cancelado') => {
    if (!selectedProjectId) return;

    const stateLabel = newState === 'rechazado' ? 'Rechazado' : 'Cancelado';

    await toast.promise(
      (async () => {
        const { error } = await supabase.rpc('gestionar_proyectos', {
          p_action: 'UPDATE',
          p_id_proyecto: Number(selectedProjectId),
          p_estado: newState,
        });
        if (error) throw error;

        // Recargar proyectos para actualizar el estado
        const { data: projectsData, error: projectsError } = await supabase.rpc('gestionar_proyectos', { p_action: 'SELECT_ALL' });
        if (!projectsError) {
          const projectsInVoting = (projectsData || []).filter((p: Proyecto) => 
            ['en_votacion', 'aprobado', 'rechazado', 'cancelado'].includes(p.estado)
          );
          setVotableProjects(projectsInVoting);
          // Mantener el proyecto actual seleccionado para ver el resultado
        }
      })(),
      {
        loading: `Cambiando estado a ${stateLabel}...`,
        success: `Proyecto marcado como ${stateLabel}`,
        error: (err) => `Error: ${err?.message || String(err)}`,
      }
    );
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 w-screen overflow-x-hidden">
      {/* Título (Visible en mobile, oculto en desktop) */}
      <div className="md:hidden bg-gray-800 text-white p-4 flex items-center justify-center">
        <h1 className="text-xl font-bold tracking-widest">
          {t('voting.title').toUpperCase()}
        </h1>
      </div>

      {/* Contenedor flexible para desktop (barra lateral + contenido) */}
      <div className="flex flex-grow overflow-x-hidden">
        {/* Barra Lateral con Título Vertical (Solo Desktop) */}
        <div className="hidden md:flex md:w-16 flex-shrink-0 bg-gray-800 text-white items-center justify-center">
          <h1 className="text-2xl font-bold tracking-widest" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>
            {t('voting.title').toUpperCase()}
          </h1>
        </div>

        {/* Contenido Principal */}
        <div className="flex-grow w-full px-4 sm:px-6 md:px-8 py-4 sm:py-6 md:py-8 overflow-y-auto overflow-x-hidden">
        <div className="w-full max-w-7xl mx-auto">
          
          {/* Estado Vacío cuando no hay proyectos */}
          {!loading && votableProjects.length === 0 && (
            <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
              <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12 max-w-2xl w-full text-center">
                {/* Icono decorativo */}
                <div className="mb-6 flex justify-center">
                  <div className="bg-blue-50 rounded-full p-6">
                    <svg className="w-20 h-20 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                
                {/* Título */}
                <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-4">
                  {t('voting.noProjectsTitle')}
                </h2>
                
                {/* Mensaje principal */}
                <p className="text-gray-600 text-base md:text-lg mb-6 leading-relaxed">
                  {t('voting.noProjectsMessage')}
                </p>
                
                {/* Sugerencia */}
                <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg">
                  <p className="text-sm text-blue-800 text-left">
                    💡 <span className="font-semibold">Sugerencia:</span> {t('voting.noProjectsHint')}
                  </p>
                </div>
                
                {/* Botones de acción */}
                <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
                  <a
                    href="/menu/grupos-de-trabajo"
                    className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition-colors"
                  >
                    Ver Grupos de Trabajo
                  </a>
                  <a
                    href="/menu/calendarios"
                    className="px-6 py-3 bg-white border-2 border-blue-600 text-blue-600 font-semibold rounded-lg hover:bg-blue-50 transition-colors"
                  >
                    Ver Calendario
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* Contenido normal cuando hay proyectos */}
          {votableProjects.length > 0 && (
            <>
          {/* --- INICIO: Selector de Proyecto --- */}
          <div className="mb-8 bg-white p-4 rounded-lg shadow">
            <label htmlFor="project-selector" className="block text-sm font-medium text-gray-700 mb-2">{t('voting.selectProject')}</label>
            <select
              id="project-selector"
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="w-full max-w-md px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              disabled={loading}
            >
              {votableProjects.map(proj => (
                <option key={proj.id_proyecto} value={proj.id_proyecto}>
                  {proj.descripcion_tarea}
                </option>
              ))}
            </select>
          </div>
          {/* --- FIN: Selector de Proyecto --- */}

          {selectedProjectId && (
            <>
              {/* Badge de Estado del Proyecto */}
              {(() => {
                const selectedProject = votableProjects.find(p => String(p.id_proyecto) === selectedProjectId);
                const estado = selectedProject?.estado || 'en_votacion';
                const estadoConfig = {
                  'en_votacion': { label: t('voting.statusInVoting'), color: 'bg-blue-100 text-blue-800 border-blue-300' },
                  'aprobado': { label: t('voting.statusApproved'), color: 'bg-green-100 text-green-800 border-green-300' },
                  'rechazado': { label: t('voting.statusRejected'), color: 'bg-red-100 text-red-800 border-red-300' },
                  'cancelado': { label: t('voting.statusCanceled'), color: 'bg-gray-100 text-gray-800 border-gray-300' },
                };
                const config = estadoConfig[estado as keyof typeof estadoConfig] || estadoConfig['en_votacion'];
                
                return estado !== 'en_votacion' ? (
                  <div className={`mb-6 p-4 border-2 rounded-lg ${config.color}`}>
                    <p className="text-sm font-semibold">
                      {t('voting.projectStatus')}: <span className="uppercase">{config.label}</span>
                    </p>
                    <p className="text-xs mt-1 opacity-80">
                      {t('voting.votingFinalized')}
                    </p>
                  </div>
                ) : null;
              })()}

              {/* Sección Superior: Selección de Casa */}
              <div className="mb-8 p-4 bg-white rounded-lg shadow">
                <h2 className="text-lg font-semibold text-gray-700 mb-4">{t('voting.selectHouse')}</h2>
                {loading ? <p>Cargando casas...</p> : (
                  <>
                    {(() => {
                      const selectedProject = votableProjects.find(p => String(p.id_proyecto) === selectedProjectId);
                      const proyectoEnVotacion = selectedProject?.estado === 'en_votacion';
                      
                      return (
                        <>
                          <div className="mb-2 text-sm text-gray-500">
                            { !proyectoEnVotacion
                              ? `🔒 ${t('voting.votingFinishedSelector')}`
                              : (currentUser?.tipo_usuario === 'PRE' || currentUser?.tipo_usuario === 'OPE')
                              ? t('voting.disabledHouseExplanation')
                              : t('voting.selectHouse')
                            }
                          </div>
                          <div className="flex flex-wrap gap-3">
                            {casas.map(casa => {
                              const isSelected = selectedCasa?.id === casa.id;
                              const isUserLimited = currentUser?.tipo_usuario === 'PRE' || currentUser?.tipo_usuario === 'OPE';
                              // Deshabilitar si el proyecto no está en votación O si es usuario limitado en otra casa
                              const isDisabled = !proyectoEnVotacion || (isUserLimited && currentUser?.id !== casa.id);
                              const hasVoted = hasCasaVoted(casa.id);
                              const title = !proyectoEnVotacion
                                ? t('voting.votingClosed')
                                : isDisabled
                                ? t('voting.disabledHouseTooltip')
                                : `${t('voting.selectHouse')} ${casa.id}`;

                              return (
                              <div key={casa.id} className="relative">
                                <button
                                  onClick={() => handleCasaSelect(casa)}
                                  disabled={isDisabled}
                                  title={title}
                                  className={`flex flex-col items-center justify-center w-14 h-14 rounded-lg transition-colors ${isSelected ? 'bg-blue-200 text-blue-800 ring-2 ring-blue-500' : hasVoted ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-600 hover:bg-blue-100'} ${isDisabled ? 'opacity-40 cursor-not-allowed' : ''}`}>
                                  <Home size={20} />
                                  <span className="text-xs font-bold text-gray-700 mt-1">{casa.id}</span>
                                </button>
                                {hasVoted && (
                                  <span className="absolute -top-1 -right-1 bg-white rounded-full p-0.5">
                                    <CheckCircle2 size={14} className="text-green-600" />
                                  </span>
                                )}
                              </div>
                              );
                            })}
                          </div>
                        </>
                      );
                    })()}
                  </>
                )}
              </div>

              {/* Sección Principal: Lista de Cotizaciones */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-bold text-gray-800">{t('voting.projectQuotes')}</h2>
                  <button
                    onClick={handleGenerateReport}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white font-semibold rounded-lg shadow-md hover:bg-green-700 transition-colors"
                    title={t('voting.generateReport') || 'Generar Reporte PDF'}
                  >
                    <Download size={18} />
                    <span className="hidden sm:inline">PDF</span>
                  </button>
                </div>
                {loading ? <p>Cargando cotizaciones...</p> : cotizaciones.length > 0 ? (
                  <>
                    {(() => {
                      const selectedProject = votableProjects.find(p => String(p.id_proyecto) === selectedProjectId);
                      const proyectoEnVotacion = selectedProject?.estado === 'en_votacion';

                      return cotizaciones.map(cot => {
                        const selectedCasaExists = !!selectedCasa;
                        const selectedCasaVoted = selectedCasaExists ? hasCasaVoted(selectedCasa!.id) : false;
                        const votedForThis = selectedCasaExists ? hasCasaVotedForEvidence(selectedCasa!.id, cot.id_evidencia) : false;

                        return (
                          <div key={cot.id_evidencia} className="p-4 bg-white rounded-lg shadow-md border-l-4 border-gray-300 flex justify-between items-center">
                            <div>
                              <p className="font-semibold text-gray-800">{cot.descripcion_evidencia}</p>
                              {cot.valor_de_referencia != null && (
                                <p className="text-xl font-bold text-green-700 mt-1">
                                  {formatCurrency(cot.valor_de_referencia, locale, currency)}
                                </p>
                              )}
                            </div>
                            <div className="flex items-center gap-3">
                              <a href={cot.url_publica} target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-gray-900">
                                <FileText size={18} />
                              </a>

                              {/* Si el proyecto NO está en votación, deshabilitar todos los botones */}
                              {!proyectoEnVotacion && (
                                <button 
                                  disabled 
                                  className="px-4 py-2 bg-gray-400 text-white font-semibold rounded-lg cursor-not-allowed"
                                  title={t('voting.votingClosed')}
                                >
                                  🔒 {t('voting.votingClosed')}
                                </button>
                              )}

                              {/* Si está en votación, mantener lógica original */}
                              {proyectoEnVotacion && !selectedCasaExists && (
                                <button disabled className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg disabled:bg-gray-400 disabled:cursor-not-allowed">{t('voting.vote')}</button>
                              )}

                              {proyectoEnVotacion && selectedCasaExists && !selectedCasaVoted && (
                                <button onClick={() => handleVote(cot.id_evidencia)} className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700">{t('voting.vote')}</button>
                              )}

                              {proyectoEnVotacion && selectedCasaExists && selectedCasaVoted && votedForThis && (
                                <button onClick={handleUnvote} className="px-4 py-2 bg-red-600 text-white font-semibold rounded-lg shadow-md hover:bg-red-700">Anular Voto</button>
                              )}

                              {proyectoEnVotacion && selectedCasaExists && selectedCasaVoted && !votedForThis && (
                                <button disabled className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg disabled:bg-gray-400 disabled:cursor-not-allowed">{t('voting.vote')}</button>
                              )}
                            </div>
                          </div>
                        );
                      });
                    })()}

                    {/* Sección de Decisión del Administrador - Solo si el proyecto está EN VOTACIÓN */}
                    {currentUser?.tipo_usuario === 'ADM' && (() => {
                      const selectedProject = votableProjects.find(p => String(p.id_proyecto) === selectedProjectId);
                      const proyectoEnVotacion = selectedProject?.estado === 'en_votacion';

                      // Solo mostrar si está en votación
                      if (!proyectoEnVotacion) return null;

                      const totalCasas = casas.length;
                      const totalVotos = votes.length;
                      const todosVotaron = totalVotos === totalCasas && totalCasas > 0;

                      // Calcular consenso
                      const votosPorCotizacion = cotizaciones.map(cot => ({
                        ...cot,
                        votos: votes.filter(v => Number(v.id_evidencia) === Number(cot.id_evidencia)).length,
                      }));

                      const cotizacionConMasVotos = votosPorCotizacion.reduce((prev, current) => 
                        (current.votos > prev.votos) ? current : prev
                      , votosPorCotizacion[0]);

                      const tieneConsenso = cotizacionConMasVotos?.votos === totalCasas && totalCasas > 0;
                      const valorValido = (cotizacionConMasVotos?.valor_de_referencia || 0) > 0;

                      return todosVotaron ? (
                        <div className="mt-6 p-6 bg-blue-50 border-2 border-blue-200 rounded-lg">
                          <h3 className="text-lg font-bold text-gray-800 mb-4">
                            ⚖️ {t('voting.adminDecision')}
                          </h3>

                          {tieneConsenso ? (
                            <>
                              {/* 100% Consenso alcanzado */}
                              <div className="mb-4 p-4 bg-green-50 border-l-4 border-green-500 rounded">
                                <p className="text-sm text-green-800 mb-2">
                                  <CheckCircle className="inline mr-2" size={18} />
                                  <strong>{t('voting.consensusReached')}</strong> {t('voting.consensusMessage')}
                                </p>
                                <p className="text-xs text-green-700">
                                  {t('voting.winningQuote')}: <strong>{cotizacionConMasVotos.descripcion_evidencia}</strong>
                                </p>
                                {!valorValido && (
                                  <p className="text-xs text-red-600 mt-2">
                                    ⚠️ {t('voting.invalidAmountWarning')}
                                  </p>
                                )}
                              </div>
                              
                              <button
                                onClick={handleApproveProject}
                                disabled={!valorValido}
                                className={`w-full flex items-center justify-center gap-2 px-6 py-3 font-semibold rounded-lg shadow-md transition-colors ${
                                  valorValido
                                    ? 'bg-green-600 text-white hover:bg-green-700'
                                    : 'bg-gray-400 text-gray-200 cursor-not-allowed'
                                }`}
                                title={valorValido ? t('voting.approveTooltip') : t('voting.invalidAmountTooltip')}
                              >
                                <CheckCircle size={20} />
                                {t('voting.approveAndGenerate')}
                              </button>
                            </>
                          ) : (
                            <>
                              {/* No hay consenso (votos divididos) */}
                              <div className="mb-4 p-4 bg-yellow-50 border-l-4 border-yellow-500 rounded">
                                <p className="text-sm text-yellow-800 mb-2">
                                  <strong>{t('voting.noConsensus')}</strong> {t('voting.noConsensusMessage')}
                                </p>
                                <p className="text-xs text-yellow-700">
                                  {t('voting.chooseAction')}
                                </p>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <button
                                  onClick={() => handleChangeProjectState('rechazado')}
                                  className="flex items-center justify-center gap-2 px-4 py-3 bg-red-600 text-white font-semibold rounded-lg shadow-md hover:bg-red-700 transition-colors"
                                >
                                  <XCircle size={20} />
                                  {t('voting.rejectProject')}
                                </button>
                                <button
                                  onClick={() => handleChangeProjectState('cancelado')}
                                  className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-600 text-white font-semibold rounded-lg shadow-md hover:bg-gray-700 transition-colors"
                                >
                                  <Ban size={20} />
                                  {t('voting.cancelProject')}
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      ) : null;
                    })()}
                  </>
                ) : (
                  <div className="p-6 bg-white rounded-lg shadow text-center text-gray-500"><p>{t('voting.noQuotes')}</p></div>
                )}
              </div>
            </>
          )}
          {/* Fin del contenido cuando hay proyectos */}
          </>
          )}

        </div>
        </div>
      </div>
    </div>
  );
}