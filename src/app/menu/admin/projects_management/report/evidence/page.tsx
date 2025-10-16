'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { useI18n } from '@/app/i18n-provider';

function EvidenceViewer() {
  const searchParams = useSearchParams();
  const imageUrl = searchParams.get('url');
  const { t } = useI18n();

  if (!imageUrl) {
    return <p>Error: URL de la imagen no proporcionada.</p>;
  }

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh', backgroundColor: 'rgba(229, 231, 235, 0.9)' /* Gris claro */, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <button
        onClick={() => window.close()}
        style={{
          position: 'fixed', top: '15px', right: '15px', zIndex: 1301,
          background: '#FFFFFF', // Fondo blanco sólido
          color: '#111827', // Icono negro
          border: 'none',
          borderRadius: '50%',
          width: '48px', height: '48px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
        }}
        title="Cerrar"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" style={{ width: '26px', height: '26px' }}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
      </button>
      {/* eslint-disable-next-line @next/next/no-img-element -- Se usa <img> para URLs externas dinámicas sin configurar el loader de Next.js */}
      <img
        src={imageUrl}
        alt={t('projects.evidenceAppendix.altText')}
        style={{ maxWidth: '90%', maxHeight: '90%', objectFit: 'contain' }}
      />
    </div>
  );
}

export default function EvidencePage() {
  return (
    <Suspense fallback={<div>Cargando...</div>}>
      <EvidenceViewer />
    </Suspense>
  );
}