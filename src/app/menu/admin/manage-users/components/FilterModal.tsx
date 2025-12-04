'use client';

import { Fragment, useMemo } from 'react';
import { Dialog, Transition, Listbox } from '@headlessui/react';
import { useI18n } from '@/app/i18n-provider';

interface FilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  filters: {
    id: string;
    responsable: string;
    tipo_usuario: string;
  };
  onFilterChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement> | { target: { name: string, value: string } }) => void;
}

export default function FilterModal({ isOpen, onClose, filters, onFilterChange }: FilterModalProps) {
  const { t } = useI18n();

  const userTypes = useMemo(() => [
    { id: '', name: t('manageUsers.filterModal.allTypes') },
    { id: 'ADM', name: t('manageUsers.filterModal.admin') },
    { id: 'OPE', name: t('manageUsers.filterModal.operativo') },
    { id: 'PRE', name: t('manageUsers.filterModal.owner') },
  ], [t]);

  const selectedUserType = userTypes.find(type => type.id === filters.tipo_usuario) || userTypes[0];

  const handleSelectChange = (value: string) => {
    onFilterChange({ target: { name: 'tipo_usuario', value } });
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
              <Dialog.Panel className="w-full max-w-sm transform rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900">
                  {t('manageUsers.filterModal.title')}
                </Dialog.Title>
                <div className="mt-4 space-y-4">
                  <input name="id" value={filters.id} onChange={onFilterChange} placeholder={t('manageUsers.filterModal.housePlaceholder')} className="w-full p-2 border rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
                  <input name="responsable" value={filters.responsable} onChange={onFilterChange} placeholder={t('manageUsers.filterModal.responsiblePlaceholder')} className="w-full p-2 border rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
                  
                  <Listbox value={selectedUserType.id} onChange={handleSelectChange}>
                    <div className="relative">
                      <Listbox.Button className="relative w-full cursor-default rounded-md border border-gray-300 bg-white py-2 pl-3 pr-10 text-left shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm">
                        <span className="block truncate">{selectedUserType.name}</span>
                        <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-5 w-5 text-gray-400" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 15L12 18.75 15.75 15m-7.5-6L12 5.25 15.75 9" /></svg>
                        </span>
                      </Listbox.Button>
                      <Transition as={Fragment} leave="transition ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0">
                        <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                          {userTypes.map((type) => (
                            <Listbox.Option key={type.id} className={({ active }) => `relative cursor-default select-none py-2 pl-10 pr-4 ${active ? 'bg-indigo-100 text-indigo-900' : 'text-gray-900'}`} value={type.id}>
                              {({ selected }) => (
                                <>
                                  <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>{type.name}</span>
                                  {selected ? <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-indigo-600"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.052-.143z" clipRule="evenodd" /></svg></span> : null}
                                </>
                              )}
                            </Listbox.Option>
                          ))}
                        </Listbox.Options>
                      </Transition>
                    </div>
                  </Listbox>
                </div>

                <div className="mt-6">
                  <button type="button" className="inline-flex justify-center rounded-md border border-transparent bg-blue-100 px-4 py-2 text-sm font-medium text-blue-900 hover:bg-blue-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2" onClick={onClose}>
                    {t('manageUsers.filterModal.close')}
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
