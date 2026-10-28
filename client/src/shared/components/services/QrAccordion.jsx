import React from 'react';
import { Accordion } from '../layouts/Accordion';

export const QrAccordion = ({
  title = 'Σύνδεση (QR Code)',
  icon = '📱',
  open = false,
  qrSrc = '/qr_195_251_162_87_3000.png',
  alt = 'QR code',
  linkHref = '',
  linkLabel = '',
  wrapperClassName = 'data-section student-qr-section',
  imageClassName = 'student-qr-image'
}) => (
  <Accordion title={title} icon={icon} open={open}>
    <div className={wrapperClassName}>
      {qrSrc ? <img className={imageClassName} src={qrSrc} alt={alt} /> : null}
      {linkHref && linkLabel ? (
        <a href={linkHref} target="_blank" rel="noopener noreferrer">{linkLabel}</a>
      ) : null}
    </div>
  </Accordion>
);

export default QrAccordion;
