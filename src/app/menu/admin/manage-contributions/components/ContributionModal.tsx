'use client';

import { useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import type { Contribuciones } from '@/types/database';
import { useI18n } from '@/app/i18n-provider';
import { toast } from 'react-hot-toast';
import ContributionModalForm from './ContributionModalForm';

interface ContributionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<Contribuciones>) => void;
  contribucion: Partial<Contribuciones> | null;
}

export default function ContributionModal({ isOpen, onClose, onSave, contribucion }: ContributionModalProps) {
  const { t } = useI18n();

  const handleClose = () => {
    onClose();
  };

  const handleSave = async (formData: Partial<Contribuciones>) => {
    try {
      await onSave(formData);
      onClose();
    } catch (error: any) {
      toast.error(error.message || 'Error al guardar');
    }
  };

  return (
    <Transition appear show={isOpen} as="div">
      <Dialog as="div" className="relative z-50" onClose={handleClose}>
        {/* Overlay con blur — igual que UserModal */}
        <Transition.Child
          as="div"
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" />
        </Transition.Child>

        {/* Contenedor centrado */}
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Transition.Child
            as="div"
            enter="ease-out duration-300"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <Dialog.Panel className="bg-white rounded-lg shadow-xl w-full max-w-md">
              <ContributionModalForm
                contribucion={contribucion}
                onSave={handleSave}
                onClose={handleClose}
                t={t}
              />
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition>
  );
}
