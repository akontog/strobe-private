import React from 'react';
import { useTranslation } from 'react-i18next';

export default function GeometryStudentView() {
  const { t } = useTranslation('geometry');

  return (
    <iframe
      title={t('title')}
      src="/apps/geometry-live/mouse.html"
      style={{ width: '100%', minHeight: '100vh', border: 'none' }}
    />
  );
}
