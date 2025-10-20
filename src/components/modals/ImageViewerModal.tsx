'use client';

import { useState, useEffect } from 'react';
import { useI18n } from '@/app/i18n-provider';

type ImageViewerModalProps = {
  src: string | null;
  onClose: () => void;
};

export default function ImageViewerModal({ src, onClose }: ImageViewerModalProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { t } = useI18n();

  useEffect(() => {
    // Reset state when src changes
    setIsLoading(true);
    setError(null);
  }, [src]);

  if (!src) return null;

  const handleImageError = () => {
    setIsLoading(false);
    const errorMessage = t('calendar.imageViewer.error', { url: src });
    setError(errorMessage);
  };

  const handleImageLoad = () => {
    setIsLoading(false);
    setError(null);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex justify-center items-center p-4" onClick={onClose}>
      {/* Contenedor que detiene la propagación del click para no cerrar el modal, excepto en la imagen */}
      <div className="relative">
        {/* Contenedor de la imagen y el spinner */}
        <div className="bg-white p-2 rounded-lg shadow-xl flex items-center justify-center" style={{ minHeight: '200px', minWidth: '300px' }} onClick={(e) => e.stopPropagation()}>
          {isLoading && (
            <div className="text-center">
              <div className="text-gray-100">{t('calendar.imageViewer.loading')}</div>
              <div className="text-xs text-gray-400 mt-2 break-all">URL: {src}</div>
            </div>
          )}
          {error && <div className="text-red-600 p-4 text-center whitespace-pre-wrap">{error}</div>}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt={t('calendar.imageViewer.altText')}
            className={`max-w-[90vw] max-h-[90vh] object-contain cursor-pointer ${isLoading || error ? 'hidden' : ''}`}
            title={t('calendar.imageViewer.closeTooltip')}
            onLoad={handleImageLoad}
            onError={handleImageError}
          />
        </div>
      </div>
    </div>
  );
}
