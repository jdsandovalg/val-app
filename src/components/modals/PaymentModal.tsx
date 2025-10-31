"use client";

import { useState } from 'react';
import { useI18n } from '@/app/i18n-provider';

type PayableContribution = {
  id_contribucion: string;
  descripcion: string;
  fecha: string;
};

function PaymentModal({
  isOpen,
  onClose,
  onSave,
  contribution,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSave: (amount: number, date: string, file: File) => Promise<void>;
  contribution: PayableContribution | null;
}) {
  const { t } = useI18n();
  const [amount, setAmount] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);

  if (!isOpen || !contribution) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!file || !amount) {
      setError(t('paymentModal.dropzone')); // Reutilizamos una clave descriptiva
      return;
    }
    setLoading(true);
    await onSave(parseFloat(amount), paymentDate, file);
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-30 z-50 flex justify-center items-center backdrop-blur-sm">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-sm">
        <h2 className="text-xl font-bold mb-2 text-center">{t('paymentModal.title')}</h2>
        <div className="text-center mb-4">
          <p className="text-sm text-gray-600">{t('paymentModal.contribution')}</p>
          <p className="font-semibold text-gray-800">
            {contribution.descripcion}
          </p>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="mb-4 flex flex-col items-center">
            <div className="grid grid-cols-2 gap-4 w-full max-w-xs">
              <div className="flex flex-col items-center">
                <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">{t('paymentModal.amountPaid')}</label>
                <input type="number" id="amount" value={amount} onChange={(e) => setAmount(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm text-right px-2 py-1 bg-gray-100" placeholder={t('paymentModal.amountPlaceholder')} step="0.01" required />
              </div>
              <div className="flex flex-col items-center">
                <label htmlFor="paymentDate" className="block text-sm font-medium text-gray-700 mb-1">{t('contributionModal.dateLabel')}</label>
                <input type="date" id="paymentDate" value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-2 py-1 bg-gray-100" required />
              </div>
            </div>
          </div>
          <div className="mb-4 flex flex-col items-center">
            <label className="block text-sm font-bold text-gray-700 text-center mb-2">{t('paymentModal.proof')}</label>
            <div className="flex items-center justify-center w-full">
              <label htmlFor="file" className="cursor-pointer bg-blue-500 text-white font-bold py-1 px-3 rounded-md text-sm hover:bg-blue-600 whitespace-nowrap">
                {t('paymentModal.selectFileButton')}
              </label>
              <input 
                  type="file" 
                  id="file" 
                  onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)} 
                  className="hidden"
                  accept="image/*" 
                  required />
              <span className="ml-3 text-sm text-gray-500 truncate" title={file?.name}>{file ? file.name : t('paymentModal.noFileChosen')}</span>
            </div>
          </div>
          {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
          <div className="flex justify-end gap-4">
            <button type="button" onClick={onClose} disabled={loading} className="bg-red-500 text-white font-bold py-1 px-3 rounded-md text-sm hover:bg-red-600 disabled:opacity-50">
              {t('paymentModal.cancel')}
            </button>
            <button type="submit" disabled={loading} autoFocus className="bg-blue-600 text-white font-bold py-1 px-3 rounded-md text-sm hover:bg-blue-700 disabled:bg-gray-400">
              {loading ? `${t('paymentModal.save')}...` : t('paymentModal.save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default PaymentModal;
export type { PayableContribution };