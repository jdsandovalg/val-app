'use client';

import { useState, useEffect, Fragment } from 'react';
import { useI18n } from '@/app/i18n-provider';
import { toast } from 'react-hot-toast';
import { Dialog, Transition, Listbox } from '@headlessui/react';

type Rubro = {
  id_rubro: number;
  nombre: string;
  descripcion: string | null;
  id_categoria: number | null;
};

type RubroCategoria = {
  id_categoria: number;
  nombre: string;
};

type RubroModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<Rubro>) => void | Promise<void>;
  item: Partial<Rubro> | null;
  categorias: RubroCategoria[];
};

export default function RubroModal({ isOpen, onClose, onSave, item, categorias }: RubroModalProps) {
  const { t } = useI18n();
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [selectedCategoria, setSelectedCategoria] = useState<RubroCategoria | null>(null);

  const categoriasConOpcionNula = [{ id_categoria: 0, nombre: t('catalog.placeholders.selectCategory') }, ...categorias];

  useEffect(() => {
    if (isOpen) {
      if (item) {
        setNombre(item.nombre || '');
        setDescripcion(item.descripcion || '');
        const categoria = categorias.find(c => c.id_categoria === item.id_categoria) || null;
        setSelectedCategoria(categoria);
      } else {
        setNombre('');
        setDescripcion('');
        setSelectedCategoria(null);
      }
    }
  }, [item, isOpen, categorias]);

  const handleSubmit = () => {
    if (!nombre) {
      toast.error(t('catalog.alerts.nameRequired'));
      return;
    }
    const dataToSave = {
      ...item,
      nombre,
      descripcion,
      id_categoria: selectedCategoria ? selectedCategoria.id_categoria : null,
    };
    onSave(dataToSave);
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child as={Fragment} enter="ease-out duration-500" enterFrom="opacity-0 -translate-y-10" enterTo="opacity-100 translate-y-0" leave="ease-in duration-200" leaveFrom="opacity-100 translate-y-0" leaveTo="opacity-0 -translate-y-10">
              <Dialog.Panel className="w-full max-w-md transform rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <Dialog.Title as="h3" className="text-lg font-semibold leading-6 text-gray-900 mb-4">
                  {item ? t('catalog.modals.editRubro') : t('catalog.modals.addRubro')}
                </Dialog.Title>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="nombre" className="block text-sm font-medium text-gray-700 mb-1">{t('catalog.fields.name')}</label>
                    <input id="nombre" name="nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
                  </div>
                  <div>
                    <label htmlFor="descripcion" className="block text-sm font-medium text-gray-700 mb-1">{t('projects.fields.details')}</label>
                    <textarea id="descripcion" name="descripcion" value={descripcion} onChange={(e) => setDescripcion(e.target.value)} rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
                  </div>
                  <div>
                    <Listbox value={selectedCategoria} onChange={setSelectedCategoria}>
                      <div className="relative">
                        <Listbox.Label className="block text-sm font-medium text-gray-700 mb-1">{t('catalog.fields.category')}</Listbox.Label>
                        <Listbox.Button className="relative w-full cursor-default rounded-lg bg-white py-2 pl-3 pr-10 text-left border border-gray-300 shadow-sm focus:outline-none focus-visible:border-indigo-500 focus-visible:ring-2 focus-visible:ring-white/75 sm:text-sm">
                          <span className="block truncate">{selectedCategoria ? selectedCategoria.nombre : t('catalog.placeholders.selectCategory')}</span>
                          <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-gray-400"><path fillRule="evenodd" d="M10 3a.75.75 0 01.55.24l3.25 3.5a.75.75 0 11-1.1 1.02L10 4.852 7.3 7.76a.75.75 0 01-1.1-1.02l3.25-3.5A.75.75 0 0110 3zm-3.76 9.24a.75.75 0 011.06.04l2.7 2.908 2.7-2.908a.75.75 0 111.1 1.02l-3.25 3.5a.75.75 0 01-1.1 0l-3.25-3.5a.75.75 0 01.04-1.06z" clipRule="evenodd" /></svg>
                          </span>
                        </Listbox.Button>
                        <Transition as={Fragment} leave="transition ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0">
                          <Listbox.Options className="absolute mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black/5 focus:outline-none sm:text-sm z-10">
                            {categoriasConOpcionNula.map((cat) => (
                              <Listbox.Option key={cat.id_categoria} className={({ active }) => `relative cursor-default select-none py-2 pl-10 pr-4 ${active ? 'bg-amber-100 text-amber-900' : 'text-gray-900'}`} value={cat.id_categoria === 0 ? null : cat}>
                                {({ selected }) => (
                                  <>
                                    <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>{cat.nombre}</span>
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
