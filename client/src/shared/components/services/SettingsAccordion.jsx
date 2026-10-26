import React from 'react';
import { useTranslation } from 'react-i18next';
import { Accordion } from '../layouts/Accordion';

export default function SettingsAccordion({
  children, // Settings controls shown inside the accordion.
  open = false, // Opens the accordion initially when true.
  title = 'settings', // Translation key for the accordion heading.
  icon = '⚙️' // Icon shown beside the accordion heading.
}) {
  const { t } = useTranslation('common');
  return <Accordion title={t(title)} icon={icon} open={open}>{children}</Accordion>;
}
