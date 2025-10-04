'use client';

import { useState, useEffect } from 'react';
import type { ContribucionPorCasaExt } from '@/types';
import type { Usuario } from '@/types/database';

interface ContributionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<ContribucionPorCasaExt>) => Promise<void>;
  record: Partial<ContribucionPorCasaExt> | null;
  usuarios: Pick<Usuario, 'id' | 'responsable'>[];
  contribuciones: { id_contribucion: string; descripcion: string | null }[];
}

function ContributionModal({
  isOpen,
  onClose,
  onSave,
  record,
  usuarios,
  contribuciones,
}: ContributionModalProps) {
  const [formData, setFormData] = useState<Partial<ContribucionPorCasaExt>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setFormData(
      record || {
        fecha: new Date().toISOString().split('T')[0],
        pagado: null,
        realizado: 'N',
      }
    );
  }, [record]);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const isCheckbox = type === 'checkbox';

    if (isCheckbox && name === 'realizado') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({ ...prev, [name]: checked ? 'S' : 'N' }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: isCheckbox ? (e.target as HTMLInputElement).checked : value,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await onSave(formData);
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4">
          {record && record.id_casa ? 'Editar' : 'Agregar'} Aportación
        </h2>
        <form onSubmit={handleSubmit}>
          {/* Select Casa */}
          <div className="mb-4">
            <label htmlFor="casa_id" className="block text-sm font-medium text-gray-700">Casa</label>
            <select name="id_casa" id="id_casa" value={formData.id_casa || ''} onChange={handleChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm">
              <option value="" disabled>Seleccione una casa</option>
              {usuarios.map(u => <option key={u.id} value={u.id}>Casa #{u.id} - {u.responsable}</option>)}
            </select>
          </div>

          {/* Select Contribución */}
          <div className="mb-4">
            <label htmlFor="id_contribucion" className="block text-sm font-medium text-gray-700">Tipo de Contribución</label>
            <select name="id_contribucion" id="id_contribucion" value={formData.id_contribucion || ''} onChange={handleChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm">
              <option value="" disabled>Seleccione una contribución</option>
              {contribuciones.map((c) => (
                <option key={c.id_contribucion} value={c.id_contribucion}>{c.descripcion}</option>
              ))}
            </select>
          </div>

          <div className="mb-4">
            <label htmlFor="fecha" className="block text-sm font-medium text-gray-700">Fecha</label>
            <input type="date" name="fecha" id="fecha" value={formData.fecha || ''} onChange={handleChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
          </div>

          <div className="mb-4">
            <label htmlFor="pagado" className="block text-sm font-medium text-gray-700">Monto Pagado</label>
            <input type="number" name="pagado" id="pagado" value={formData.pagado ?? ''} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" placeholder="0.00" step="0.01" />
          </div>
          <div className="flex items-center mb-6">
            <div className="flex items-center">
              <input id="realizado" name="realizado" type="checkbox" checked={formData.realizado === 'S'} onChange={handleChange} className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
              <label htmlFor="realizado" className="ml-2 block text-sm text-gray-900">Realizado</label>
            </div>
          </div>

          {/* Acciones */}
          <div className="flex justify-end gap-4">
            <button type="button" onClick={onClose} className="bg-gray-200 text-gray-800 font-bold py-2 px-4 rounded hover:bg-gray-300">Cancelar</button>
            <button type="submit" disabled={loading} className="bg-blue-500 text-white font-bold py-2 px-4 rounded hover:bg-blue-700 disabled:bg-gray-400">
              {loading ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ContributionModal;
