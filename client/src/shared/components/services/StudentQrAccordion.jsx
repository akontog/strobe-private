import React from 'react';
import { Accordion } from '../layouts/Accordion';

export const StudentQrAccordion = ({
  title = '\u03a3\u03cd\u03bd\u03b4\u03b5\u03c3\u03b7 (QR Code)', // Accordion heading.
  icon = '\u{1F4F1}', // Icon shown beside the heading.
  open = false, // Opens the accordion initially when true.
  qrSrc = '/qr_195_251_162_87_3000.png', // QR image source.
  alt = 'QR code', // Alternative text for the QR image.
  linkHref = '', // Optional destination linked below the QR code.
  linkLabel = '', // Text shown for the optional link.
  wrapperClassName = 'data-section student-qr-section', // CSS classes for the content wrapper.
  imageClassName = 'student-qr-image' // CSS classes for the QR image.
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

export default StudentQrAccordion;
