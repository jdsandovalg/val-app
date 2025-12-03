import React, { useState, useEffect, Fragment } from 'react';
import { useI18n } from '@/app/i18n-provider';
import { createClient } from '@/utils/supabase/client';
import { Dialog, Transition } from '@headlessui/react';

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
          <div className="fixed inset-50 bg-gray800 bg-opacity-75 transition-opacity" />
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
                    <label htmlFor="filter-house" className="block text-sm font-medium text-gray-700">
                      {t('contributionFilterModal.housePlaceholder')}
                    </label>
                    <select
                      id="filter-house"
                      className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                      value={houseId ?? ''}
                      onChange={(e) => setHouseId(e.target.value ? Number(e.target.value) : null)}
                    >
                      <option value="">{t('contributionFilterModal.housePlaceholder')}</option>
                      {houses.map((house) => (
                        <option key={house.id} value={house.id}>
                          Casa {house.id} - {house.responsable}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="filter-contribution-type" className="block text-sm font-medium text-gray-700">
                      {t('contributionFilterModal.contributionPlaceholder')}
                    </label>
                    <select
                      id="filter-contribution-type"
                      className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                      value={contributionTypeId ?? ''}
                      onChange={(e) => setContributionTypeId(e.target.value ? Number(e.target.value) : null)}
                    >
                      <option value="">{t('contributionFilterModal.contributionPlaceholder')}</option>
                      {contributionTypes.map((type) => (
                        <option key={type.id_contribucion} value={type.id_contribucion}>
                          {type.nombre}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="filter-status" className="block text-sm font-medium text-gray-700">
                      {t('contributionFilterModal.statusPlaceholder')}
                    </label>
                    <select
                      id="filter-status"
                      className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                      value={status}
                      onChange={(e) => setStatus(e.target.value as 'ALL' | 'PAGADO' | 'PENDIENTE' | 'VENCIDO')}
                    >
                      <option value="ALL">{t('contributionFilterModal.statusPlaceholder')}</option>
                      <option value="PAGADO">{t('calendar.status.paid')}</option>
                      <option value="PENDIENTE">{t('calendar.status.pending')}</option>
                      <option value="VENCIDO">{t('calendar.status.overdue')}</option>
                    </select>
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