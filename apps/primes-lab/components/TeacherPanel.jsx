import React from 'react';
import Accordion from './Accordion';

const TeacherPanel = ({
  currentPrime,
  primeNumbers,
  onSelectPrime,
  students,
  activeStudentId,
  onSelectActiveStudent
}) => {
  const activeStudent = students.find((student) => student.id === activeStudentId) || students[0];

  return (
    <div className="teacher-panel">
      <Accordion title="Επιλογή βήματος" subtitle="Ο teacher ορίζει ποιο κόσκινο τρέχει τώρα" defaultOpen>
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

      <Accordion title="Ποιος μαθητής πατά τώρα" subtitle="Χρήσιμο για την προσομοίωση της τάξης" defaultOpen>
        <div className="teacher-panel__buttons teacher-panel__buttons--students">
          {students.map((student) => (
            <button
              key={student.id}
              type="button"
              className={student.id === activeStudentId ? 'teacher-chip is-active' : 'teacher-chip'}
              onClick={() => onSelectActiveStudent(student.id)}
            >
              {student.name}
            </button>
          ))}
        </div>
        <p className="teacher-panel__formula teacher-panel__formula--soft">
          Ενεργός μαθητής: <strong>{activeStudent?.name || '—'}</strong>
        </p>
      </Accordion>

      <Accordion title="Τρέχων κανόνας" subtitle={`Επιλέγονται τα πολλαπλάσια του ${currentPrime}`} defaultOpen>
        <p className="teacher-panel__formula">
          Επιλέγουμε όλα τα πολλαπλάσια του <strong>{currentPrime}</strong> που είναι μεγαλύτερα από το ίδιο το <strong>{currentPrime}</strong>.
        </p>
        <ul className="teacher-panel__goals teacher-panel__goals--compact">
          <li>Ο teacher αλλάζει μόνο τη βάση.</li>
          <li>Οι μαθητές επιλέγουν σωστά πολλαπλάσια χωρίς να τα κλέβουν οι άλλοι.</li>
          <li>Ό,τι κλειδώνεται σωστά μένει έξω από το παιχνίδι.</li>
        </ul>
      </Accordion>

      <Accordion title="Διδακτικός στόχος" subtitle="Πολλαπλάσια, πρώτοι και σύνθετοι" defaultOpen={false}>
        <ul className="teacher-panel__goals">
          <li>Οι σωστές επιλογές αποδίδονται σε συγκεκριμένο μαθητή και δεν επαναλαμβάνονται από άλλους.</li>
          <li>Οι λάθος επιλογές καταγράφονται ξεχωριστά για να φαίνεται η στρατηγική κάθε μαθητή.</li>
          <li>Η τάξη προχωρά από το 2, στο 3, στο 5 κ.ο.κ. μέχρι να απομείνουν οι πρώτοι αριθμοί.</li>
        </ul>
      </Accordion>
    </div>
  );
};

export default TeacherPanel;
