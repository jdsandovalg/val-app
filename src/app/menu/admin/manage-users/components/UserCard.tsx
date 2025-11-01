'use client';

import Image from 'next/image';
import type { Usuario } from '@/types/database';
import { useI18n } from '@/app/i18n-provider';

interface UserCardProps {
  user: Usuario;
  onDelete: (user: Usuario) => void;
  onOpenModal: (user: Usuario) => void;
}

export default function UserCard({ user, onDelete, onOpenModal }: UserCardProps) {
  const { t } = useI18n();

  const getRoleStyles = (role: string | null | undefined) => {
    switch (role) {
      case 'ADM':
        return {
          text: t('manageUsers.filterModal.admin'),
          badgeClasses: 'bg-blue-100 text-blue-800',
          borderClass: 'border-blue-500',
        };
      case 'OPE':
        return {
          text: t('manageUsers.filterModal.operativo'),
          badgeClasses: 'bg-yellow-100 text-yellow-800',
          borderClass: 'border-yellow-500',
        };
      default: // PRE
        return {
          text: t('manageUsers.filterModal.owner'),
          badgeClasses: 'bg-green-100 text-green-800',
          borderClass: 'border-green-500',
        };
    }
  };

  const { text: userType, badgeClasses, borderClass } = getRoleStyles(user.tipo_usuario);

  return (
    <div className={`bg-white shadow-md rounded-lg p-4 mb-4 border-l-4 ${borderClass}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {user.avatar_url ? (
            <Image
              src={user.avatar_url}
              alt={t('userModal.avatarAlt')}
              width={48}
              height={48}
              className="w-12 h-12 rounded-full object-cover"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-gray-400"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>
            </div>
          )}
          <div>
            <p className="font-bold text-gray-800">{t('groups.house')} #{user.id}</p>
            <p className="text-sm text-gray-600">{user.responsable}</p>
            {user.email && <p className="text-xs text-gray-500">{user.email}</p>}
          </div>
        </div>
        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${badgeClasses}`}>
          {userType}
        </span>
      </div>
      <div className="mt-4 pt-4 border-t border-gray-200 flex justify-end gap-3">
        <button onClick={() => onOpenModal(user)} className="text-indigo-600 hover:text-indigo-900 text-sm font-medium">{t('userModal.titleEdit')}</button>
        <button onClick={() => onDelete(user)} className="text-red-600 hover:text-red-900 text-sm font-medium">
          {t('manageUsers.card.delete')}
        </button>
      </div>
    </div>
  );
}
