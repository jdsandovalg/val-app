import React, { useState, useEffect, Fragment } from 'react';
import { useI18n } from '@/app/i18n-provider';
import { createClient } from '@/utils/supabase/client'; // Keep if needed for other fetches
import { Dialog, Transition, Listbox } from '@headlessui/react';
import {
  CheckIcon,
  ChevronUpDownIcon,
  BuildingOffice2Icon,
  TagIcon,
  BoltIcon,
  SparklesIcon,
  ExclamationCircleIcon,
  ClockIcon,
} from '@heroicons/react/20/solid';

type FilterOptions = {
  houseId: number | null;
  contributionTypeId: number | null;
  status: 'ALL' | 'PAGADO' | 'PENDIENTE' | 'VENCIDO';
  dateFrom: string | null;
  dateTo: string | null;
};

type House = {
  id: number;
  responsable: string;
};

type ContributionType = {
  id_contribucion: number;
  nombre: string;
};

type ContributionFilterModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onApplyFilters: (filters: FilterOptions) => void;
  currentFilters: FilterOptions;
  houses: House[];
};

export default function ContributionFilterModal({
  isOpen,
  onClose,
  onApplyFilters,
  currentFilters,
  houses,
}: ContributionFilterModalProps) {
  const { t } = useI18n();
  const supabase = createClient();

  const [houseId, setHouseId] = useState<number | null>(currentFilters.houseId);
  const [contributionTypeId, setContributionTypeId] = useState<number | null>(currentFilters.contributionTypeId);
  const [status, setStatus] = useState<'ALL' | 'PAGADO' | 'PENDIENTE' | 'VENCIDO'>(currentFilters.status);
  const [dateFrom, setDateFrom] = useState<string | null>(currentFilters.dateFrom);
  const [dateTo, setDateTo] = useState<string | null>(currentFilters.dateTo);

  const [contributionTypes, setContributionTypes] = useState<ContributionType[]>([]);

  useEffect(() => {
    const fetchDropdownData = async () => {
      // La lista de casas (houses) se pasa como una propiedad al modal,
      // por lo que NO es necesario ni se debe realizar una consulta a la base de datos aquí
      // para obtener las casas (ej. supabase.from('casas').select(...) o supabase.from('usuarios').select(...)).
      // Fetch contribution types
      const { data: contribTypesData, error: contribTypesError } = await supabase.from('contribuciones').select('id_contribucion, nombre');
      if (contribTypesError) console.error('Error fetching contribution types:', contribTypesError);
      else setContributionTypes(contribTypesData || []);
    };

    if (isOpen) fetchDropdownData();
  }, [isOpen, supabase]);

  const handleApply = () => {
    onApplyFilters({ houseId, contributionTypeId, status, dateFrom, dateTo });
    onClose();
  };

  const handleClear = () => {
    setHouseId(null);
    setContributionTypeId(null);
    setStatus('ALL');
    setDateFrom(null);
    setDateTo(null);
    onApplyFilters({ houseId: null, contributionTypeId: null, status: 'ALL', dateFrom: null, dateTo: null });
    onClose();
  };

  const getContributionIcon = (name: string) => {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('energia')) {
      return <BoltIcon className="h-5 w-5 text-gray-400 mr-2" aria-hidden="true" />;
    }
    if (lowerName.includes('jardin')) {
      return <SparklesIcon className="h-5 w-5 text-gray-400 mr-2" aria-hidden="true" />;
    }
    return <TagIcon className="h-5 w-5 text-gray-400 mr-2" aria-hidden="true" />;
  };

  const statusOptions = [
    { value: 'ALL', label: t('contributionFilterModal.statusPlaceholder'), icon: <ChevronUpDownIcon className="h-5 w-5 text-gray-400 mr-2" /> },
    { value: 'PAGADO', label: t('calendar.status.paid'), icon: <CheckIcon className="h-5 w-5 text-green-500 mr-2" /> },
    { value: 'PENDIENTE', label: t('calendar.status.pending'), icon: <ClockIcon className="h-5 w-5 text-yellow-500 mr-2" /> },
    { value: 'VENCIDO', label: t('calendar.status.overdue'), icon: <ExclamationCircleIcon className="h-5 w-5 text-red-500 mr-2" /> },
  ] as const;

  const getStatusIcon = (statusValue: typeof status) => {
    const option = statusOptions.find(opt => opt.value === statusValue);
    return option ? option.icon : <ChevronUpDownIcon className="h-5 w-5 text-gray-400 mr-2" />;
  };

  const getSelectedContributionName = () => {
    if (!contributionTypeId) return t('contributionFilterModal.contributionPlaceholder');
    const selected = contributionTypes.find(c => c.id_contribucion === contributionTypeId);
    return selected ? selected.nombre : t('contributionFilterModal.contributionPlaceholder');
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
              leave="ease-in duration-300"
              leaveFrom="opacity-100 translate-y-0"
              leaveTo="opacity-0 -translate-y-10"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-lg bg-white p-6 text-left align-middle shadow-xl transition-all">
                <Dialog.Title as="h3" className="text-xl font-bold leading-6 text-gray-900">
                  {t('contributionFilterModal.title')}
                </Dialog.Title>
                <div className="mt-4 space-y-4">
                  <div>
                    <Listbox value={houseId} onChange={setHouseId}>
                      {({ open }) => (
                        <>
                          <Listbox.Label className="block text-sm font-medium text-gray-700">
                            {t('contributionFilterModal.housePlaceholder')}
                          </Listbox.Label>
                          <div className="relative mt-1">
                            <Listbox.Button className="relative w-full cursor-default rounded-md border border-gray-300 bg-white py-2 pl-3 pr-10 text-left shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm">
                              <span className="flex items-center">
                                {houseId && <BuildingOffice2Icon className="h-5 w-5 text-gray-400 mr-2" />}
                                <span className="block truncate">
                                  {houseId
                                    ? `Casa ${
                                        houses.find((h) => h.id === houseId)?.id
                                      } - ${houses.find((h) => h.id === houseId)?.responsable}`
                                    : t('contributionFilterModal.housePlaceholder')}
                                </span>
                              </span>
                              <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                                <ChevronUpDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                              </span>
                            </Listbox.Button>

                            <Transition
                              show={open}
                              as={Fragment}
                              leave="transition ease-in duration-100"
                              leaveFrom="opacity-100"
                              leaveTo="opacity-0"
                            >
                              <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                                <Listbox.Option
                                  className={({ active }) =>
                                    `relative cursor-default select-none py-2 pl-10 pr-4 ${
                                      active ? 'bg-indigo-600 text-white' : 'text-gray-900'
                                    }`
                                  }
                                  value={null}
                                >
                                  {({ selected, active }) => (
                                    <>
                                      <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>
                                        {t('contributionFilterModal.housePlaceholder')}
                                      </span>
                                      {selected ? (
                                        <span className={`absolute inset-y-0 left-0 flex items-center pl-3 ${active ? 'text-white' : 'text-indigo-600'}`}>
                                          <CheckIcon className="h-5 w-5" aria-hidden="true" />
                                        </span>
                                      ) : null}
                                    </>
                                  )}
                                </Listbox.Option>
                                {houses.map((house) => (
                                  <Listbox.Option
                                    key={house.id}
                                    className={({ active }) =>
                                      `relative cursor-default select-none py-2 pl-10 pr-4 ${
                                        active ? 'bg-indigo-600 text-white' : 'text-gray-900'
                                      }`
                                    }
                                    value={house.id}
                                  >
                                    {({ selected, active }) => (
                                      <>
                                        <div className="flex items-center">
                                          <BuildingOffice2Icon className={`h-5 w-5 mr-2 ${active ? 'text-white' : 'text-gray-400'}`} />
                                          <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>
                                            Casa {house.id} - {house.responsable}
                                          </span>
                                        </div>
                                        {selected ? (
                                          <span className={`absolute inset-y-0 left-0 flex items-center pl-3 ${active ? 'text-white' : 'text-indigo-600'}`}>
                                            <CheckIcon className="h-5 w-5" aria-hidden="true" />
                                          </span>
                                        ) : null}
                                      </>
                                    )}
                                  </Listbox.Option>
                                ))}
                              </Listbox.Options>
                            </Transition>
                          </div>
                        </>
                      )}
                    </Listbox>
                  </div>
                  <div>
                    <Listbox value={contributionTypeId} onChange={setContributionTypeId}>
                      <Listbox.Label className="block text-sm font-medium text-gray-700">
                        {t('contributionFilterModal.contributionPlaceholder')}
                      </Listbox.Label>
                      <div className="relative mt-1">
                        <Listbox.Button className="relative w-full cursor-default rounded-md border border-gray-300 bg-white py-2 pl-3 pr-10 text-left shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm">
                          <span className="flex items-center">
                            {contributionTypeId && getContributionIcon(getSelectedContributionName())}
                            <span className="block truncate">{getSelectedContributionName()}</span>
                          </span>
                          <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                            <ChevronUpDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                          </span>
                        </Listbox.Button>
                        <Transition as={Fragment} leave="transition ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0">
                          <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                            <Listbox.Option className={({ active }) => `relative cursor-default select-none py-2 pl-10 pr-4 ${active ? 'bg-indigo-600 text-white' : 'text-gray-900'}`} value={null}>
                              {({ selected }) => <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>{t('contributionFilterModal.contributionPlaceholder')}</span>}
                            </Listbox.Option>
                            {contributionTypes.map((type) => (
                              <Listbox.Option key={type.id_contribucion} className={({ active }) => `relative cursor-default select-none py-2 pl-10 pr-4 ${active ? 'bg-indigo-600 text-white' : 'text-gray-900'}`} value={type.id_contribucion}>
                                {({ selected }) => (
                                  <>
                                    <div className="flex items-center">
                                      {getContributionIcon(type.nombre)}
                                      <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>{type.nombre}</span>
                                    </div>
                                    {selected ? <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-indigo-600"><CheckIcon className="h-5 w-5" aria-hidden="true" /></span> : null}
                                  </>
                                )}
                              </Listbox.Option>
                            ))}
                          </Listbox.Options>
                        </Transition>
                      </div>
                    </Listbox>
                  </div>
                  <div>
                    <Listbox value={status} onChange={setStatus}>
                      <Listbox.Label className="block text-sm font-medium text-gray-700">
                        {t('contributionFilterModal.statusPlaceholder')}
                      </Listbox.Label>
                      <div className="relative mt-1">
                        <Listbox.Button className="relative w-full cursor-default rounded-md border border-gray-300 bg-white py-2 pl-3 pr-10 text-left shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm">
                          <span className="flex items-center">
                            {getStatusIcon(status)}
                            <span className="block truncate">
                              {statusOptions.find(opt => opt.value === status)?.label}
                            </span>
                          </span>
                          <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                            <ChevronUpDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                          </span>
                        </Listbox.Button>
                        <Transition as={Fragment} leave="transition ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0">
                          <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                            {statusOptions.map((option) => (
                              <Listbox.Option
                                key={option.value}
                                className={({ active }) => `relative cursor-default select-none py-2 pl-10 pr-4 ${active ? 'bg-indigo-600 text-white' : 'text-gray-900'}`}
                                value={option.value}
                              >
                                {({ selected }) => (
                                  <>
                                    <div className="flex items-center">
                                      {option.icon}
                                      <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>{option.label}</span>
                                    </div>
                                    {selected ? <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-indigo-600"><CheckIcon className="h-5 w-5" aria-hidden="true" /></span> : null}
                                  </>
                                )}
                              </Listbox.Option>
                            ))}
                          </Listbox.Options>
                        </Transition>
                      </div>
                    </Listbox>
                  </div>
                  <div>
                    <label htmlFor="filter-date-from" className="block text-sm font-medium text-gray-700">
                      {t('contributionFilterModal.datePlaceholder')} (Desde)
                    </label>
                    <input
                      type="date"
                      id="filter-date-from"
                      className="mt-1 block w-full pl-3 pr-3 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                      value={dateFrom ?? ''}
                      onChange={(e) => setDateFrom(e.target.value || null)}
                    />
                  </div>
                  <div>
                    <label htmlFor="filter-date-to" className="block text-sm font-medium text-gray-700">
                      {t('contributionFilterModal.datePlaceholder')} (Hasta)
                    </label>
                    <input
                      type="date"
                      id="filter-date-to"
                      className="mt-1 block w-full pl-3 pr-3 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                      value={dateTo ?? ''}
                      onChange={(e) => setDateTo(e.target.value || null)}
                    />
                  </div>
                </div>

                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={handleClear}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                  >
                    {t('catalog.buttons.clearFilter')}
                  </button>
                  <button
                    type="button"
                    onClick={handleApply}
                    className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    {t('common.confirmButton')}
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    {t('userModal.cancelButton')}
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