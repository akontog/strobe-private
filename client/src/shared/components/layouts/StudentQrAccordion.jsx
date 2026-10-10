import React from 'react';
import { Accordion } from './Accordion';

export const StudentQrAccordion = ({
  title = '\u03a3\u03cd\u03bd\u03b4\u03b5\u03c3\u03b7 \u03bc\u03b1\u03b8\u03b7\u03c4\u03ce\u03bd',
  icon = '\u{1F4F1}',
  open = false,
  qrSrc,
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

export default StudentQrAccordion;
