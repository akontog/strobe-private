import React from 'react';
import { useTranslation } from 'react-i18next';
import Accordion from './Accordion';

const SelectionSummaryAccordion = ({
  currentPrime,
  students,
  claimedNumbers,
  wrongSelectionsByNumber,
  targetNumbers,
  remainingTargetNumbers
}) => {
  const { t } = useTranslation('primes');
  const correctEntries = students.flatMap((student) =>
    student.selectedCorrect
      .filter((number) => claimedNumbers.has(number))
      .map((number) => ({ number, studentName: student.name }))
  );

  const wrongEntries = Object.entries(wrongSelectionsByNumber).flatMap(([number, studentIds]) => {
    return studentIds.map((studentId) => ({
      number: Number(number),
      studentName: students.find((student) => student.id === studentId)?.name || studentId
    }));
  });

  return (
    <Accordion title={t('summary.title')} subtitle={t('summary.subtitle', { prime: currentPrime })} defaultOpen={false}>
      <div className="summary-grid">
        <div className="summary-block">
          <h3>{t('summary.correct')}</h3>
          <p>{correctEntries.length ? correctEntries.map((entry) => `${entry.number} (${entry.studentName})`).join(' · ') : '—'}</p>
        </div>
        <div className="summary-block">
          <h3>{t('summary.wrong')}</h3>
          <p>{wrongEntries.length ? wrongEntries.map((entry) => `${entry.number} (${entry.studentName})`).join(' · ') : '—'}</p>
        </div>
        <div className="summary-block">
          <h3>{t('summary.open')}</h3>
          <p>{remainingTargetNumbers.length ? remainingTargetNumbers.join(', ') : t('summary.allFound')}</p>
        </div>
        <div className="summary-block">
          <h3>{t('summary.stepTargets')}</h3>
          <p>{targetNumbers.length ? targetNumbers.join(', ') : '—'}</p>
        </div>
      </div>
    </Accordion>
  );
};

export default SelectionSummaryAccordion;
