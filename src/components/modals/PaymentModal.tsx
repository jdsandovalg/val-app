"use client";

import { useState } from 'react';

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
  onSave: (amount: number, file: File) => Promise<void>;
  contribution: PayableContribution | null;
}) {
  const [amount, setAmount] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !contribution) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!file || !amount) {
      setError('Por favor, ingrese el monto y seleccione un archivo.');
      return;
    }
    setLoading(true);
    await onSave(parseFloat(amount), file);
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-sm">
        <h2 className="text-xl font-bold mb-2 text-center">Registrar Pago</h2>
        <div className="text-center mb-4">
          <p className="text-sm text-gray-600">Aportación</p>
          <p className="font-semibold text-gray-800">
            {contribution.descripcion}
          </p>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="mb-4 flex flex-col items-center">
            <label htmlFor="amount" className="block text-sm font-medium text-gray-700 w-1/2 text-center">Monto Pagado</label>
            <input type="number" id="amount" value={amount} onChange={(e) => setAmount(e.target.value)} className="mt-1 block w-1/2 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm text-right px-2 py-1 bg-gray-100" placeholder="0.00" step="0.01" required />
          </div>
          <div className="mb-4 flex flex-col items-center">
            <label htmlFor="file" className="block text-sm font-bold text-gray-700 text-center">Comprobante de Pago</label>
            <input type="file" id="file" onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)} className="mt-1 block w-full text-xs text-gray-500 file:mr-4 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" accept="image/*" required />
          </div>
          {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
          <div className="flex justify-end gap-4">
            <button type="button" onClick={onClose} disabled={loading} className="bg-red-500 text-white font-bold py-1 px-3 rounded-md text-sm hover:bg-red-600 disabled:opacity-50">
              Cancelar
            </button>
            <button type="submit" disabled={loading} autoFocus className="bg-blue-600 text-white font-bold py-1 px-3 rounded-md text-sm hover:bg-blue-700 disabled:bg-gray-400">
              {loading ? 'Guardando...' : 'Guardar Pago'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default PaymentModal;
export type { PayableContribution };