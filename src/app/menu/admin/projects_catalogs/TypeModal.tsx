'use client';

import { useState, useEffect, Fragment } from 'react';
import { useI18n } from '@/app/i18n-provider';
import { toast } from 'react-hot-toast';
import { Dialog, Transition, Listbox } from '@headlessui/react';

type TipoProyecto = {
  id_tipo: number;
  nombre_tipo: string;
  id_grupo: number;
};

type GrupoMantenimiento = {
  id_grupo: number;
  nombre_grupo: string;
  orden: number;
};

type TypeModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSave: (type: Partial<TipoProyecto>) => void | Promise<void>;
  item: Partial<TipoProyecto> | null;
  groups: GrupoMantenimiento[];
};

export default function TypeModal({ isOpen, onClose, onSave, item, groups }: TypeModalProps) {
  const { t } = useI18n();
  const [nombreTipo, setNombreTipo] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<GrupoMantenimiento | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (item) {
        setNombreTipo(item.nombre_tipo || '');
        const group = groups.find(g => g.id_grupo === item.id_grupo) || null;
        setSelectedGroup(group);
      } else {
        setNombreTipo('');
        setSelectedGroup(groups.length > 0 ? groups[0] : null);
      }
    }
  }, [item, isOpen, groups]);

  const handleSubmit = () => {
    if (!nombreTipo || !selectedGroup) {
      toast.error(t('catalog.alerts.allFieldsRequired'));
      return;
    }
    onSave({ ...item, nombre_tipo: nombreTipo, id_grupo: selectedGroup.id_grupo });
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
              enter="ease-out duration-500"
              enterFrom="opacity-0 -translate-y-10"
              enterTo="opacity-100 translate-y-0"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0"
              leaveTo="opacity-0 -translate-y-10"
            >
              <Dialog.Panel className="w-full max-w-md transform rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <Dialog.Title as="h3" className="text-lg font-semibold leading-6 text-gray-900 mb-4">
                  {item ? t('catalog.modals.editType') : t('catalog.modals.addType')}
                </Dialog.Title>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="nombre_tipo" className="block text-sm font-medium text-gray-700 mb-1">{t('catalog.fields.name')}</label>
                    <input id="nombre_tipo" name="nombre_tipo" value={nombreTipo} onChange={(e) => setNombreTipo(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
                  </div>
                  <div>
                    <Listbox value={selectedGroup} onChange={setSelectedGroup}>
                      <div className="relative">
                        <Listbox.Label className="block text-sm font-medium text-gray-700 mb-1">{t('catalog.fields.group')}</Listbox.Label>
                        <Listbox.Button className="relative w-full cursor-default rounded-lg bg-white py-2 pl-3 pr-10 text-left border border-gray-300 shadow-sm focus:outline-none focus-visible:border-indigo-500 focus-visible:ring-2 focus-visible:ring-white/75 focus-visible:ring-offset-2 focus-visible:ring-offset-orange-300 sm:text-sm">
                          <span className="block truncate">{selectedGroup ? selectedGroup.nombre_grupo : t('catalog.placeholders.selectGroup')}</span>
                          <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-gray-400"><path fillRule="evenodd" d="M10 3a.75.75 0 01.55.24l3.25 3.5a.75.75 0 11-1.1 1.02L10 4.852 7.3 7.76a.75.75 0 01-1.1-1.02l3.25-3.5A.75.75 0 0110 3zm-3.76 9.24a.75.75 0 011.06.04l2.7 2.908 2.7-2.908a.75.75 0 111.1 1.02l-3.25 3.5a.75.75 0 01-1.1 0l-3.25-3.5a.75.75 0 01.04-1.06z" clipRule="evenodd" /></svg>
                          </span>
                        </Listbox.Button>
                        <Transition as={Fragment} leave="transition ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0">
                          <Listbox.Options className="absolute mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black/5 focus:outline-none sm:text-sm z-10">
                            {groups.map((group) => (
                              <Listbox.Option key={group.id_grupo} className={({ active }) => `relative cursor-default select-none py-2 pl-10 pr-4 ${active ? 'bg-amber-100 text-amber-900' : 'text-gray-900'}`} value={group}>
                                {({ selected }) => (
                                  <>
                                    <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>{group.nombre_grupo}</span>
                                    {selected ? (
                                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-amber-600">
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.052-.143z" clipRule="evenodd" /></svg>
                                      </span>
                                    ) : null}
                                  </>
                                )}
                              </Listbox.Option>
                            ))}
                          </Listbox.Options>
                        </Transition>
                      </div>
                    </Listbox>
                  </div>
                </div>
                <div className="mt-6 flex justify-end space-x-2">
                  <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200">{t('userModal.cancelButton')}</button>
                  <button type="button" onClick={handleSubmit} className="px-4 py-2 text-sm font-medium text-white bg-gray-800 border border-transparent rounded-md hover:bg-gray-900">{t('userModal.saveButton')}</button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
