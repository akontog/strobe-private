import React from 'react';
import { useTranslation } from 'react-i18next';
import { Accordion } from '../layouts/Accordion';
import './QrAccordion.css';

export const QrAccordion = ({
  title = '',
  icon = '',
  open = false,
  qrSrc = '/qr_195_251_162_87_3000.png',
  alt = '',
  linkHref = '',
  linkLabel = '',
  wrapperClassName = 'student-qr-section',
  imageClassName = 'student-qr-image'
}) => {
  const { t } = useTranslation('interface');
  const resolvedTitle = title || t('studentConnection');
  const resolvedIcon = icon || '📱';
  const resolvedAlt = alt || t('studentQrAlt');

  return (
    <Accordion title={resolvedTitle} icon={resolvedIcon} open={open}>
      <div className={wrapperClassName}>
        {qrSrc ? <img className={imageClassName} src={qrSrc} alt={resolvedAlt} /> : null}
        {linkHref && linkLabel ? (
          <a href={linkHref} target="_blank" rel="noopener noreferrer">{linkLabel}</a>
        ) : null}
      </div>
    </Accordion>
  );
};

export default QrAccordion;
