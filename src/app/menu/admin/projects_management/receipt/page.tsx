'use client';

import { useEffect, useState } from 'react';
import { pdf } from '@react-pdf/renderer';
import { useI18n } from '@/app/i18n-provider';
import { ExpenseReceipt } from '../ExpenseReceipt';
import { X, Download } from 'lucide-react';

export default function ReceiptViewerPage() {
  const { t, locale, currency } = useI18n();
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [logoBase64, setLogoBase64] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    const savedData = localStorage.getItem('expenseReceiptData');
    if (savedData) {
      setData(JSON.parse(savedData));
    }

    fetch('/logo.png')
      .then(r => r.blob())
      .then(blob => {
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = () => setLogoBase64(reader.result as string);
      })
      .catch(err => console.error("Error al cargar el logo:", err));
  }, []);

  useEffect(() => {
    if (data && logoBase64) {
      const generate = async () => {
        const doc = (
          <ExpenseReceipt
            expense={data.expense}
            projectDescription={data.projectDescription}
            projectDetail={data.projectDetail}
            logoBase64={logoBase64}
            t={t}
            locale={locale}
            currency={currency}
          />
        );
        const blob = await pdf(doc).toBlob();
        setPdfUrl(URL.createObjectURL(blob));
      };
      generate();
    }
  }, [data, logoBase64, t, locale, currency]);

  const handleDownload = () => {
    if (pdfUrl) {
      const link = document.createElement('a');
      link.href = pdfUrl;
      link.download = `recibo-${data?.expense?.no_documento || Date.now()}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleClose = () => {
    window.close();
  };

  if (!pdfUrl) return <p className="p-8 text-center">Generando recibo...</p>;

  return (
    <div className="relative w-full h-screen bg-gray-100">
      <div className="absolute top-4 right-4 flex gap-2 z-10">
        <button
          onClick={handleDownload}
          className="flex items-center gap-2 px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 shadow-sm"
          title="Descargar recibo"
        >
          <Download size={16} />
          Descargar
        </button>
        <button
          onClick={handleClose}
          className="p-2 bg-white text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 shadow-sm"
          title="Cerrar"
        >
          <X size={20} />
        </button>
      </div>
      <object 
        data={pdfUrl} 
        type="application/pdf" 
        className="w-full h-full"
      >
        <p className="p-8 text-center">
          Tu navegador no soporta PDFs. <a href={pdfUrl} download className="text-blue-600 underline">Haz clic aquí para descargar</a>
        </p>
      </object>
    </div>
  );
}