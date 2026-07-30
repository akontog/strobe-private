import React from 'react';

const NumberGrid = ({
  numbers,
  currentPrime,
  primeNumbers,
  correctOwnerByNumber,
  wrongSelectionsByNumber,
  activeStudentId,
  mode = 'teacher',
  onToggleNumber,
  readonly = false
}) => {
  const primeSet = primeNumbers instanceof Set ? primeNumbers : new Set(primeNumbers);
  const items = [null, ...numbers];

  return (
    <div className="prime-grid" role="grid" aria-label="Πίνακας αριθμών από το 2 έως το 100">
      {items.map((number, index) => {
        if (number === null) {
          return <div key="blank" className="prime-grid__cell prime-grid__cell--blank" aria-hidden="true" />;
        }

        const isCurrentPrime = number === currentPrime;
        const isPrime = primeSet.has(number);
        const isTarget = number > currentPrime && number % currentPrime === 0;
        const ownerId = correctOwnerByNumber[number];
        const wrongOwners = wrongSelectionsByNumber[number] || [];
        const isLocked = Boolean(ownerId);
        const isLockedByActiveStudent = ownerId === activeStudentId;
        const isWrong = wrongOwners.length > 0;
        const isComposite = number > 1 && !isPrime;
        const teacherLocked = mode === 'teacher' && isLocked;
        const studentOwnCorrect = mode === 'student' && isLockedByActiveStudent;
        const studentOtherCorrect = mode === 'student' && isLocked && !isLockedByActiveStudent;
        const studentWrong = mode === 'student' && isWrong && !isLocked;
        const ownerLabel = ownerId ? ownerId.replace('student-', 'Σ') : '';

        const classNames = [
          'prime-grid__cell',
          teacherLocked ? 'is-teacher-locked' : '',
          isCurrentPrime ? 'is-current-prime' : '',
          mode === 'teacher' && isLocked ? 'is-locked' : '',
          studentOwnCorrect ? 'is-owned-correct' : '',
          studentOtherCorrect ? 'is-other-correct' : '',
          studentWrong ? 'is-owned-wrong' : '',
          isPrime ? 'is-prime' : '',
          isComposite ? 'is-composite' : ''
        ]
          .filter(Boolean)
          .join(' ');

        return (
          <button
            key={number}
            type="button"
            className={classNames}
            onClick={() => {
              if (!readonly) {
                onToggleNumber(number);
              }
            }}
            aria-pressed={studentOwnCorrect || studentWrong || teacherLocked}
            disabled={(mode === 'student' && isLocked && !isLockedByActiveStudent) || readonly}
            title={mode === 'teacher' && isLocked ? `${number} έχει κλειδωθεί από ${ownerLabel}` : mode === 'student' && isLocked && !isLockedByActiveStudent ? `${number} έχει ήδη κλειδώσει από άλλον μαθητή` : isTarget ? `${number} είναι πολλαπλάσιο του ${currentPrime}` : `Αριθμός ${number}`}
          >
            <span className="prime-grid__number">{number}</span>
            {mode === 'teacher' && ownerId ? <span className="prime-grid__owner">{ownerLabel}</span> : null}
          </button>
        );
      })}
    </div>
  );
};

export default NumberGrid;
