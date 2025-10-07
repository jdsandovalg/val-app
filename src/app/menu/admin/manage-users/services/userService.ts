import { createClient } from '@/utils/supabase/client';
import type { Usuario } from '@/types/database';

type UserPayload = Partial<Usuario>;

/**
 * Llama a la función RPC 'manage_user_data' en Supabase para realizar operaciones CRUD.
 * @param action - La operación a realizar ('SELECT', 'INSERT', 'UPDATE', 'DELETE').
 * @param payload - Los datos del usuario para la operación.
 * @returns Una promesa que se resuelve con la lista de usuarios.
 */
async function callManageUserRpc(action: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE', payload: UserPayload = {}) {
  const supabase = createClient();
  const { data, error } = await supabase.rpc('manage_user_data', {
    p_action: action,
    p_payload: payload,
  });

  if (error) {
    console.error(`Error en la operación de usuario (${action}):`, error);
    throw new Error(`Error en la operación de usuario (${action}): ${error.message}`);
  }

  return (data as Usuario[]) || [];
}

export const userService = {
  /**
   * Obtiene todos los usuarios.
   */
  getUsers: () => callManageUserRpc('SELECT'),

  /**
   * Inserta o actualiza un usuario.
   * @param user - Los datos del usuario. Si incluye un 'id', se actualizará. Si no, se insertará.
   */
  saveUser: (user: UserPayload) => (user.id ? callManageUserRpc('UPDATE', user) : callManageUserRpc('INSERT', user)),

  /**
   * Elimina un usuario por su ID.
   * @param userId - El ID del usuario a eliminar.
   */
  deleteUser: (userId: number) => callManageUserRpc('DELETE', { id: userId }),
};