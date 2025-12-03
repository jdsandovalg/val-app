import React, { useState, useEffect } from 'react';
import { useI18n } from '@/app/i18n-provider';
import { createClient } from '@/utils/supabase/client';

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
};

export default function ContributionFilterModal({
  isOpen,
  onClose,
  onApplyFilters,
  currentFilters,
}: ContributionFilterModalProps) {
  const { t } = useI18n();
  const supabase = createClient();

  const [houseId, setHouseId] = useState<number | null>(currentFilters.houseId);
  const [contributionTypeId, setContributionTypeId] = useState<number | null>(currentFilters.contributionTypeId);
  const [status, setStatus] = useState<'ALL' | 'PAGADO' | 'PENDIENTE' | 'VENCIDO'>(currentFilters.status);
  const [dateFrom, setDateFrom] = useState<string | null>(currentFilters.dateFrom);
  const [dateTo, setDateTo] = useState<string | null>(currentFilters.dateTo);

  const [houses, setHouses] = useState<House[]>([]);
  const [contributionTypes, setContributionTypes] = useState<ContributionType[]>([]);

  useEffect(() => {
    const fetchDropdownData = async () => {
      // Fetch houses
      const { data: housesData, error: housesError } = await supabase.from('casas').select('id, responsable');
      if (housesError) console.error('Error fetching houses:', housesError);
      else setHouses(housesData || []);

      // Fetch contribution types
      const { data: contribTypesData, error: contribTypesError } = await supabase.from('contribuciones').select('id_contribucion, nombre');
      if (contribTypesError) console.error('Error fetching contribution types:', contribTypesError);
      else setContributionTypes(contribTypesData || []);
    };

    if (isOpen) {
      fetchDropdownData();
    }
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">{t('contributionFilterModal.title')}</h2>
        <div className="space-y-4">
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
      </div>
    </div>
  );
}
