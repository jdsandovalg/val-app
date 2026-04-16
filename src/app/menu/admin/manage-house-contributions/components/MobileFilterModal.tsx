'use client';

import { useI18n } from '@/app/i18n-provider';

interface MobileFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  filters: {
    casa: string;
    contribucion: string;
    fecha: string;
    pagado: string;
    realizado: string;
  };
  onFilterChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function MobileFilterModal({ isOpen, onClose, filters, onFilterChange }: MobileFilterModalProps) {
  const { t } = useI18n();

  if (!isOpen) return null;

  const inputs = [
    { name: 'casa', placeholder: 'contributionFilterModal.housePlaceholder' },
    { name: 'contribucion', placeholder: 'contributionFilterModal.contributionPlaceholder' },
    { name: 'fecha', placeholder: 'contributionFilterModal.datePlaceholder' },
    { name: 'pagado', placeholder: 'contributionFilterModal.amountPlaceholder' },
    { name: 'realizado', placeholder: 'contributionFilterModal.statusPlaceholder' },
  ];

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex justify-center items-center p-4">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-sm">
        <h2 className="text-xl font-bold mb-4">{t('contributionFilterModal.title')}</h2>
        <div className="space-y-4">
          {inputs.map((input) => (
            <input
              key={input.name}
              name={input.name}
              value={(filters as any)[input.name]}
              onChange={onFilterChange}
              placeholder={t(input.placeholder)}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
            />
          ))}
        </div>
        <div className="mt-6 flex justify-end">
          <button onClick={onClose} className="bg-blue-500 text-white font-bold py-2 px-6 rounded hover:bg-blue-700">
            {t('contributionFilterModal.close')}
          </button>
        </div>
      </div>
    </div>
  );
}