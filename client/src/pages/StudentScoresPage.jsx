import React from 'react';
import { useTranslation } from 'react-i18next';
import { StudentScoresAccordion } from '../shared/components';

export default function StudentScoresPage() {
  const { t } = useTranslation('scores');

  return (
    <section className="dashboard-page">
      <div className="dashboard-shell">
        <header className="page-hero">
          <div className="page-hero__logoRow">
            <img className="page-hero__logo" src="/icons/strobelogo.svg" alt="Strobe" />
            <h1>{t('managementTitle')}</h1>
          </div>
          <p className="page-hero__lead">{t('managementDescription')}</p>
        </header>
        <StudentScoresAccordion role="teacher" manageUsers open />
      </div>
    </section>
  );
}
