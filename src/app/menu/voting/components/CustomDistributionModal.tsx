'use client';

import { useState, useCallback } from 'react';
import { X, Upload, CheckCircle, AlertCircle } from 'lucide-react';
import { useI18n } from '@/app/i18n-provider';

type Casa = {
  id: number;
  responsable: string;
};

type CSVRow = {
  id_casa: number;
  monto: number;
  notas?: string;
  controles?: number;
};

type ValidationResult = {
  isValid: boolean;
  data?: CSVRow[];
  totalMonto?: number;
  errors?: string[];
};

type CustomDistributionModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: CSVRow[]) => Promise<void>;
  projectName: string;
  totalAmount: number;
  casas: Casa[];
};

export default function CustomDistributionModal({
  isOpen,
  onClose,
  onConfirm,
  projectName,
  totalAmount,
  casas,
}: CustomDistributionModalProps) {
  const { currency, locale } = useI18n();
  const [csvData, setCSVData] = useState<CSVRow[]>([]);
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const parseCSV = useCallback((csvText: string): ValidationResult => {
    const errors: string[] = [];
    const data: CSVRow[] = [];
    
    try {
      const lines = csvText.trim().split('\n');
      if (lines.length < 2) {
        return { isValid: false, errors: ['El CSV debe tener al menos una fila de datos'] };
      }

      // Validar encabezados
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      const requiredHeaders = ['id_casa', 'monto'];
      const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
      
      if (missingHeaders.length > 0) {
        return { 
          isValid: false, 
          errors: [`Faltan columnas requeridas: ${missingHeaders.join(', ')}`] 
        };
      }

      // Parsear datos
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const values = line.split(',').map(v => v.trim());
        const row: Record<string, string> = {};
        
        headers.forEach((header, index) => {
          row[header] = values[index] || '';
        });

        const id_casa = parseInt(row.id_casa);
        const monto = parseFloat(row.monto);

        // Validaciones
        if (isNaN(id_casa)) {
          errors.push(`Línea ${i + 1}: id_casa inválido`);
          continue;
        }

        if (isNaN(monto) || monto <= 0) {
          errors.push(`Línea ${i + 1}: monto inválido o menor/igual a 0`);
          continue;
        }

        const casa = casas.find(c => c.id === id_casa);
        if (!casa) {
          errors.push(`Línea ${i + 1}: casa ${id_casa} no existe`);
          continue;
        }

        // Verificar duplicados
        if (data.some(d => d.id_casa === id_casa)) {
          errors.push(`Línea ${i + 1}: casa ${id_casa} duplicada`);
          continue;
        }

        data.push({
          id_casa,
          monto,
          notas: row.notas || undefined,
          controles: row.controles ? parseInt(row.controles) : undefined,
        });
      }

      if (errors.length > 0) {
        return { isValid: false, errors };
      }

      // Calcular total
      const totalMonto = data.reduce((sum, row) => sum + row.monto, 0);

      // Validar que el total coincida (con tolerancia de 0.01 por redondeo)
      const diferencia = Math.abs(totalMonto - totalAmount);
      if (diferencia > 0.01) {
        errors.push(
          `El total del CSV (${totalMonto.toFixed(2)}) no coincide con el monto del proyecto (${totalAmount.toFixed(2)}). Diferencia: ${diferencia.toFixed(2)}`
        );
        return { isValid: false, errors, data, totalMonto };
      }

      return { isValid: true, data, totalMonto };
    } catch (error) {
      return { 
        isValid: false, 
        errors: [`Error al parsear CSV: ${error instanceof Error ? error.message : String(error)}`] 
      };
    }
  }, [casas, totalAmount]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const result = parseCSV(text);
      setValidation(result);
      if (result.isValid && result.data) {
        setCSVData(result.data);
      }
    };
    reader.readAsText(file);
  };

  const handleConfirm = async () => {
    if (!validation?.isValid || !csvData.length) return;

    setIsProcessing(true);
    try {
      await onConfirm(csvData);
      onClose();
    } catch (error) {
      console.error('Error al confirmar distribución:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    setCSVData([]);
    setValidation(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">
              Distribución Personalizada
            </h2>
            <p className="text-sm text-gray-600 mt-1">{projectName}</p>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={isProcessing}
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Información del proyecto */}
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
            <p className="text-sm text-blue-800">
              <strong>Total del proyecto:</strong> {new Intl.NumberFormat(locale, {
                style: 'currency',
                currency: currency
              }).format(totalAmount)}
            </p>
            <p className="text-xs text-blue-600 mt-1">
              El CSV debe contener contribuciones que sumen exactamente este monto
            </p>
          </div>

          {/* Instrucciones */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold text-gray-800 mb-2">Formato del CSV:</h3>
            <div className="text-sm text-gray-600 space-y-2">
              <p><strong>Columnas requeridas:</strong> id_casa, monto</p>
              <p><strong>Columnas opcionales:</strong> notas, controles</p>
              <div className="mt-3 bg-white p-3 rounded border border-gray-200 font-mono text-xs">
                id_casa,monto,notas,controles<br />
                1,1430.00,2 controles remotos,2<br />
                2,1430.00,2 controles remotos,2<br />
                9,1680.00,3 controles remotos,3
              </div>
            </div>
          </div>

          {/* Upload */}
          <div>
            <label className="block">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 transition-colors cursor-pointer">
                <Upload className="mx-auto mb-3 text-gray-400" size={48} />
                <p className="text-sm text-gray-600 mb-1">
                  <span className="text-blue-600 font-semibold">Haz clic para subir</span> o arrastra un archivo CSV
                </p>
                <p className="text-xs text-gray-500">CSV (máximo 1MB)</p>
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  className="hidden"
                  disabled={isProcessing}
                />
              </div>
            </label>
          </div>

          {/* Validation Results */}
          {validation && (
            <div className={`p-4 rounded-lg border-l-4 ${
              validation.isValid 
                ? 'bg-green-50 border-green-500' 
                : 'bg-red-50 border-red-500'
            }`}>
              <div className="flex items-start gap-3">
                {validation.isValid ? (
                  <CheckCircle className="text-green-600 flex-shrink-0 mt-0.5" size={20} />
                ) : (
                  <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
                )}
                <div className="flex-1">
                  <h4 className={`font-semibold mb-2 ${
                    validation.isValid ? 'text-green-800' : 'text-red-800'
                  }`}>
                    {validation.isValid ? '✓ Validación exitosa' : '✗ Errores encontrados'}
                  </h4>
                  
                  {validation.isValid ? (
                    <div className="text-sm text-green-700 space-y-1">
                      <p>• Registros: {validation.data?.length}</p>
                      <p>• Total: {new Intl.NumberFormat(locale, {
                        style: 'currency',
                        currency: currency
                      }).format(validation.totalMonto || 0)}</p>
                    </div>
                  ) : (
                    <ul className="text-sm text-red-700 space-y-1">
                      {validation.errors?.map((error, idx) => (
                        <li key={idx}>• {error}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Preview Table */}
          {validation?.isValid && csvData.length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-800 mb-3">Vista previa:</h3>
              <div className="border rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Casa</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Responsable</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Monto</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Notas</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {csvData.map((row) => {
                      const casa = casas.find(c => c.id === row.id_casa);
                      return (
                        <tr key={row.id_casa}>
                          <td className="px-4 py-3 text-sm text-gray-900">{row.id_casa}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{casa?.responsable || 'N/A'}</td>
                          <td className="px-4 py-3 text-sm text-gray-900 text-right font-medium">
                            {new Intl.NumberFormat(locale, {
                              style: 'currency',
                              currency: currency
                            }).format(row.monto)}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600 truncate max-w-xs">
                            {row.notas || '-'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot className="bg-gray-50">
                    <tr>
                      <td colSpan={2} className="px-4 py-3 text-sm font-semibold text-gray-700">Total</td>
                      <td className="px-4 py-3 text-sm font-bold text-gray-900 text-right">
                        {new Intl.NumberFormat(locale, {
                          style: 'currency',
                          currency: currency
                        }).format(validation.totalMonto || 0)}
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t bg-gray-50">
          <button
            onClick={handleClose}
            disabled={isProcessing}
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={!validation?.isValid || isProcessing}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed font-semibold"
          >
            {isProcessing ? 'Procesando...' : 'Confirmar y Aprobar'}
          </button>
        </div>
      </div>
    </div>
  );
}
