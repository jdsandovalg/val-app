import { Fragment } from 'react';
import { Menu, Transition } from '@headlessui/react';
import { useI18n } from '@/app/i18n-provider';
import type { SortableKeys } from '@/types';

interface PageHeaderProps {
  onAdd: () => void;
  onUploadClick: () => void;
  onExportPdf: () => void;
  onExportCards: () => void;
  onFilterClick: () => void;
  onSort: (key: SortableKeys) => void;
  isUploading: boolean;
  isLoading: boolean;
}

export default function PageHeader({
  onAdd,
  onUploadClick,
  onExportPdf,
  onExportCards,
  onFilterClick,
  onSort,
  isUploading,
  isLoading
}: PageHeaderProps) {
  const { t } = useI18n();

  return (
    <div className="flex justify-between items-center">
      <h1 className="text-xl font-bold text-gray-800">{t('manageContributions.title')}</h1>

      {/* Contenedor de Acciones - Gap reducido a 0.5 para máxima proximidad en móvil */}
      <div className="relative flex items-center gap-0.0">
        {/* Botón de Filtros */}
        <button
          onClick={onFilterClick}
          className="p-1.5 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-400"
          aria-label={t('manageContributions.ariaLabels.openFilters')}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 md:w-6 md:h-6 text-gray-700">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 01-.659 1.591l-5.432 5.432a2.25 2.25 0 00-.659 1.591v2.927a2.25 2.25 0 01-1.244 2.013L9.75 21v-6.572a2.25 2.25 0 00-.659-1.591L3.659 7.409A2.25 2.25 0 013 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0112 3z" />
          </svg>
        </button>

        {/* Menú de Ordenamiento */}
        <Menu as="div" className="relative">
          <Menu.Button
            className="p-1.5 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-400"
            aria-label={t('manageContributions.ariaLabels.openSortMenu')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 md:w-6 md:h-6 text-gray-700">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 7.5L7.5 3m0 0L12 7.5M7.5 3v13.5m13.5 0L16.5 21m0 0L12 16.5m4.5 4.5V7.5" />
            </svg>
          </Menu.Button>
          <Transition
            as={Fragment}
            enter="transition ease-out duration-100"
            enterFrom="transform opacity-0 scale-95"
            enterTo="transform opacity-100 scale-100"
            leave="transition ease-in duration-75"
            leaveFrom="transform opacity-100 scale-100"
            leaveTo="transform opacity-0 scale-95"
          >
            <Menu.Items className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border border-gray-200 focus:outline-none">
              <div className="py-1">
                <Menu.Item>{({ active }) => <button onClick={() => onSort('fecha')} className={`${active ? 'bg-gray-100' : ''} w-full text-left px-4 py-2 text-sm text-gray-700`}>{t('manageContributions.sortMenu.byDate')}</button>}</Menu.Item>
                <Menu.Item>{({ active }) => <button onClick={() => onSort('usuarios')} className={`${active ? 'bg-gray-100' : ''} w-full text-left px-4 py-2 text-sm text-gray-700`}>{t('manageContributions.sortMenu.byHouse')}</button>}</Menu.Item>
                <Menu.Item>{({ active }) => <button onClick={() => onSort('contribuciones')} className={`${active ? 'bg-gray-100' : ''} w-full text-left px-4 py-2 text-sm text-gray-700`}>{t('manageContributions.sortMenu.byContribution')}</button>}</Menu.Item>
                <Menu.Item>{({ active }) => <button onClick={() => onSort('realizado')} className={`${active ? 'bg-gray-100' : ''} w-full text-left px-4 py-2 text-sm text-gray-700`}>{t('manageContributions.sortMenu.byStatus')}</button>}</Menu.Item>
                <Menu.Item>{({ active }) => <button onClick={() => onSort('ubicacion')} className={`${active ? 'bg-gray-100' : ''} w-full text-left px-4 py-2 text-sm text-gray-700`}>{t('contributionReport.headerLocation')}</button>}</Menu.Item>
              </div>
            </Menu.Items>
          </Transition>
        </Menu>

        {/* Menú de Acciones */}
        <Menu as="div" className="relative">
          <Menu.Button className="p-1.5 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-400">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-gray-700">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 12.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 18.75a.75.75 0 110-1.5.75.75 0 010 1.5z" />
            </svg>
          </Menu.Button>
          <Transition
            as={Fragment}
            enter="transition ease-out duration-100"
            enterFrom="transform opacity-0 scale-95"
            enterTo="transform opacity-100 scale-100"
            leave="transition ease-in duration-75"
            leaveFrom="transform opacity-100 scale-100"
            leaveTo="transform opacity-0 scale-95"
          >
            <Menu.Items className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg z-10 border border-gray-200 focus:outline-none">
              <div className="py-1">
                <Menu.Item>
                  {({ active }) => (
                    <button onClick={onAdd} className={`${active ? 'bg-gray-100' : ''} w-full text-left px-4 py-2 text-sm text-gray-700 flex items-center gap-3`} disabled={isUploading}>
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                      {t('manageContributions.actionsMenu.addNew')}
                    </button>
                  )}
                </Menu.Item>
                <Menu.Item>
                  {({ active }) => (
                    <button onClick={onUploadClick} className={`${active ? 'bg-gray-100' : ''} w-full text-left px-4 py-2 text-sm text-gray-700 flex items-center gap-3`} disabled={isLoading || isUploading}>
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" /></svg>
                      {isUploading ? t('manageContributions.actionsMenu.processing') : t('manageContributions.actionsMenu.uploadCsv')}
                    </button>
                  )}
                </Menu.Item>
                <Menu.Item>
                  {({ active }) => (
                    <button onClick={onExportPdf} className={`${active ? 'bg-gray-100' : ''} w-full text-left px-4 py-2 text-sm text-gray-700 flex items-center gap-3`} disabled={isLoading || isUploading}>
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>
                      {t('manageContributions.actionsMenu.pdfReport')}
                    </button>
                  )}
                </Menu.Item>
                <Menu.Item>
                  {({ active }) => (
                    <button onClick={onExportCards} className={`${active ? 'bg-gray-100' : ''} w-full text-left px-4 py-2 text-sm text-gray-700 flex items-center gap-3`} disabled={isLoading || isUploading}>
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75l3 3m0 0l3-3m-3 3v-7.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      {t('manageContributions.actionsMenu.pdfCardReport')}
                    </button>
                  )}
                </Menu.Item>
              </div>
            </Menu.Items>
          </Transition>
        </Menu>
      </div>
    </div>
  );
}
