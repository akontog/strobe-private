import React from 'react';
import { useTranslation } from 'react-i18next';
import { Accordion } from '../../../shared/components';

const TeacherPanel = ({
  currentPrime,
  primeNumbers,
  onSelectPrime
}) => {
  const { t: tInterface } = useTranslation('interface');
  const t = (key, options) => tInterface(`workshops.primes.${key}`, options);

  return (
    <>
      <Accordion title={t('teacher.stepTitle')} subtitle={t('teacher.stepSubtitle')}>
        <div className="teacher-panel__buttons">
          {primeNumbers.map((prime) => (
            <button
              key={prime}
              type="button"
              className={prime === currentPrime ? 'teacher-chip is-active' : 'teacher-chip'}
              onClick={() => onSelectPrime(prime)}
            >
              {prime}
            </button>
          ))}
        </div>
      </Accordion>

      <Accordion title={t('teacher.ruleTitle')} subtitle={t('teacher.ruleSubtitle', { prime: currentPrime })}>
        <p className="teacher-panel__formula">
          {t('teacher.ruleText', { prime: currentPrime })}
        </p>
        <ul className="teacher-panel__goals teacher-panel__goals--compact">
          <li>{t('teacher.ruleTeacher')}</li>
          <li>{t('teacher.ruleStudents')}</li>
          <li>{t('teacher.ruleLocked')}</li>
        </ul>
      </Accordion>

    </>
  );
};

export default TeacherPanel;
