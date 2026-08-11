import React from 'react';
import { Accordion } from '../../../shared/components';

const STUDENT_QR_SRC = '/labs/neural-lab/media/neural_lab_student_qrcode.png';

export const StudentQrAccordion = () => (
  <Accordion title="📱 Σύνδεση μαθητών">
    <div className="data-section student-qr-section">
      <img
        className="student-qr-image"
        src={STUDENT_QR_SRC}
        alt="QR code για το Neural Lab student link"
      />
    </div>
  </Accordion>
);
