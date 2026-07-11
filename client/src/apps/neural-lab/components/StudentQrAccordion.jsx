import React from 'react';
import { useTranslation } from 'react-i18next';
import { Accordion } from '../../../shared/components/Accordion';

const STUDENT_QR_SRC = '/apps/neural-lab/media/neural_lab_student_qrcode.png';

export const StudentQrAccordion = () => {
  const { t } = useTranslation('neural');

  return (
    <Accordion title={`📱 ${t('studentConnection')}`}>
      <div className="data-section student-qr-section">
        <img
          className="student-qr-image"
          src={STUDENT_QR_SRC}
          alt={`${t('studentConnection')} QR code`}
        />
      </div>
    </Accordion>
  );
};
