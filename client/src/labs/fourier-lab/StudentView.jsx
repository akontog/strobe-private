import React from 'react';
import { useTranslation } from 'react-i18next';

export default function FourierStudentView() {
  const { t } = useTranslation('fourier');

  return (
    <iframe
      title={t('studentTitle')}
      src="/apps/fourier-lab/index.html?mode=client"
      style={{ width: '100%', minHeight: '100vh', border: 'none' }}
    />
  );
}
