'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import Image from 'next/image';
import { useI18n } from '@/app/i18n-provider';
import type { Usuario } from '@/types/database';

export type UserFormData = Partial<Usuario> & { avatarFile?: File | null };

interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (userData: UserFormData) => Promise<void>;
  user: Partial<Usuario> | null;
  mode?: 'admin' | 'profile';
}

export default function UserModal({ isOpen, onClose, onSave, user, mode = 'admin' }: UserModalProps) {
  const { t } = useI18n();
  const [userData, setUserData] = useState<Partial<Usuario>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [confirmClave, setConfirmClave] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getRoleStyles = useMemo(() => (role: string | null | undefined): { borderClass: string } => {
    switch (role) {
      case 'ADM':
        return {
          borderClass: 'border-blue-500',
        };
      case 'OPE':
        return {
          borderClass: 'border-yellow-500',
        };
      case 'PRE':
      default:
        return {
          borderClass: 'border-green-500',
        };
    }
  }, []);

  useEffect(() => {
    // Aseguramos que los campos nuevos tengan un valor inicial vacío si no existen
    setUserData(user || {
      tipo_usuario: 'PRE',
      ubicacion: '',
      email: '',
      clave: '', // Asegurarse de que la clave esté presente para el estado
    });
    setConfirmClave('');
    setPasswordError('');
    setAvatarFile(null);
    setAvatarPreview(user?.avatar_url || null);
  }, [user]);

  // Determina la clase del borde basada en el tipo de usuario actual en el estado del modal
  const { borderClass } = getRoleStyles(userData.tipo_usuario);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setUserData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validación de contraseña
    if (userData.clave && userData.clave !== confirmClave) {
      setPasswordError(t('userModal.passwordMismatch'));
      return;
    }
    setPasswordError('');

    setIsSaving(true);

    // La lógica de subida de avatar se manejará en el componente padre (layout)
    // para tener acceso al cliente de Supabase.
    await onSave({ ...userData, avatarFile });
    setIsSaving(false);
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-800 bg-opacity-50 z-50 flex justify-center items-center p-4">
      <div className={`relative bg-white p-6 rounded-lg shadow-xl w-full max-w-md border-l-4 transition-all duration-300 ease-in-out ${borderClass}`}>
        <h2 className="text-xl font-bold mb-1 pr-20">{user && user.id ? t('userModal.titleEdit') : t('userModal.titleAdd')}</h2>
        <p className="text-sm text-gray-500 mb-4 pr-20">{t('userModal.subtitle')}</p>
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label htmlFor="id" className="block text-xs font-medium text-gray-600">{t('userModal.idLabel')}</label>
            <input
              type="number"
              name="id"
              id="id"
              value={userData.id || ''}
              onChange={handleChange}
              required
              disabled={mode === 'profile' || !!(user && user.id)}
              placeholder={t('userModal.idPlaceholder')}
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
            <label htmlFor="clave" className="block text-xs font-medium text-gray-600">{user && user.id ? t('userModal.passwordLabelNew') : t('userModal.passwordLabel')}</label>
            <input
              type="password"
              name="clave"
              id="clave"
              value={userData.clave || ''}
              onChange={handleChange}
              required={!(user && user.id)} // La clave es obligatoria solo para usuarios nuevos
              placeholder={user && user.id ? t('userModal.passwordPlaceholderOptional') : t('userModal.passwordPlaceholder')}
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
            <label htmlFor="ubicacion" className="block text-xs font-medium text-gray-600">{t('userModal.locationLabel')}</label>
            <input
              type="text"
              name="ubicacion"
              id="ubicacion"
              value={userData.ubicacion || ''}
              onChange={handleChange}
              disabled={mode === 'profile'}
              placeholder={t('userModal.locationPlaceholder')}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm text-sm disabled:bg-gray-100"
            />
          </div>
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
          </div>
          <div className="mb-8">
            <label htmlFor="tipo_usuario" className="block text-xs font-medium text-gray-600">{t('userModal.userTypeLabel')}</label>
            <select 
              name="tipo_usuario" 
              id="tipo_usuario" 
              value={userData.tipo_usuario || 'PRE'} 
              onChange={handleChange} 
              disabled={mode === 'profile'}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm disabled:bg-gray-100 text-sm">
              <option value="OPE">{t('manageUsers.filterModal.operativo')}</option>
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

        {/* --- Avatar Section --- */}
        <div className="absolute top-6 right-6">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            accept="image/png, image/jpeg, image/webp"
          />
          <button type="button" onClick={handleAvatarClick} className="relative group">
            {avatarPreview ? (
              <Image 
                src={avatarPreview} 
                alt={t('userModal.avatarAlt')} 
                width={64} 
                height={64} 
                className="w-16 h-16 rounded-full object-cover border-2 border-gray-300 group-hover:border-blue-500 transition-colors" 
                // La propiedad unoptimized es necesaria para blob URLs
                unoptimized={avatarPreview.startsWith('blob:')}
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center border-2 border-gray-300 group-hover:border-blue-500 transition-colors"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-gray-400"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg></div>
            )}
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 flex items-center justify-center rounded-full transition-opacity">
              <p className="text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity">{t('userModal.changeAvatar')}</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
