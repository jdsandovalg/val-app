'use client';

import { useState, useEffect } from 'react';
import { useI18n } from '@/app/i18n-provider';
import type { Usuario } from '@/types/database';
import Image from 'next/image';

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
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  useEffect(() => {
    setUserData(user || {});
    setConfirmClave('');
    setPasswordError('');
    setAvatarFile(null);
    setAvatarPreview(null);
  }, [user]);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setUserData(prev => ({ ...prev, [name]: value }));
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validar tipo de archivo
      if (!file.type.startsWith('image/')) {
        setPasswordError(t('userModal.invalidImageType'));
        return;
      }
      // Validar tamaño (máximo 2MB)
      if (file.size > 2 * 1024 * 1024) {
        setPasswordError(t('userModal.imageTooLarge'));
        return;
      }
      setPasswordError('');
      setAvatarFile(file);
      
      // Crear preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (userData.clave && userData.clave !== confirmClave) {
      setPasswordError(t('userModal.passwordMismatch'));
      return;
    }
    setPasswordError('');
    setIsSaving(true);
    await onSave({ ...userData, avatarFile });
    setIsSaving(false);
  };

  return (
    <div className="fixed inset-0 bg-gray-800 bg-opacity-50 z-50 flex justify-center items-center p-4">
      <div className="relative bg-white p-6 rounded-lg shadow-xl w-full max-w-md border-l-4 border-blue-500">
        <h2 className="text-xl font-bold mb-1">{t('userModal.titleEdit')}</h2>
        <p className="text-sm text-gray-500 mb-4">{t('userModal.subtitle')}</p>
        <form onSubmit={handleSubmit}>
          {/* Avatar Upload Section */}
          <div className="mb-6 flex flex-col items-center">
            <div className="relative w-24 h-24 mb-3">
              {avatarPreview || userData.avatar_url ? (
                <Image
                  src={avatarPreview || userData.avatar_url || ''}
                  alt={t('userModal.avatarAlt')}
                  width={96}
                  height={96}
                  className="w-24 h-24 rounded-full object-cover border-2 border-gray-300"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center border-2 border-gray-300">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 text-gray-400">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
              )}
            </div>
            <label htmlFor="avatar" className="cursor-pointer bg-blue-500 text-white text-sm font-medium py-2 px-4 rounded hover:bg-blue-600 transition-colors">
              {t('userModal.changeAvatar')}
            </label>
            <input
              type="file"
              id="avatar"
              accept="image/*"
              onChange={handleAvatarChange}
              className="hidden"
            />
          </div>
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