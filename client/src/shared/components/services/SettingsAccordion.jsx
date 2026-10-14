import React from 'react';
import { useTranslation } from 'react-i18next';
import { Accordion } from '../layouts/Accordion';

export default function SettingsAccordion({ children, open = false, title = 'settings' }) {
  const { t } = useTranslation('common');
  return <Accordion title={t(title)} icon="⚙️" open={open}>{children}</Accordion>;
}
