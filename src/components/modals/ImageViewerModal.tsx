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
      <div className="bg-white p-2 rounded-lg shadow-xl max-w-3xl max-h-full" onClick={(e) => e.stopPropagation()}>
        <div className="relative flex flex-col items-center justify-center" style={{ minHeight: '200px', minWidth: '300px', width: '80vw', height: '80vh' }}>
          {isLoading && (
            <div className="text-center">
              <div className="text-gray-600">{t('calendar.imageViewer.loading')}</div>
              <div className="text-xs text-gray-400 mt-2 break-all">URL: {src}</div>
            </div>
          )}
          {error && <div className="text-red-600 p-4 text-center whitespace-pre-wrap">{error}</div>}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt={t('calendar.imageViewer.altText')}
            className={`w-full h-full object-contain ${isLoading || error ? 'hidden' : ''}`}
            onLoad={handleImageLoad}
            onError={handleImageError}
          />
          <button
            onClick={onClose}
            className="absolute top-0 right-0 mt-2 mr-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            aria-label={t('calendar.imageViewer.closeAriaLabel')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
