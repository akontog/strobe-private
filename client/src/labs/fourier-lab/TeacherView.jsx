import React from 'react';
import { useTranslation } from 'react-i18next';

export default function FourierTeacherView() {
  const { t } = useTranslation('fourier');

  return (
    <iframe
      title={t('teacherTitle')}
      src="/labs/fourier-lab/index.html?mode=teacher"
      style={{ width: '100%', minHeight: '100vh', border: 'none' }}
    />
  );
}
