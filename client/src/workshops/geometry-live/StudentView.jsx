import React from 'react';
import { useTranslation } from 'react-i18next';

export default function GeometryStudentView() {
  const { t } = useTranslation('geometry');

  return (
    <iframe
      title={t('title')}
      src="/labs/geometry-live/mouse.html"
      className="embedded-lab-frame"
    />
  );
}
