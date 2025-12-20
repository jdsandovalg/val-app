import React from 'react';
import type { ContribucionPorCasaExt } from '@/types';

interface ContributionCardProps {
  record: ContribucionPorCasaExt;
  onDelete: (record: ContribucionPorCasaExt) => Promise<void>;
  onOpenModal: (record: Partial<ContribucionPorCasaExt> | null) => void;
}

const ContributionCard: React.FC<ContributionCardProps> = ({ record, onDelete, onOpenModal }) => {
  const casaInfo = record.usuarios
    ? `Casa #${record.usuarios.id} - ${record.usuarios.responsable}`
    : `Casa ID: ${record.id_casa}`;

  const montoPagado = record.pagado != null
    ? `$${Number(record.pagado).toFixed(2)}`
    : 'No pagado';

  return (
    <div className="bg-white shadow-md rounded-lg p-4 mb-4 border-l-4 border-blue-500">
      <div className="flex justify-between items-start">
        <div>
          <p className="font-bold text-gray-800">{record.contribuciones?.descripcion ?? 'N/A'}</p>
          <p className="text-sm text-gray-500">{casaInfo}</p>
        </div>
        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${record.realizado === 'S' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {record.realizado === 'S' ? 'Realizado' : 'Pendiente'}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-gray-500">Fecha</p>
          <p className="font-medium text-gray-900">{record.fecha}</p>
        </div>
        <div className="text-right">
          <p className="text-gray-500">Monto Pagado</p>
          <p className="font-medium text-gray-900">{montoPagado}</p>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200 flex justify-end gap-3">
        <button onClick={() => onOpenModal(record)} className="text-indigo-600 hover:text-indigo-900 text-sm font-medium">Editar</button>
        <button onClick={() => onDelete(record)} className="text-red-600 hover:text-red-900 text-sm font-medium">Restablecer</button>
      </div>
    </div>
  );
};

export default ContributionCard;