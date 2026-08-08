import React from 'react';
import Accordion from './Accordion';

const SelectionSummaryAccordion = ({
  currentPrime,
  students,
  claimedNumbers,
  wrongSelectionsByNumber,
  targetNumbers,
  remainingTargetNumbers
}) => {
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
    <Accordion title="Συνολική εικόνα" subtitle={`Ποιοι αριθμοί έχουν βρεθεί για το ${currentPrime}`} defaultOpen={false}>
      <div className="summary-grid">
        <div className="summary-block">
          <h3>Σωστά κλειδωμένα</h3>
          <p>{correctEntries.length ? correctEntries.map((entry) => `${entry.number} (${entry.studentName})`).join(' · ') : '—'}</p>
        </div>
        <div className="summary-block">
          <h3>Λάθος επιλογές</h3>
          <p>{wrongEntries.length ? wrongEntries.map((entry) => `${entry.number} (${entry.studentName})`).join(' · ') : '—'}</p>
        </div>
        <div className="summary-block">
          <h3>Ανοιχτοί στόχοι</h3>
          <p>{remainingTargetNumbers.length ? remainingTargetNumbers.join(', ') : 'Όλα έχουν βρεθεί'}</p>
        </div>
        <div className="summary-block">
          <h3>Στόχοι του βήματος</h3>
          <p>{targetNumbers.length ? targetNumbers.join(', ') : '—'}</p>
        </div>
      </div>
    </Accordion>
  );
};

export default SelectionSummaryAccordion;
