'use client';

import { useState, useEffect } from 'react';
import { useI18n } from '@/app/i18n-provider';
import type { Usuario } from '@/types/database';

export type UserFormData = Partial<Usuario> & { avatarFile?: File | null };

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (userData: UserFormData) => Promise<void>;
  user: Partial<Usuario> | null;
}

export default function ProfileModal({ isOpen, onClose, onSave, user }: ProfileModalProps) {
  const { t } = useI18n();
  const [userData, setUserData] = useState<Partial<Usuario>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [confirmClave, setConfirmClave] = useState('');
  const [passwordError, setPasswordError] = useState('');

  useEffect(() => {
    setUserData(user || {});
    setConfirmClave('');
    setPasswordError('');
  }, [user]);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setUserData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (userData.clave && userData.clave !== confirmClave) {
      setPasswordError(t('userModal.passwordMismatch'));
      return;
    }
    setPasswordError('');
    setIsSaving(true);
    // Pasamos un objeto vacío para avatarFile ya que la funcionalidad está pausada
    await onSave({ ...userData, avatarFile: null });
    setIsSaving(false);
  };

  return (
    <div className="fixed inset-0 bg-gray-800 bg-opacity-50 z-50 flex justify-center items-center p-4">
      <div className="relative bg-white p-6 rounded-lg shadow-xl w-full max-w-md border-l-4 border-blue-500">
        <h2 className="text-xl font-bold mb-1">{t('userModal.titleEdit')}</h2>
        <p className="text-sm text-gray-500 mb-4">{t('userModal.subtitle')}</p>
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label htmlFor="id" className="block text-xs font-medium text-gray-600">{t('userModal.idLabel')}</label>
            <input
              type="number"
              name="id"
              id="id"
              value={userData.id || ''}
              readOnly
              disabled
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm disabled:bg-gray-100 text-sm"
            />
          </div>
          <div className="mb-3">
            <label htmlFor="responsable" className="block text-xs font-medium text-gray-600">{t('userModal.responsibleLabel')}</label>
            <input
              type="text"
              name="responsable"
              id="responsable"
              value={userData.responsable || ''}
              onChange={handleChange}
              required
              placeholder={t('userModal.responsiblePlaceholder')}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm text-sm"
            />
          </div>
          <div className="mb-3">
            <label htmlFor="clave" className="block text-xs font-medium text-gray-600">{t('userModal.passwordLabelNew')}</label>
            <input
              type="password"
              name="clave"
              id="clave"
              value={userData.clave || ''}
              onChange={handleChange}
              placeholder={t('userModal.passwordPlaceholderOptional')}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm text-sm"
            />
          </div>
          {(userData.clave || confirmClave) && (
            <div className="mb-3">
              <label htmlFor="confirmClave" className="block text-xs font-medium text-gray-600">{t('userModal.passwordConfirmLabel')}</label>
              <input
                type="password"
                name="confirmClave"
                id="confirmClave"
                value={confirmClave}
                onChange={(e) => setConfirmClave(e.target.value)}
                placeholder={t('userModal.passwordConfirmPlaceholder')}
                className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm text-sm ${passwordError ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500'}`}
              />
              {passwordError && <p className="mt-2 text-xs text-red-600">{passwordError}</p>}
            </div>
          )}
          <div className="mb-3">
            <label htmlFor="email" className="block text-xs font-medium text-gray-600">{t('userModal.emailLabel')}</label>
            <input
              type="email"
              name="email"
              id="email"
              value={userData.email || ''}
              onChange={handleChange}
              placeholder={t('userModal.emailPlaceholder')}
              pattern="[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$"
              title={t('userModal.emailInvalid')}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm text-sm"
            />
            <input type="hidden" name="ubicacion" value={userData.ubicacion || ''} />
            <input type="hidden" name="tipo_usuario" value={userData.tipo_usuario || ''} />
          </div>
          <div className="flex justify-end gap-4 mt-8">
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