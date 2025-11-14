'use client';

import { Home } from 'lucide-react';

export default function VotingPage() {

  return (
    <div className="flex h-full min-h-screen bg-gray-50">
      {/* Barra Lateral con Título Vertical */}
      <div className="w-16 flex-shrink-0 bg-gray-800 text-white flex items-center justify-center">
        <h1 className="text-2xl font-bold tracking-widest" style={{ writingMode: 'vertical-rl' }}>
          VOTACIÓN
        </h1>
      </div>

      {/* Contenido Principal */}
      <div className="flex-grow p-4 sm:p-6 md:p-8">
        <div className="max-w-7xl mx-auto">
          
          {/* Sección Superior: Selección de Casa */}
          <div className="mb-8 p-4 bg-white rounded-lg shadow">
            <h2 className="text-lg font-semibold text-gray-700 mb-4">Seleccionar Casa para Votar</h2>
            <div className="flex flex-wrap gap-3">
              {/* Placeholder para los botones de las casas */}
              {[101, 102, 103, 104, 105].map(casaId => (
                <button key={casaId} className="flex flex-col items-center justify-center w-14 h-14 bg-gray-200 rounded-lg hover:bg-blue-100 transition-colors">
                  <Home size={20} className="text-gray-600" />
                  <span className="text-xs font-bold text-gray-700 mt-1">{casaId}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Sección Principal: Lista de Cotizaciones */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-gray-800">Cotizaciones del Proyecto</h2>
            <div className="p-6 bg-white rounded-lg shadow text-center text-gray-500">
              <p>Aquí se mostrará la lista de cotizaciones para votar.</p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}