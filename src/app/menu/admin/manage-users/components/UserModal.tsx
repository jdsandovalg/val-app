'use client';

import { ShieldCheck, Wrench, Home } from 'lucide-react';
import { useState, useEffect, useMemo, useRef, Fragment } from 'react';
import { Dialog, Transition, Listbox } from '@headlessui/react';
import Image from 'next/image';
import { useI18n } from '@/app/i18n-provider';
import type { Usuario } from '@/types/database';

export type UserFormData = Partial<Usuario> & { avatarFile?: File | null };

interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (userData: UserFormData) => Promise<void>;
  user: Partial<Usuario> | null;
  currentUserRole?: string;
}

export default function UserModal({ isOpen, onClose, onSave, user, currentUserRole }: UserModalProps) {
  const { t } = useI18n();
  const [userData, setUserData] = useState<Partial<Usuario>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [confirmClave, setConfirmClave] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const userTypes = useMemo(() => [
    { id: 'PRE', name: t('manageUsers.filterModal.owner'), icon: Home },
    { id: 'OPE', name: t('manageUsers.filterModal.operativo'), icon: Wrench },
    { id: 'ADM', name: t('manageUsers.filterModal.admin'), icon: ShieldCheck },
  ], [t]);

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
  }, [user, currentUserRole]);

  // Determina la clase del borde basada en el tipo de usuario actual en el estado del modal
  const { borderClass } = getRoleStyles(userData.tipo_usuario);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setUserData(prev => ({ ...prev, [name]: value }));
  };

  const handleUserTypeChange = (value: string) => {
    setUserData(prev => ({ ...prev, tipo_usuario: value }));
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
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className={`relative bg-white p-6 rounded-lg shadow-xl w-full max-w-md border-l-4 transition-all duration-300 ease-in-out ${borderClass}`}>
                <Dialog.Title as="h2" className="text-xl font-bold mb-1 pr-20">
                  {user && user.id ? t('userModal.titleEdit') : t('userModal.titleAdd')}
                </Dialog.Title>
                <p className="text-sm text-gray-500 mb-4 pr-20">{t('userModal.subtitle')}</p>
                <form onSubmit={handleSubmit}>
                  {/* Contenedor para alinear los campos del formulario */}
                  <div className="grid grid-cols-1 gap-y-3">
                    <div className="mb-3">
                      <label htmlFor="id" className="block text-xs font-medium text-gray-600">{t('userModal.idLabel')}</label>
                      <input
                        type="number"
                        name="id"
                        id="id"
                        value={userData.id || ''}
                        onChange={handleChange}
                        required
                        disabled={!!(user && user.id)}
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
                        disabled={currentUserRole !== 'ADM'}
                        placeholder={t('userModal.locationPlaceholder')}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
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
                      <Listbox value={userData.tipo_usuario || 'PRE'} onChange={handleUserTypeChange} disabled={currentUserRole !== 'ADM'}>
                        <Listbox.Label className="block text-xs font-medium text-gray-600 text-left">{t('userModal.userTypeLabel')}</Listbox.Label>
                        <div className="relative mt-1">
                          <Listbox.Button className="relative w-full cursor-default rounded-md border border-gray-300 bg-white py-2 pl-3 pr-10 text-left shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed">
                            <span className="flex items-center">
                              {(() => {
                                const selectedType = userTypes.find(type => type.id === (userData.tipo_usuario || 'PRE'));
                                if (!selectedType) return null;
                                const Icon = selectedType.icon;
                                return <><Icon className="h-5 w-5 mr-2 text-gray-500" aria-hidden="true" /> <span className="block truncate">{selectedType.name}</span></>;
                              })()}
                            </span>
                            <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-5 w-5 text-gray-400" aria-hidden="true">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 15L12 18.75 15.75 15m-7.5-6L12 5.25 15.75 9" />
                              </svg>
                            </span>
                          </Listbox.Button>
                          <Transition
                            as={Fragment}
                            leave="transition ease-in duration-100"
                            leaveFrom="opacity-100"
                            leaveTo="opacity-0"
                          >
                            <Listbox.Options className="absolute mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                              {userTypes.map((type) => (
                                <Listbox.Option key={type.id} className={({ active }) => `relative cursor-default select-none py-2 pl-10 pr-4 ${active ? 'bg-indigo-100 text-indigo-900' : 'text-gray-900'}`} value={type.id}>
                                  {({ selected, active }) => {
                                    const Icon = type.icon;
                                    return (
                                      <>
                                        <span className={`flex items-center ${selected ? 'font-medium' : 'font-normal'}`}>
                                          <Icon className={`h-5 w-5 mr-2 ${active ? 'text-indigo-600' : 'text-gray-500'}`} aria-hidden="true" />
                                          {type.name}
                                        </span>
                                        {selected ? (
                                          <span className={`absolute inset-y-0 left-0 flex items-center pl-3 ${active ? 'text-indigo-600' : 'text-indigo-600'}`}>
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.052-.143z" clipRule="evenodd" /></svg>
                                          </span>
                                        ) : null}
                                      </>
                                    );
                                  }}
                                </Listbox.Option>
                              ))}
                            </Listbox.Options>
                          </Transition>
                        </div>
                      </Listbox>
                    </div>
                    <div className="flex justify-end gap-4">
                      <button type="button" onClick={onClose} className="bg-gray-200 text-gray-800 font-bold py-2 px-4 rounded hover:bg-gray-300">{t('userModal.cancelButton')}</button>
                      <button type="submit" disabled={isSaving} className="bg-blue-500 text-white font-bold py-2 px-4 rounded hover:bg-blue-700 disabled:bg-gray-400">
                        {isSaving ? `${t('userModal.saveButton')}...` : t('userModal.saveButton')}
                      </button>
                    </div>
                  </div>
                </form>

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
                        unoptimized={avatarPreview.startsWith('blob:')}
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center border-2 border-gray-300 group-hover:border-blue-500 transition-colors"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-gray-400"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg></div>
                    )}
                    {avatarFile && (
                        <div className="absolute -top-1 -right-1 transform">
                          <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center border-2 border-white">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                          </div>
                        </div>
                    )}
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 flex items-center justify-center rounded-full transition-opacity">
                      <p className="text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity">{t('userModal.changeAvatar')}</p>
                    </div>
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
