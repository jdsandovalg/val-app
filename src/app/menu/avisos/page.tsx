'use client';

/**
 * @file /src/app/menu/avisos/page.tsx
 * @fileoverview Página de avisos categorizados.
 * @description Muestra todos los compromisos de pago pendientes del usuario, organizados en pestañas
 * según su urgencia: Próximos (0-30 días), Medio Plazo (31-180 días) y Largo Plazo (181+ días).
 *
 * @accesible_desde Menú inferior -> Ícono de "Avisos" (campana).
 * @acceso_a_datos Llama a la función RPC `get_avisos_categorizados` para obtener todos los compromisos pendientes.
 */
import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/utils/supabase/client';
import type { Usuario } from '@/types/database';
import { useI18n } from '@/app/i18n-provider';
import { formatDate } from '@/utils/format';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';

type AvisoCategorizado = {
  id_contribucion: number;
  contribucion_nombre: string;
  fecha_cargo: string;
  fecha_maxima_pago: string | null;
  dias_restantes: number; // Calculado en el cliente
  categoria: 'verde' | 'amarillo' | 'rojo'; // Calculado en el cliente
};

// Tipo para los datos que devuelve la función RPC
type ContribucionCasaDetalle = {
  id_contribucion: number;
  fecha_cargo: string;
  estado: 'PENDIENTE' | 'PAGADO' | string;
  contribucion_nombre: string;
  fecha_maxima_pago: string | null;
  // ...pueden añadirse más campos si son necesarios
};

type Tab = 'verde' | 'amarillo' | 'rojo';

export default function AvisosPage() {
  const supabase = createClient();
  const router = useRouter();
  const { t, lang } = useI18n();
  const [avisos, setAvisos] = useState<AvisoCategorizado[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('verde');

  const fetchAvisoData = useCallback(async () => {
    const storedUser = localStorage.getItem('usuario');
    if (!storedUser) {
      router.push('/');
      return;
    }
 
    try {
      const user: Usuario = JSON.parse(storedUser);
 
      // CORREGIDO: Usar la nueva función RPC
      const { data, error } = await supabase.rpc('gestionar_contribuciones_casa', {
        p_accion: 'SELECT',
        p_id_casa: user.id,
      });
 
      if (error) throw error;
 
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);

      // Adaptar y calcular los datos en el cliente
      const avisosPendientes = (data || [])
        .filter((item: ContribucionCasaDetalle) => item.estado === 'PENDIENTE')
        .map((item: ContribucionCasaDetalle) => {
          const fechaLimite = new Date(item.fecha_maxima_pago || item.fecha_cargo);
          fechaLimite.setHours(0, 0, 0, 0);
          const diffTime = fechaLimite.getTime() - hoy.getTime();
          const dias_restantes = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

          const categoria: Tab = dias_restantes <= 7 ? 'verde' : (dias_restantes <= 30 ? 'amarillo' : 'rojo');

          return { ...item, dias_restantes, categoria };
        });

      setAvisos(avisosPendientes);
    } catch (e) {
      toast.error(`${t('notices.alerts.dbError', { message: e instanceof Error ? e.message : '' })}`);
      router.push('/menu');
    } finally {
      setIsLoading(false);
    }
  }, [supabase, router, t]);
 
  useEffect(() => {
    fetchAvisoData();
  }, [fetchAvisoData]);

  // Helper function to format days remaining message using Intl.PluralRules
  const getDaysRemainingMessage = useCallback((count: number, currentLocale: string) => {
    const pluralRules = new Intl.PluralRules(currentLocale);
    const rule = pluralRules.select(count); // 'zero', 'one', 'other' for Spanish/English

    switch (rule) {
      case 'zero':
        return t('notices.card.daysRemaining_zero');
      case 'one':
        return t('notices.card.daysRemaining_one');
      case 'other':
        return t('notices.card.daysRemaining_other', { count: count });
      default:
        // Fallback, should not be reached for 'es' or 'en'
        return t('notices.card.daysRemaining_other', { count: count });
    }
  }, [t]);

  const filteredAvisos = avisos.filter(aviso => aviso.categoria === activeTab);

  if (isLoading) {
    return <div className="text-center p-6">{t('notices.loading')}</div>;
  }

  const counts = {
    verde: avisos.filter(a => a.categoria === 'verde').length,
    amarillo: avisos.filter(a => a.categoria === 'amarillo').length,
    rojo: avisos.filter(a => a.categoria === 'rojo').length,
  };

  if (avisos.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-green-500 w-full max-w-lg mx-auto">
        <h1 className="text-2xl font-bold text-gray-800 text-center">{t('notices.title')}</h1>
        <p className="mt-4 text-gray-600">{t('notices.noPending')}</p>
      </div>
    );
  }
  
  const tabStyles = {
    base: 'px-4 py-2 text-center rounded-t-lg focus:outline-none transition-colors duration-200',
    inactive: 'bg-gray-100 text-gray-500 hover:bg-gray-200',
  };

  const categoryStyles = {
    verde: { border: 'border-green-500', text: 'text-green-600' },
    amarillo: { border: 'border-yellow-500', text: 'text-yellow-600' },
    rojo: { border: 'border-red-500', text: 'text-red-600' },
  };

  const tabContent = [
    { id: 'verde', title: t('notices.tabs.upcomingTitle'), range: t('notices.tabs.upcomingRange'), count: counts.verde },
    { id: 'amarillo', title: t('notices.tabs.midTermTitle'), range: t('notices.tabs.midTermRange'), count: counts.amarillo },
    { id: 'rojo', title: t('notices.tabs.longTermTitle'), range: t('notices.tabs.longTermRange'), count: counts.rojo },
  ];

  const getActiveTabClasses = (tabId: Tab) => {
    const styles = categoryStyles[tabId];
    if (activeTab === tabId) {
      return `bg-white border-b-2 ${styles.border} ${styles.text}`;
    }
    return tabStyles.inactive;
  };

  return (
    <div className="w-full max-w-lg mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 text-center mb-4">{t('notices.title')}</h1>
      
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex justify-center space-x-2" aria-label="Tabs">
          {tabContent.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as Tab)}
              className={`${tabStyles.base} ${getActiveTabClasses(tab.id as Tab)}`}
            >
              <span className="block text-sm font-medium">{tab.title}</span>
              <span className="block text-xs">
                {t('notices.tabs.rangeWithCount', { range: tab.range, count: tab.count })}
              </span>
            </button>
          ))}
        </nav>
      </div>

      <div className="py-4">
        {filteredAvisos.length > 0 ? (
          <div className="space-y-4">
            {filteredAvisos.map((aviso) => (
              <div
                key={`${aviso.id_contribucion}-${aviso.fecha_cargo}`}
                className={`bg-white p-4 rounded-lg shadow-md border-l-4 ${categoryStyles[aviso.categoria].border}`}
              >
                <div className="flex justify-between items-start">
                  <h2 className="font-bold text-gray-800">{aviso.contribucion_nombre}</h2>
                  <span className="text-sm font-medium text-gray-600">{formatDate(aviso.fecha_cargo, lang)}</span>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  {getDaysRemainingMessage(aviso.dias_restantes, lang)}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-500 mt-4">{t('notices.card.noNoticesInCategory')}</p>
        )}
      </div>
    </div>
  );
}