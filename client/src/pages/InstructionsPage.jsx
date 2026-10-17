import React from 'react';
import { useTranslation } from 'react-i18next';
import { HeroTitle } from '../shared/components';
import './InstructionsPage.css';

export default function InstructionsPage() {
  const { t } = useTranslation('instructions');
  const sections = ['teacher', 'student', 'sessions', 'settings', 'chat'];

  return (
    <main className="instructions-page">
      <header className="instructions-page__header">
        <HeroTitle title={t('title')} subtitle={t('intro')} />
      </header>
      <div className="instructions-page__sections">
        {sections.map((section) => (
          <section className="instructions-page__section" key={section}>
            <h2>{t(`${section}.title`)}</h2>
            <p>{t(`${section}.description`)}</p>
            <ul>
              {t(`${section}.steps`, { returnObjects: true }).map((step, index) => (
                <li key={`${section}-${index}`}>{step}</li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </main>
  );
}
