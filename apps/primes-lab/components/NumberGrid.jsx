import React from 'react';

const NumberGrid = ({
  numbers,
  currentPrime,
  primeNumbers,
  correctOwnerByNumber,
  wrongSelectionsByNumber,
  activeStudentId,
  onToggleNumber,
  readonly = false
}) => {
  const primeSet = primeNumbers instanceof Set ? primeNumbers : new Set(primeNumbers);

  return (
    <div className="prime-grid" role="grid" aria-label="Πίνακας αριθμών από το 2 έως το 100">
      {numbers.map((number) => {
        const isCurrentPrime = number === currentPrime;
        const isPrime = primeSet.has(number);
        const isTarget = number > currentPrime && number % currentPrime === 0;
        const ownerId = correctOwnerByNumber[number];
        const wrongOwners = wrongSelectionsByNumber[number] || [];
        const isLocked = Boolean(ownerId);
        const isLockedByActiveStudent = ownerId === activeStudentId;
        const isWrong = wrongOwners.length > 0;
        const isComposite = number > 1 && !isPrime;

        const classNames = [
          'prime-grid__cell',
          isCurrentPrime ? 'is-current-prime' : '',
          isTarget ? 'is-target' : '',
          isLocked ? 'is-locked' : '',
          isLockedByActiveStudent ? 'is-locked-by-me' : '',
          isWrong ? 'is-wrong' : '',
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
            aria-pressed={isLockedByActiveStudent || isWrong}
            disabled={isLocked && !isLockedByActiveStudent}
            title={isLocked && !isLockedByActiveStudent ? `${number} έχει ήδη κλειδώσει από άλλον μαθητή` : isTarget ? `${number} είναι πολλαπλάσιο του ${currentPrime}` : `Αριθμός ${number}`}
          >
            <span className="prime-grid__number">{number}</span>
            <span className="prime-grid__badge">
              {isCurrentPrime ? 'βάση' : isLockedByActiveStudent ? 'κλειδωμένο' : isLocked ? 'έχει βρεθεί' : isWrong ? 'λάθος' : isTarget ? 'στόχος' : isPrime ? 'πρώτος' : 'επιλογή'}
            </span>
          </button>
        );
      })}
    </div>
  );
};

export default NumberGrid;
