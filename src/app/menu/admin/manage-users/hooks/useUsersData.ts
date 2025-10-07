'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Usuario } from '@/types/database';
import { userService } from '../services/userService'; // Importamos el servicio

export default function useUsersData() {
  const [users, setUsers] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Usamos el servicio centralizado para obtener los usuarios
      const data = await userService.getUsers();
      setUsers(data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Ocurrió un error desconocido.';
      console.error('Error en useUsersData:', err);
      setError(`Error al cargar los usuarios: ${message}`);
    } finally {
      setLoading(false);
    }
  }, []); // Las dependencias cambian ya que 'supabase' no se usa directamente

  useEffect(() => { fetchData(); }, [fetchData]);

  return { users, loading, error, fetchData };
}