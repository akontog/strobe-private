import React from 'react';
import { useTranslation } from 'react-i18next';

export default function GeometryTeacherView() {
  const { t } = useTranslation('geometry');

  return (
    <iframe
      title={t('title')}
      src="/labs/geometry-live/teacher.html"
      className="embedded-lab-frame"
    />
  );
}
