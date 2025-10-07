'use client';

import { useState, useEffect } from 'react';
import type { Usuario } from '@/types/database';

interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (userData: Partial<Usuario>) => Promise<void>;
  user: Partial<Usuario> | null;
}

export default function UserModal({ isOpen, onClose, onSave, user }: UserModalProps) {
  const [formData, setFormData] = useState<Partial<Usuario>>({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setFormData(user || { tipo_usuario: 'PRE' });
  }, [user]);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    await onSave(formData);
    setIsSaving(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4">
          {user && user.id ? 'Editar' : 'Agregar'} Usuario
        </h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="id" className="block text-sm font-medium text-gray-700"># Casa (ID)</label>
            <input
              type="number"
              name="id"
              id="id"
              value={formData.id || ''}
              onChange={handleChange}
              required
              disabled={!!(user && user.id)} // Deshabilitar si se está editando
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm disabled:bg-gray-100"
            />
          </div>
          <div className="mb-4">
            <label htmlFor="responsable" className="block text-sm font-medium text-gray-700">Responsable</label>
            <input
              type="text"
              name="responsable"
              id="responsable"
              value={formData.responsable || ''}
              onChange={handleChange}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>
          <div className="mb-4">
            <label htmlFor="clave" className="block text-sm font-medium text-gray-700">Clave</label>
            <input
              type="password"
              name="clave"
              id="clave"
              value={formData.clave || ''}
              onChange={handleChange}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>
          <div className="mb-6">
            <label htmlFor="tipo_usuario" className="block text-sm font-medium text-gray-700">Tipo de Usuario</label>
            <select name="tipo_usuario" id="tipo_usuario" value={formData.tipo_usuario || 'PRE'} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm">
              <option value="PRE">Propietario Residente</option>
              <option value="ADM">Administrador</option>
            </select>
          </div>
          <div className="flex justify-end gap-4">
            <button type="button" onClick={onClose} className="bg-gray-200 text-gray-800 font-bold py-2 px-4 rounded hover:bg-gray-300">Cancelar</button>
            <button type="submit" disabled={isSaving} className="bg-blue-500 text-white font-bold py-2 px-4 rounded hover:bg-blue-700 disabled:bg-gray-400">
              {isSaving ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
