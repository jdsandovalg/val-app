'use client';

import { useState, useEffect, useCallback } from 'react';
import { useI18n } from '@/app/i18n-provider';
import { createClient } from '@/utils/supabase/client';
import GroupManagement from './GroupManagement';
import TypeManagement from './TypeManagement';
import SupplierManagement from './SupplierManagement';
import RelationshipView from './RelationshipView';
import RubroManagement from './RubroManagement';
import RubroCategoryManagement from './RubroCategoryManagement';
import { toast } from 'react-hot-toast';

export default function ProjectClassificationManagementPage() {
  const { t } = useI18n();
  const [activeView, setActiveView] = useState('overview');
  const [categoryFilter, setCategoryFilter] = useState<number | null>(null);
  const [rubroCategorias, setRubroCategorias] = useState<{ id_categoria: number; nombre: string }[]>([]);
  const supabase = createClient();

  const fetchRubroCategorias = useCallback(async () => {
    try {
      const { data, error } = await supabase.rpc('fn_get_rubro_categorias');
      if (error) throw error;
      setRubroCategorias(data || []);
    } catch (error: unknown) {
      let errorMessage = t('calendar.payment.unknownError');
      if (typeof error === 'object' && error !== null && 'message' in error) {
        errorMessage = (error as { message: string }).message;
      }
      toast.error(t('catalog.alerts.fetchError', { entity: t('catalog.rubro_categories'), message: errorMessage }));
    }
  }, [supabase, t]);

  useEffect(() => {
    fetchRubroCategorias();
  }, [fetchRubroCategorias]);

  const handleCategoryClick = (category: { id_categoria: number }) => {
    setCategoryFilter(category.id_categoria);
    setActiveView('rubros');
  };

  const handleClearFilter = () => {
    setCategoryFilter(null);
    setActiveView('rubro_categories');
  };

  const views: { [key: string]: { component: React.ReactNode; label: string } } = {
    overview: { component: <RelationshipView onTypeClick={() => {}} />, label: t('catalog.toggle_overview') }, // 1
    suppliers: { component: <SupplierManagement />, label: t('catalog.toggle_suppliers') }, // 2
    groups: { component: <GroupManagement />, label: t('catalog.toggle_groups') }, // 3
    types: { component: <TypeManagement />, label: t('catalog.toggle_types') }, // 4
    rubro_categories: { component: <RubroCategoryManagement onCardClick={handleCategoryClick} />, label: t('catalog.toggle_rubro_categories') }, // 5
    rubros: { component: <RubroManagement categoryFilter={categoryFilter} onClearFilter={handleClearFilter} categorias={rubroCategorias} />, label: t('catalog.toggle_rubros') }, // 6
  };

  return (
    <div>
      <div className="rounded-xl border bg-card text-card-foreground shadow">
        <div className="flex flex-col space-y-1.5 p-6">
          <h3 className="font-semibold leading-none tracking-tight">{t('header.admin.catalog_management')}</h3>
        </div>
        <div className="p-6 pt-0">
          <div className="flex justify-center mb-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
              {Object.keys(views).map(key => (
                <button key={key} onClick={() => setActiveView(key)} className={`inline-flex items-center justify-center whitespace-nowrap rounded-md px-4 py-2 text-sm font-medium transition-colors ${ activeView === key ? 'bg-gray-900 text-white shadow' : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50' }`}>
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