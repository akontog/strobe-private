import React from 'react';
import { useTranslation } from 'react-i18next';

export default function GeometryTeacherView() {
  const { t } = useTranslation('geometry');

  return (
    <iframe
      title={t('title')}
      src="/labs/geometry-live/teacher.html"
      style={{ width: '100%', minHeight: '100vh', border: 'none' }}
    />
  );
}
