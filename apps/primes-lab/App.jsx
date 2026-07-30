import React, { useMemo, useState } from 'react';
import Accordion from './components/Accordion';
import NumberGrid from './components/NumberGrid';
import SelectionSummaryAccordion from './components/SelectionSummaryAccordion';
import StudentsTable from './components/StudentsTable';
import TeacherPanel from './components/TeacherPanel';
import { INITIAL_PRIME, NUMBER_RANGE, PRIME_NUMBERS, SIEVE_STEPS } from './data/primes';
import './App.css';

const STUDENT_DEFS = [
  { id: 'student-1', name: 'Μαρία' },
  { id: 'student-2', name: 'Γιάννης' },
  { id: 'student-3', name: 'Ελένη' },
  { id: 'student-4', name: 'Νίκος' }
];

const createInitialStudents = () => STUDENT_DEFS.map((student) => ({
  ...student,
  selectedCorrect: [],
  selectedWrong: []
}));

const isPrimeNumber = (number) => {
  if (number < 2) {
    return false;
  }

  for (let divisor = 2; divisor * divisor <= number; divisor += 1) {
    if (number % divisor === 0) {
      return false;
    }
  }

  return true;
};

const toNumberList = (value) => (Array.isArray(value) ? value : []);

const App = ({ role = 'teacher' }) => {
  const isTeacher = role === 'teacher';
  const [currentPrime, setCurrentPrime] = useState(INITIAL_PRIME);
  const [students, setStudents] = useState(createInitialStudents);
  const [activeStudentId, setActiveStudentId] = useState(STUDENT_DEFS[0].id);
  const [message, setMessage] = useState('Διάλεξε μια βάση και ξεκίνα το κόσκινο.');

  const activeStudent = students.find((student) => student.id === activeStudentId) || students[0];

  const correctOwnerByNumber = useMemo(() => {
    const ownerMap = {};
    students.forEach((student) => {
      student.selectedCorrect.forEach((number) => {
        ownerMap[number] = student.id;
      });
    });
    return ownerMap;
  }, [students]);

  const wrongSelectionsByNumber = useMemo(() => {
    const selectionMap = {};
    students.forEach((student) => {
      student.selectedWrong.forEach((number) => {
        if (!selectionMap[number]) {
          selectionMap[number] = [];
        }
        selectionMap[number].push(student.id);
      });
    });
    return selectionMap;
  }, [students]);

  const claimedNumbers = useMemo(
    () => new Set(Object.keys(correctOwnerByNumber).map(Number)),
    [correctOwnerByNumber]
  );

  const currentTargetNumbers = useMemo(
    () => NUMBER_RANGE.filter((number) => number > currentPrime && number % currentPrime === 0),
    [currentPrime]
  );

  const remainingTargetNumbers = useMemo(
    () => currentTargetNumbers.filter((number) => !claimedNumbers.has(number)),
    [currentTargetNumbers, claimedNumbers]
  );

  const nextPrime = useMemo(
    () => PRIME_NUMBERS.find((prime) => prime > currentPrime),
    [currentPrime]
  );

  const progress = useMemo(() => {
    const solved = SIEVE_STEPS.filter((step) => step.multiples.every((number) => claimedNumbers.has(number)));
    const remaining = NUMBER_RANGE.filter((number) => !claimedNumbers.has(number));
    const wrongTotal = students.reduce((sum, student) => sum + student.selectedWrong.length, 0);

    return {
      solvedCount: solved.length,
      remainingCount: remaining.length,
      primeCount: remaining.filter((number) => isPrimeNumber(number)).length,
      wrongTotal
    };
  }, [students, claimedNumbers]);

  const handleSelectPrime = (prime) => {
    setCurrentPrime(prime);
    setMessage(`Τώρα δουλεύουμε με τη βάση ${prime}. Τα πολλαπλάσιά της φωτίζονται στον πίνακα.`);
  };

  const updateStudent = (studentId, updater) => {
    setStudents((previousStudents) =>
      previousStudents.map((student) => (student.id === studentId ? updater(student) : student))
    );
  };

  const handleToggleNumber = (number) => {
    if (number === currentPrime) {
      setMessage(`Ο ${number} είναι η βάση του βήματος, όχι πολλαπλάσιο.`);
      return;
    }

    const isTarget = number > currentPrime && number % currentPrime === 0;

    if (isTarget) {
      const ownerId = correctOwnerByNumber[number];
      if (ownerId && ownerId !== activeStudentId) {
        const ownerName = students.find((student) => student.id === ownerId)?.name || 'άλλος μαθητής';
        setMessage(`${number} έχει ήδη κλειδωθεί σωστά από τη/τον ${ownerName}.`);
        return;
      }

      if (ownerId === activeStudentId) {
        setMessage(`${number} έχει ήδη κλειδωθεί σωστά από τη/τον ${activeStudent?.name || 'μαθητή'}.`);
        return;
      }

      updateStudent(activeStudentId, (student) => ({
        ...student,
        selectedCorrect: [...student.selectedCorrect, number]
      }));

      setMessage(`${activeStudent?.name || 'Ο μαθητής'} κλείδωσε σωστά το ${number}.`);
      return;
    }

    updateStudent(activeStudentId, (student) => {
      const hasNumber = student.selectedWrong.includes(number);
      return {
        ...student,
        selectedWrong: hasNumber
          ? student.selectedWrong.filter((item) => item !== number)
          : [...student.selectedWrong, number]
      };
    });

    setMessage(`${activeStudent?.name || 'Ο μαθητής'} σημείωσε το ${number} ως λάθος επιλογή.`);
  };

  const visibleStudents = isTeacher ? students : students.slice(0, 1);

  return (
    <div className={isTeacher ? 'primes-app is-teacher' : 'primes-app is-student'}>
      <div className="teacher-card primes-card">
        <header className="hero-title primes-hero">
          <div>
            <p className="primes-kicker">Sieve of Eratosthenes</p>
            <h1>Κόσκινο του Ερατοσθένη</h1>
            <p className="primes-subtitle">
              Από το 2 έως το 100, οι μαθητές ανακαλύπτουν ποιοι αριθμοί είναι πολλαπλάσια και ποιοι μένουν ως πρώτοι.
            </p>
          </div>
          <div className="primes-status">
            <span>Ρόλος</span>
            <strong>{isTeacher ? 'teacher' : 'student'}</strong>
            <small>Επόμενη βάση: {nextPrime || 'τέλος'}</small>
          </div>
        </header>

        <section className="common-zone primes-board-zone">
          <div className="primes-board-header">
            <div>
              <p>Κεντρικό πάνελ</p>
              <h2>Αριθμοί 2 έως 100</h2>
            </div>
            <div className="primes-board-header__legend">
              <span className="legend-item"><i className="legend-dot legend-dot--target" />στόχος</span>
              <span className="legend-item"><i className="legend-dot legend-dot--eliminated" />κλειδωμένο</span>
              <span className="legend-item"><i className="legend-dot legend-dot--prime" />πρώτος</span>
            </div>
          </div>

          <NumberGrid
            numbers={NUMBER_RANGE}
            currentPrime={currentPrime}
            primeNumbers={PRIME_NUMBERS}
            correctOwnerByNumber={correctOwnerByNumber}
            wrongSelectionsByNumber={wrongSelectionsByNumber}
            activeStudentId={activeStudentId}
            onToggleNumber={handleToggleNumber}
          />
        </section>

        <section className="primes-lower-grid">
          <div className="primes-lower-column">
            {isTeacher ? (
              <TeacherPanel
                currentPrime={currentPrime}
                primeNumbers={PRIME_NUMBERS}
                onSelectPrime={handleSelectPrime}
                students={students}
                activeStudentId={activeStudentId}
                onSelectActiveStudent={setActiveStudentId}
              />
            ) : (
              <Accordion title="Οδηγίες μαθητή" subtitle="Τι κάνουμε στο τρέχον βήμα" defaultOpen>
                <p className="student-guide">
                  Ο teacher έχει ορίσει τη βάση <strong>{currentPrime}</strong>. Βρες και πάτα όλα τα πολλαπλάσια της που είναι μεγαλύτερα από τον ίδιο τον αριθμό.
                </p>
                <ul className="teacher-panel__goals">
                  <li>Τα σωστά πολλαπλάσια κλειδώνουν για όλη την τάξη.</li>
                  <li>Οι σωστές επιλογές δεν μπορούν να τις πάρουν άλλοι μαθητές.</li>
                  <li>Τα λάθη φαίνονται αλλά δεν δεσμεύουν τον αριθμό.</li>
                </ul>
              </Accordion>
            )}

            <SelectionSummaryAccordion
              currentPrime={currentPrime}
              students={students}
              claimedNumbers={claimedNumbers}
              wrongSelectionsByNumber={wrongSelectionsByNumber}
              targetNumbers={currentTargetNumbers}
              remainingTargetNumbers={remainingTargetNumbers}
            />

            <div className="primes-note">
              <h2>Κατάσταση</h2>
              <p>{message}</p>
              <div className="primes-note__stats">
                <div>
                  <span>Κλειδωμένα σωστά</span>
                  <strong>{claimedNumbers.size}</strong>
                </div>
                <div>
                  <span>Λάθος επιλογές</span>
                  <strong>{progress.wrongTotal}</strong>
                </div>
                <div>
                  <span>Βήματα που ολοκληρώθηκαν</span>
                  <strong>{progress.solvedCount}</strong>
                </div>
              </div>
            </div>
          </div>

          <div className="primes-lower-column">
            <StudentsTable
              students={visibleStudents}
              activeStudentId={activeStudentId}
              currentPrime={currentPrime}
              claimedNumbers={claimedNumbers}
              wrongSelectionsByNumber={wrongSelectionsByNumber}
            />

            <div className="primes-note primes-compact-note">
              <h2>Τι απομένει</h2>
              <p>Από τους αριθμούς που δεν έχουν κλειδωθεί, μένουν {progress.remainingCount} και από αυτούς {progress.primeCount} είναι πρώτοι.</p>
              <div className="primes-note__stats primes-note__stats--compact">
                <div>
                  <span>Πολλαπλάσια που περιμένουν</span>
                  <strong>{remainingTargetNumbers.length}</strong>
                </div>
                <div>
                  <span>Ολοκληρωμένα βήματα</span>
                  <strong>{progress.solvedCount}</strong>
                </div>
                <div>
                  <span>Τρέχων μαθητής</span>
                  <strong>{activeStudent?.name || '—'}</strong>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default App;
