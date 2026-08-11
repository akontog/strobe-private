import React, { useEffect, useMemo, useRef, useState } from 'react';
import NumberGrid from './components/NumberGrid';
import SelectionSummaryAccordion from './components/SelectionSummaryAccordion';
import StudentsTable from './components/StudentsTable';
import TeacherPanel from './components/TeacherPanel';
import {
  ConnectionNameControl,
  randomIdentityColor,
  readIdentityColor,
  readIdentityName,
  writeIdentityColor,
  writeIdentityName
} from '../../shared/components';
import { INITIAL_PRIME, NUMBER_RANGE, PRIME_NUMBERS, SIEVE_STEPS } from './data/primes';
import './App.css';

const STUDENT_DEFS = [
  { id: 'student-1', name: 'Μαρία' },
  { id: 'student-2', name: 'Γιάννης' },
  { id: 'student-3', name: 'Ελένη' },
  { id: 'student-4', name: 'Νίκος' }
];

const PRIMES_STUDENT_ID_KEY = 'strobePrimesStudentId';

const randomColor = () => randomIdentityColor();

const createInitialStudents = (viewerName, viewerColor) => STUDENT_DEFS.map((student, index) => ({
  ...student,
  name: index === 0 ? viewerName : student.name,
  color: index === 0 ? viewerColor : randomColor(),
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

const App = ({ role = 'teacher' }) => {
  const isTeacher = role === 'teacher';
  const wsRef = useRef(null);
  const reconnectTimerRef = useRef(null);

  const [currentPrime, setCurrentPrime] = useState(INITIAL_PRIME);
  const [studentName, setStudentName] = useState(() => readIdentityName('Μαρία'));
  const [studentColor, setStudentColor] = useState(() => readIdentityColor(randomColor()));
  const [students, setStudents] = useState(() => createInitialStudents(studentName, studentColor));
  const [activeStudentId, setActiveStudentId] = useState(STUDENT_DEFS[0].id);
  const [localStudentId, setLocalStudentId] = useState(() => {
    if (typeof window === 'undefined') {
      return STUDENT_DEFS[0].id;
    }
    return window.localStorage.getItem(PRIMES_STUDENT_ID_KEY) || STUDENT_DEFS[0].id;
  });
  const [editingName, setEditingName] = useState(false);
  const [studentNameInput, setStudentNameInput] = useState(studentName);
  const [message, setMessage] = useState('Διάλεξε μια βάση και ξεκίνα το κόσκινο.');

  const effectiveStudentId = isTeacher ? activeStudentId : localStudentId;
  const activeStudent = students.find((student) => student.id === effectiveStudentId) || students[0];
  const viewerName = isTeacher ? activeStudent?.name || '—' : studentName;
  const viewerColor = isTeacher ? activeStudent?.color || '#22c55e' : studentColor;

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

  const studentColorById = useMemo(() => {
    const map = {};
    students.forEach((student) => {
      map[student.id] = student.color;
    });
    return map;
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

  const sendMessage = (payload) => {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      return false;
    }
    ws.send(JSON.stringify(payload));
    return true;
  };

  const handleSelectPrime = (prime) => {
    if (sendMessage({ type: 'select_prime', prime })) {
      return;
    }
    setCurrentPrime(prime);
    setMessage(`Τώρα δουλεύουμε με τη βάση ${prime}. Τα πολλαπλάσιά της φωτίζονται στον πίνακα.`);
  };

  const handleSelectActiveStudent = (studentId) => {
    if (sendMessage({ type: 'select_active_student', studentId })) {
      return;
    }
    setActiveStudentId(studentId);
  };

  const saveStudentName = () => {
    const nextName = studentNameInput.trim();
    if (!nextName) {
      setStudentNameInput(studentName);
      setEditingName(false);
      return;
    }

    writeIdentityName(nextName);
    setStudentName(nextName);
    setStudentNameInput(nextName);

    if (sendMessage({
      type: 'register_student',
      studentId: localStudentId,
      name: nextName,
      color: studentColor
    })) {
      setEditingName(false);
      return;
    }

    setStudents((previousStudents) =>
      previousStudents.map((student) => (student.id === effectiveStudentId ? { ...student, name: nextName } : student))
    );
    setEditingName(false);
  };

  const saveStudentColor = (nextColor) => {
    setStudentColor(nextColor);
    writeIdentityColor(nextColor);

    if (sendMessage({
      type: 'register_student',
      studentId: localStudentId,
      name: studentName,
      color: nextColor
    })) {
      return;
    }

    setStudents((previousStudents) =>
      previousStudents.map((student) => (student.id === effectiveStudentId ? { ...student, color: nextColor } : student))
    );
  };

  const updateStudent = (studentId, updater) => {
    setStudents((previousStudents) =>
      previousStudents.map((student) => (student.id === studentId ? updater(student) : student))
    );
  };

  const handleToggleNumber = (number) => {
    if (sendMessage({ type: 'student_toggle_number', number })) {
      return;
    }

    if (number === currentPrime) {
      setMessage(`Ο ${number} είναι η βάση του βήματος, όχι πολλαπλάσιο.`);
      return;
    }

    const isTarget = number > currentPrime && number % currentPrime === 0;

    if (isTarget) {
      const ownerId = correctOwnerByNumber[number];
      if (ownerId && ownerId !== effectiveStudentId) {
        const ownerName = students.find((student) => student.id === ownerId)?.name || 'άλλος μαθητής';
        setMessage(`${number} έχει ήδη κλειδωθεί σωστά από τη/τον ${ownerName}.`);
        return;
      }

      if (ownerId === effectiveStudentId) {
        setMessage(`${number} έχει ήδη κλειδωθεί σωστά από τη/τον ${activeStudent?.name || 'μαθητή'}.`);
        return;
      }

      updateStudent(effectiveStudentId, (student) => ({
        ...student,
        selectedCorrect: [...student.selectedCorrect, number],
        selectedWrong: student.selectedWrong.filter((item) => item !== number)
      }));

      setMessage(`${viewerName || 'Ο μαθητής'} κλείδωσε σωστά το ${number}.`);
      return;
    }

    updateStudent(effectiveStudentId, (student) => {
      const hasNumber = student.selectedWrong.includes(number);
      return {
        ...student,
        selectedWrong: hasNumber
          ? student.selectedWrong.filter((item) => item !== number)
          : [...student.selectedWrong, number]
      };
    });

    setMessage(`${viewerName || 'Ο μαθητής'} σημείωσε το ${number} ως λάθος επιλογή.`);
  };

  useEffect(() => {
    let cancelled = false;

    const clearReconnect = () => {
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
    };

    const scheduleReconnect = () => {
      if (cancelled || reconnectTimerRef.current) {
        return;
      }
      reconnectTimerRef.current = setTimeout(() => {
        reconnectTimerRef.current = null;
        connect();
      }, 1200);
    };

    const registerRole = () => {
      if (isTeacher) {
        sendMessage({ type: 'register_teacher' });
        sendMessage({ type: 'request_state' });
        return;
      }

      sendMessage({
        type: 'register_student',
        studentId: localStudentId,
        name: studentName,
        color: studentColor
      });
      sendMessage({ type: 'request_state' });
    };

    const handleServerState = (payload) => {
      if (!payload || typeof payload !== 'object') {
        return;
      }

      if (Number.isFinite(Number(payload.currentPrime))) {
        setCurrentPrime(Number(payload.currentPrime));
      }

      if (typeof payload.activeStudentId === 'string' && payload.activeStudentId.trim()) {
        setActiveStudentId(payload.activeStudentId.trim());
      }

      if (Array.isArray(payload.students)) {
        setStudents(payload.students.map((student) => ({
          ...student,
          selectedCorrect: Array.isArray(student.selectedCorrect) ? student.selectedCorrect : [],
          selectedWrong: Array.isArray(student.selectedWrong) ? student.selectedWrong : []
        })));
      }

      if (!isTeacher && typeof payload.viewerStudentId === 'string' && payload.viewerStudentId.trim()) {
        const nextId = payload.viewerStudentId.trim();
        setLocalStudentId(nextId);
        window.localStorage.setItem(PRIMES_STUDENT_ID_KEY, nextId);
      }
    };

    const connect = () => {
      if (cancelled) {
        return;
      }

      const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
      const ws = new WebSocket(`${protocol}://${window.location.host}/ws/primes-lab`);
      wsRef.current = ws;

      ws.addEventListener('open', () => {
        if (cancelled) {
          return;
        }
        clearReconnect();
        registerRole();
      });

      ws.addEventListener('message', (event) => {
        let messagePayload;
        try {
          messagePayload = JSON.parse(event.data);
        } catch {
          return;
        }

        if (messagePayload?.type === 'primes_state') {
          handleServerState(messagePayload);
        }
      });

      ws.addEventListener('close', () => {
        if (!cancelled) {
          scheduleReconnect();
        }
      });
    };

    connect();

    return () => {
      cancelled = true;
      clearReconnect();
      if (wsRef.current) {
        wsRef.current.close();
      }
      wsRef.current = null;
    };
  }, [isTeacher]);

  const visibleStudents = isTeacher
    ? students
    : students.filter((student) => student.id === effectiveStudentId);

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
          <ConnectionNameControl
            connected
            name={viewerName}
            editing={!isTeacher && editingName}
            value={studentNameInput}
            onChange={setStudentNameInput}
            onStartEdit={() => !isTeacher && setEditingName(true)}
            onCommit={saveStudentName}
            onCancel={() => {
              setStudentNameInput(studentName);
              setEditingName(false);
            }}
            color={viewerColor}
            showColorPicker={!isTeacher}
            onColorChange={saveStudentColor}
            connectedLabel={isTeacher ? 'Σε σύνδεση' : 'Συνδεδεμένος'}
            disconnectedLabel="Εκτός σύνδεσης"
            namePrefix="όνομα χρήστη"
            showNameLabel={!isTeacher}
            className="primes-identity"
          />
        </header>

        <section className="common-zone primes-board-zone primes-board-zone--compact">
          <div className="primes-board-header">
            <div>
              <p>Κεντρικό πάνελ</p>
              <h2>Αριθμοί 2 έως 100</h2>
            </div>
            {isTeacher ? (
              <div className="primes-board-header__legend">
                <span className="legend-item"><i className="legend-dot legend-dot--eliminated" />κλειδωμένο</span>
                <span className="legend-item"><i className="legend-dot legend-dot--prime" />πρώτος</span>
              </div>
            ) : null}
          </div>

          <NumberGrid
            numbers={NUMBER_RANGE}
            currentPrime={currentPrime}
            primeNumbers={PRIME_NUMBERS}
            correctOwnerByNumber={correctOwnerByNumber}
            studentColorById={studentColorById}
            wrongSelectionsByNumber={wrongSelectionsByNumber}
            activeStudentId={effectiveStudentId}
            onToggleNumber={handleToggleNumber}
            mode={isTeacher ? 'teacher' : 'student'}
            readonly={isTeacher}
          />
        </section>

        {isTeacher ? (
          <section className="primes-lower-grid">
            <div className="primes-lower-column">
              <TeacherPanel
                currentPrime={currentPrime}
                primeNumbers={PRIME_NUMBERS}
                onSelectPrime={handleSelectPrime}
                students={students}
                activeStudentId={activeStudentId}
                onSelectActiveStudent={handleSelectActiveStudent}
              />

              <SelectionSummaryAccordion
                currentPrime={currentPrime}
                students={students}
                claimedNumbers={claimedNumbers}
                wrongSelectionsByNumber={wrongSelectionsByNumber}
                targetNumbers={currentTargetNumbers}
                remainingTargetNumbers={remainingTargetNumbers}
              />
            </div>

            <div className="primes-lower-column">
              <StudentsTable
                students={visibleStudents}
                activeStudentId={activeStudentId}
                currentPrime={currentPrime}
                claimedNumbers={claimedNumbers}
                wrongSelectionsByNumber={wrongSelectionsByNumber}
                studentColorById={studentColorById}
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
        ) : null}
      </div>
    </div>
  );
};

export default App;
