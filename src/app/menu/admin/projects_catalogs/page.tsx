'use client';

import { useState } from 'react';
import { useI18n } from '@/app/i18n-provider';
import GroupManagement from './GroupManagement';
import TypeManagement from './TypeManagement';
import SupplierManagement from './SupplierManagement';
import RelationshipView from './RelationshipView';

export default function ProjectClassificationManagementPage() {
  const { t } = useI18n();
  const [activeView, setActiveView] = useState('overview');

  return (
    <div>
      <div className="rounded-xl border bg-card text-card-foreground shadow">
        <div className="flex flex-col space-y-1.5 p-6">
          <h3 className="font-semibold leading-none tracking-tight">{t('header.admin.project_classification_management')}</h3>
        </div>
        <div className="p-6 pt-0">
          <div className="flex justify-center mb-6">
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setActiveView('groups')}
                className={`inline-flex items-center justify-center whitespace-nowrap rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                  activeView === 'groups' ? 'bg-gray-900 text-white shadow' : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                {t('catalog.toggle_groups')}
              </button>
              <button
                onClick={() => setActiveView('types')}
                className={`inline-flex items-center justify-center whitespace-nowrap rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                  activeView === 'types' ? 'bg-gray-900 text-white shadow' : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                {t('catalog.toggle_types')}
              </button>
              <button
                onClick={() => setActiveView('suppliers')}
                className={`inline-flex items-center justify-center whitespace-nowrap rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                  activeView === 'suppliers' ? 'bg-gray-900 text-white shadow' : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                {t('catalog.toggle_suppliers')}
              </button>
              <button
                onClick={() => setActiveView('overview')}
                className={`inline-flex items-center justify-center whitespace-nowrap rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                  activeView === 'overview' ? 'bg-gray-900 text-white shadow' : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                {t('catalog.toggle_overview')}
              </button>
            </div>
          </div>
          {activeView === 'groups' && <GroupManagement />}
          {activeView === 'types' && <TypeManagement />}
          {activeView === 'suppliers' && <SupplierManagement />}
          {activeView === 'overview' && <RelationshipView />}
        </div>
      </div>
    </div>
  );
}