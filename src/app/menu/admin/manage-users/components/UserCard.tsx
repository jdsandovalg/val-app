'use client';

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
      <div className="flex justify-between items-start">
        <div>
          <p className="font-bold text-gray-800">{t('groups.house')} #{user.id}</p>
          <p className="text-sm text-gray-600">{user.responsable}</p>
          {user.ubicacion && <p className="text-xs text-gray-500 mt-1">{t('userModal.locationLabel')}: {user.ubicacion}</p>}
          {user.email && <p className="text-xs text-gray-500">{t('userModal.emailLabel')}: {user.email}</p>}
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
