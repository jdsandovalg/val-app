'use client';

import { useState, useEffect } from 'react';
import { useI18n } from '@/app/i18n-provider';
import type { Usuario } from '@/types/database';

interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (userData: Partial<Usuario>) => Promise<void>;
  user: Partial<Usuario> | null;
}

export default function UserModal({ isOpen, onClose, onSave, user }: UserModalProps) {
  const { t } = useI18n();
  const [userData, setUserData] = useState<Partial<Usuario>>({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setUserData(user || { tipo_usuario: 'PRE' });
  }, [user]);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setUserData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    await onSave(userData);
    setIsSaving(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4">{user && user.id ? t('userModal.titleEdit') : t('userModal.titleAdd')}</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="id" className="block text-sm font-medium text-gray-700">{t('userModal.idLabel')}</label>
            <input
              type="number"
              name="id"
              id="id"
              value={userData.id || ''}
              onChange={handleChange}
              required
              disabled={!!(user && user.id)} // Deshabilitar si se está editando
              placeholder={t('userModal.idPlaceholder')}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm disabled:bg-gray-100"
            />
          </div>
          <div className="mb-4">
            <label htmlFor="responsable" className="block text-sm font-medium text-gray-700">{t('userModal.responsibleLabel')}</label>
            <input
              type="text"
              name="responsable"
              id="responsable"
              value={userData.responsable || ''}
              onChange={handleChange}
              required
              placeholder={t('userModal.responsiblePlaceholder')}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>
          <div className="mb-4">
            <label htmlFor="clave" className="block text-sm font-medium text-gray-700">{t('userModal.passwordLabel')}</label>
            <input
              type="password"
              name="clave"
              id="clave"
              value={userData.clave || ''}
              onChange={handleChange}
              required
              placeholder={t('userModal.passwordPlaceholder')}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>
          <div className="mb-6">
            <label htmlFor="tipo_usuario" className="block text-sm font-medium text-gray-700">{t('userModal.userTypeLabel')}</label>
            <select name="tipo_usuario" id="tipo_usuario" value={userData.tipo_usuario || 'PRE'} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm">
              <option value="PRE">{t('manageUsers.filterModal.owner')}</option>
              <option value="ADM">{t('manageUsers.filterModal.admin')}</option>
            </select>
          </div>
          <div className="flex justify-end gap-4">
            <button type="button" onClick={onClose} className="bg-gray-200 text-gray-800 font-bold py-2 px-4 rounded hover:bg-gray-300">{t('userModal.cancelButton')}</button>
            <button type="submit" disabled={isSaving} className="bg-blue-500 text-white font-bold py-2 px-4 rounded hover:bg-blue-700 disabled:bg-gray-400">
              {isSaving ? `${t('userModal.saveButton')}...` : t('userModal.saveButton')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
