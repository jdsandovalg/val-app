'use client';

import { useState } from 'react';
import { useI18n } from '@/app/i18n-provider';

import GroupManagement from '../projects_catalogs/GroupManagement';
import TypeManagement from '../projects_catalogs/TypeManagement';
import SupplierManagement from '../projects_catalogs/SupplierManagement';
import RelationshipView from '../projects_catalogs/RelationshipView';
import RubroManagement from '../projects_catalogs/RubroManagement';

export default function ProjectClassificationManagementPage() {
  const { t } = useI18n();
  const [activeView, setActiveView] = useState('overview');

  const views: { [key: string]: { component: React.ReactNode; label: string } } = {
    overview: { component: <RelationshipView onTypeClick={() => {}} />, label: t('catalog.toggle_overview') },
    groups: { component: <GroupManagement />, label: t('catalog.toggle_groups') },
    types: { component: <TypeManagement />, label: t('catalog.toggle_types') },
    suppliers: { component: <SupplierManagement />, label: t('catalog.toggle_suppliers') },
    rubros: { component: <RubroManagement categoryFilter={null} onClearFilter={() => {}} categorias={[]} />, label: t('catalog.toggle_rubros') },
  };

  return (
    <div>
      <div className="rounded-xl border bg-card text-card-foreground shadow">
        <div className="flex flex-col space-y-1.5 p-6">
          <h3 className="font-semibold leading-none tracking-tight">{t('header.admin.catalog_management')}</h3>
        </div>
        <div className="p-6 pt-0">
          <div className="flex justify-center mb-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
              {Object.keys(views).map(key => (
                <button
                  key={key}
                  onClick={() => setActiveView(key)}
                  className={`inline-flex items-center justify-center whitespace-nowrap rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                    activeView === key
                      ? 'bg-gray-900 text-white shadow'
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {views[key].label}
                </button>
              ))}
            </div>
          </div>
          {views[activeView] && views[activeView].component}
        </div>
      </div>
    </div>
  );
}