'use client';

import { useState, useCallback, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import type { GrupoConDetalles, Usuario, Contribuciones } from '@/types';

export function useGruposManager() {
  const supabase = createClient();

   const [grupos, setGrupos] = useState<GrupoConDetalles[]>([]);
   const [gruposPorContribucion, setGruposPorContribucion] = useState<Map<number, GrupoConDetalles[]>>(new Map());
   const [usuarios, setUsuarios] = useState<Pick<Usuario, 'id' | 'responsable'>[]>([]);
   const [contribuciones, setContribuciones] = useState<Contribuciones[]>([]);
   const [gruposConCargos, setGruposConCargos] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Traer todos los usuarios
      const { data: usuariosData, error: usuariosError } = await supabase
        .from('usuarios')
        .select('id, responsable')
        .order('id', { ascending: true });
      if (usuariosError) throw usuariosError;
      setUsuarios(usuariosData || []);

      // 2. Traer todas las contribuciones
      const { data: contribucionesData, error: contribucionesError } = await supabase
        .from('contribuciones')
        .select('*')
        .order('id_contribucion', { ascending: true });
      if (contribucionesError) throw contribucionesError;
      setContribuciones(contribucionesData || []);

      // 3. Traer grupos con join a contribuciones (usuarios se trae aparte)
      const { data: gruposData, error: gruposError } = await supabase
        .from('grupos')
        .select(`
          id_grupo,
          id_usuario,
          id_contribucion,
          created_at,
          contribuciones (
            id_contribucion,
            nombre,
            descripcion,
            tipo_cargo,
            color_del_borde,
            dia_cargo,
            periodicidad_dias,
            comentarios_contribucion
          )
        `)
        .order('id_grupo', { ascending: true });
      if (gruposError) throw gruposError;

      // 4. Agrupar por id_grupo y asignar usuarios desde usuariosData
      const map = new Map<number, GrupoConDetalles>();
      (gruposData || []).forEach(row => {
        if (!map.has(row.id_grupo)) {
          map.set(row.id_grupo, {
            id_grupo: row.id_grupo,
            id_usuario: row.id_usuario,
            id_contribucion: row.id_contribucion,
            created_at: row.created_at,
            contribucion: (Array.isArray(row.contribuciones) ? row.contribuciones[0] : row.contribuciones) as any,
            usuarios: []
          });
        }
        // Buscar el usuario completo en usuariosData
        const usuario = usuariosData.find(u => u.id === row.id_usuario);
        if (usuario) {
          const grupo = map.get(row.id_grupo)!;
          // Evitar duplicados: solo agregar si el usuario no está ya en la lista
          if (!grupo.usuarios.some(u => u.id === usuario.id)) {
            grupo.usuarios.push({
              id: usuario.id,
              responsable: usuario.responsable
            });
          }
        }
      });

      const gruposLista = Array.from(map.values());
      setGrupos(gruposLista);

      // 5. Agrupar grupos por contribución
      const porContribucion = new Map<number, GrupoConDetalles[]>();
      gruposLista.forEach(grupo => {
        const lista = porContribucion.get(grupo.id_contribucion) || [];
        lista.push(grupo);
        porContribucion.set(grupo.id_contribucion, lista);
      });
      setGruposPorContribucion(porContribucion);

      // 5. Obtener id_grupo que tienen al menos un cargo en contribucionesporcasa
      const { data: cargosData, error: cargosError } = await supabase
        .from('contribucionesporcasa')
        .select('id_grupo')
        .not('id_grupo', 'is', null);
      if (cargosError) throw cargosError;
      const idsConCargos = new Set<number>((cargosData || []).map(c => c.id_grupo as number));
      setGruposConCargos(idsConCargos);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      setError(`Error al cargar: ${message}`);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

   const saveGrupo = useCallback(async (
     id_grupoExistente: number | null,
     id_contribucion: number,
     userIds: number[]
   ) => {
     try {
       // Si es edición, eliminar ese grupo primero
       if (id_grupoExistente) {
         const { error: deleteError } = await supabase
           .from('grupos')
           .delete()
           .eq('id_grupo', id_grupoExistente);
         if (deleteError) throw deleteError;
       }

       // Determinar id_grupo nuevo: si es edición, usar el mismo; si es nuevo, calcular siguiente por contribución
       const id_grupo = id_grupoExistente ?? (() => {
         const gruposDeEstaContribucion = grupos.filter(g => g.id_contribucion === id_contribucion);
         const maxId = gruposDeEstaContribucion.length > 0
           ? Math.max(...gruposDeEstaContribucion.map(g => g.id_grupo))
           : 0;
         return maxId + 1;
       })();

       // Insertar nuevas filas
       const rows = userIds.map(uid => ({
         id_grupo,
         id_usuario: uid,
         id_contribucion
       }));

       const { error: insertError } = await supabase
         .from('grupos')
         .insert(rows);
       if (insertError) throw insertError;

       await fetchData();
     } catch (err: any) {
       throw err;
     }
   }, [supabase, grupos, fetchData]);

   const deleteGrupo = useCallback(async (id_grupo: number) => {
     try {
       const { error } = await supabase
         .from('grupos')
         .delete()
         .eq('id_grupo', id_grupo);
       if (error) throw error;
       await fetchData();
     } catch (err: any) {
       throw err;
     }
   }, [supabase, fetchData]);

   // --- Operaciones por usuario ---

   // Elimina un usuario específico de un grupo
   const eliminarUsuarioDeGrupo = useCallback(async (id_grupo: number, id_usuario: number) => {
     try {
       // Validar que el grupo no tenga cargos
       if (gruposConCargos.has(id_grupo)) {
         throw new Error('No se puede modificar un grupo con cargos generados');
       }

       const { error } = await supabase
         .from('grupos')
         .delete()
         .eq('id_grupo', id_grupo)
         .eq('id_usuario', id_usuario);
       if (error) throw error;
       await fetchData();
     } catch (err: any) {
       throw err;
     }
   }, [supabase, fetchData, gruposConCargos]);

   // Mueve un usuario de un grupo a otro
   const moverUsuario = useCallback(async (id_usuario: number, id_grupoOrigen: number, id_grupoDestino: number | null) => {
     try {
       // Validar que el grupo origen no tenga cargos
       if (gruposConCargos.has(id_grupoOrigen)) {
         throw new Error('No se puede modificar un grupo con cargos generados');
       }

       // Si hay grupo destino, validar que tampoco tenga cargos
       if (id_grupoDestino !== null && gruposConCargos.has(id_grupoDestino)) {
         throw new Error('No se puede mover a un grupo con cargos generados');
       }

       // Obtener la contribución del usuario actual (para validar regla 1 usuario x contribución)
       const grupoOrigen = grupos.find(g => g.id_grupo === id_grupoOrigen);
       if (!grupoOrigen) throw new Error('Grupo origen no encontrado');

       const id_contribucion = grupoOrigen.id_contribucion;

       // Si el destino es null, solo eliminamos de origen (sacar del grupo)
       if (id_grupoDestino === null) {
         const { error: deleteError } = await supabase
           .from('grupos')
           .delete()
           .eq('id_grupo', id_grupoOrigen)
           .eq('id_usuario', id_usuario);
         if (deleteError) throw deleteError;
         await fetchData();
         return;
       }

       // Validar que el usuario no esté ya en el grupo destino (misma contribución)
       const grupoDestino = grupos.find(g => g.id_grupo === id_grupoDestino);
       if (!grupoDestino) throw new Error('Grupo destino no encontrado');

       // Si la contribución es diferente, permitir; si es la misma, no permitir (regla: 1 usuario x contribución)
       if (grupoDestino.id_contribucion === id_contribucion) {
         throw new Error('El usuario ya pertenece a un grupo de esta contribución');
       }

       // 1. Eliminar de origen
       const { error: deleteError } = await supabase
         .from('grupos')
         .delete()
         .eq('id_grupo', id_grupoOrigen)
         .eq('id_usuario', id_usuario);
       if (deleteError) throw deleteError;

       // 2. Insertar en destino
       const { error: insertError } = await supabase
         .from('grupos')
         .insert({
           id_grupo: id_grupoDestino,
           id_usuario: id_usuario,
           id_contribucion: grupoDestino.id_contribucion
         });
       if (insertError) throw insertError;

       await fetchData();
     } catch (err: any) {
       throw err;
     }
   }, [supabase, fetchData, grupos, gruposConCargos]);

   return {
     grupos,
     gruposPorContribucion,
     usuarios,
     contribuciones,
     gruposConCargos,
     loading,
     error,
     saveGrupo,
     deleteGrupo,
     eliminarUsuarioDeGrupo,
     moverUsuario,
     refetch: fetchData
   };
 }
