import React from 'react';
import { useTranslation } from 'react-i18next';

export default function FourierStudentView() {
  const { t } = useTranslation('fourier');

  return (
    <iframe
      title={t('studentTitle')}
      src="/labs/fourier-lab/index.html?mode=client"
      className="embedded-lab-frame"
    />
  );
}
