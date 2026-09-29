import React from 'react';
import { Accordion } from './Accordion';

export const StudentQrAccordion = ({
  title = 'Σύνδεση μαθητών',
  icon = '📱',
  open = false,
  qrSrc,
  alt = 'QR code για σύνδεση μαθητών',
  wrapperClassName = 'data-section student-qr-section',
  imageClassName = 'student-qr-image'
}) => (
  <Accordion title={title} icon={icon} open={open}>
    <div className={wrapperClassName}>
      {qrSrc ? (
        <img
          className={imageClassName}
          src={qrSrc}
          alt={alt}
        />
      ) : null}
    </div>
  </Accordion>
);

export default StudentQrAccordion;
