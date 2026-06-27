import React, { useEffect, useMemo, useRef, useState } from 'react';
import { TeacherCard } from './components/TeacherCard';
import { DatasetSelector } from './components/DatasetSelector';
import { VerticalProducts } from './components/VerticalProducts';
import { StudentTable } from './components/StudentTable';
import { ActivitiesMenu } from './components/ActivitiesMenu';
import { Accordion } from '../shared/components/Accordion';
//import { StudentTable } from '../shared/components/StudentTable';
import './App.css';

const DATASETS = {
  vehicles: {
  label: 'Οχήματα',
  emoji: '🚗',
  features: {
      i1: { label: 'Ρόδες', icon: '🛞' },
      i2: { label: 'Μηχανές', icon: '⚙️' }
    },
  examples: [
    // --- Με κινητήρα (i2 >= 1) ---
    { name: 'Αυτοκίνητο',    i1: 4,  i2: 1, icon: '🚗' },
    { name: 'Μηχανάκι',      i1: 2,  i2: 1, icon: '🛵' },
    //{ name: 'Φορτηγό',       i1: 6,  i2: 1, icon: '🚛' },
    //{ name: 'Τρακτέρ',       i1: 4,  i2: 1, icon: '🚜' },
    { name: 'Λεωφορείο',     i1: 8,  i2: 1, icon: '🚌' },
    //{ name: 'Πυροσβεστικό',  i1: 8,  i2: 1, icon: '🚒' },
    //{ name: 'Ασθενοφόρο',    i1: 4,  i2: 1, icon: '🚑' },
    { name: 'Ιστιοφόρο',        i1: 0,  i2: 0, icon: '⛵' },
    { name: 'Πλοίο',        i1: 0,  i2: 1, icon: '🚢' },
    { name: 'Αεροπλάνο',     i1: 6,  i2: 2, icon: '✈️' },
    // --- Χωρίς κινητήρα (i2 = 0) ---
    { name: 'Ποδήλατο',      i1: 2,  i2: 0, icon: '🚲' },
    { name: 'Παιδικό Πατίνι',i1: 3,  i2: 0, icon: '🛴' },
    { name: 'Καροτσάκι',     i1: 4,  i2: 0, icon: '🛒' },
    { name: 'Αναπηρικό',     i1: 4,  i2: 0, icon: '🦽' },
  ]
  },
  digits: {
  label: 'Ψηφία',
  emoji: '🔢',
  features: {
      i1: { label: 'Κύκλοι', icon: '⭕' },
      i2: { label: 'Σταυροδρόμια', icon: '➕' }
    },
  examples: [
    { name: 'Μηδέν', i1: 1, i2: 0, icon: '0️⃣' },
    { name: 'Ένα',   i1: 0, i2: 0, icon: '1️⃣' },
    { name: 'Δύο',   i1: 0, i2: 0, icon: '2️⃣' },
    { name: 'Τρία',  i1: 0, i2: 0, icon: '3️⃣' },
    { name: 'Τέσσερα', i1: 1, i2: 1, icon: '4️⃣' },
    { name: 'Πέντε', i1: 0, i2: 0, icon: '5️⃣' },
    { name: 'Έξι',   i1: 1, i2: 1, icon: '6️⃣' },
    { name: 'Επτά',  i1: 0, i2: 0, icon: '7️⃣' },
    { name: 'Οκτώ',  i1: 2, i2: 1, icon: '8️⃣' },
    { name: 'Εννέα', i1: 1, i2: 1, icon: '9️⃣' },
  ]
  }
};

const App = ({ role = 'teacher' }) => {
  // Σταθερές αναφορές (refs) για την αποθήκευση αντικειμένων που 
  // δεν προκαλούν επανασχεδιασμό όταν αλλάζουν.

  // Αναφορά στο αντικείμενο WebSocket για την επικοινωνία με τον server.
  const wsRef = useRef(null);
  // Αναφορά για τον χρονοδιακόπτη επανασύνδεσης
  const reconnectTimerRef = useRef(null);
  // Αναφορά για να ελέγχει αν έχει γίνει ήδη η εγγραφή του ρόλου 
  // (teacher/student/screen) στον server.
  const hasRegisteredRef = useRef(false);
  // Αναφορά για να καταστείλει την αποστολή κατάστασης του μαθητή στον server, 
  // όταν η κατάσταση έχει ενημερωθεί από τον server.
  const suppressNextStudentStateSendRef = useRef(false);
  // Αναφορά για να αποθηκεύει την τελευταία κατάσταση του μαθητή που στάλθηκε στον server.
  // αποφεύγει την αποστολή της ίδιας κατάστασης πολλές φορές.
  const lastSentStudentStateRef = useRef('');

  // --- State Variables ---
  // Δεδομένα που αλλάζουν δυναμικά, κατά τη διάρκεια ζωής της εφαρμογής, 
  // επηρεάζοντας εμφάνιση και συμπεριφορά της εφαρμογής.
  // const [state, setState] = useState(initialValue);
  // σταθερά [τρέχουσα τιμή, συνάρτηση ενημέρωσης] = useState(αρχική τιμή);
  // Αλλάζοντας το currentDataset αλλάζει το σύνολο δεδομένων
  const [currentDataset, setCurrentDataset] = useState('vehicles');
  // Δείκτης του παραδείγματος που εμφανίζεται από το τρέχον σύνολο δεδομένων.
  const [currentExample, setCurrentExample] = useState(0);
  // Η τρέχουσα δραστηριότητα που έχει επιλέξει ο δάσκαλος.
  const [selectedActivity, setSelectedActivity] = useState('1a');
  // Η δραστηριότητα που έχει οριστεί από τον δάσκαλο και εμφανίζεται στους μαθητές.
  const [lessonActivity, setLessonActivity] = useState('1a');
  // Τα υπόλοιπα state variables αφορούν τις εισόδους, τα βάρη, τα προϊόντα και το συνολικό αποτέλεσμα για τον δάσκαλο και τους μαθητές.
  const [teacherInputs, setTeacherInputs] = useState({ i1: 4, i2: 1 });
  const [studentInputs, setStudentInputs] = useState({ i1: '', i2: '' });
  const [teacherProducts, setTeacherProducts] = useState({ p1: '', p2: '' });
  const [studentProducts, setStudentProducts] = useState({ p1: '', p2: '' });
  const [teacherTotal, setTeacherTotal] = useState('');
  const [studentTotal, setStudentTotal] = useState('');
  const [dynamicW1, setDynamicW1] = useState(2);
  const [dynamicW2, setDynamicW2] = useState(3);
  // Το isSocketConnected δείχνει αν η σύνδεση WebSocket είναι ενεργή ή όχι.
  const [isSocketConnected, setIsSocketConnected] = useState(false);
  // Ποιοι και πόσοι συνδεδεμένοι μαθητές υπάρχουν αυτή τη στιγμή (χρησιμοποιείται μόνο από τον δάσκαλο).
  const [participants, setParticipants] = useState([]);
  const [roster, setRoster] = useState([]);
  const [lessonInputs, setLessonInputs] = useState({ i1: 4, i2: 1 });
  const [lessonWeights, setLessonWeights] = useState({ w1: 2, w2: 3 });
  const [lessonThreshold, setLessonThreshold] = useState(5);
  const [lessonDataset, setLessonDataset] = useState('vehicles');
  const [lessonExampleIndex, setLessonExampleIndex] = useState(0);
  const [lessonIcon, setLessonIcon] = useState('🚗');
  const [lessonName, setLessonName] = useState('Αυτοκίνητο');
  


// Δημιουργεί ένα τυχαίο όνομα μαθητή αν δεν υπάρχει αποθηκευμένο στο localStorage.
  const [studentName, setStudentName] = useState(() => {
  try {
    const stored = localStorage.getItem('strobeStudentConnectName');
    return stored || `Student-${Math.floor(Math.random() * 900 + 100)}`;
  } catch {
    return `Student-${Math.floor(Math.random() * 900 + 100)}`;
  }
});
const saveStudentName = () => {
  const newName = studentNameInput.trim();

  if (!newName || newName === studentName) {
    setStudentNameInput(studentName);
    setEditingName(false);
    return;
  }

  localStorage.setItem('strobeStudentConnectName', newName);

  sendSocketMessage({
    type: 'register_student',
    name: newName
  });

  // αν το studentName είναι state:
  setStudentName(newName);
  setEditingName(false);
};
  // Αναφορά για να ελέγχει αν ο μαθητής επεξεργάζεται το όνομά του.
  const [editingName, setEditingName] = useState(false);
  // Αναφορά για να αποθηκεύει την είσοδο του ονόματος του μαθητή.
  const [studentNameInput, setStudentNameInput] = useState(studentName);
  
  
  const currentExampleData = DATASETS[currentDataset].examples[currentExample];
  const isTeacher = role === 'teacher';
  const isScreen = role === 'screen';
  const isStudent = role === 'student';
  const activeActivity = isTeacher ? selectedActivity : lessonActivity;
  const displayIcon = isTeacher ? currentExampleData.icon : lessonIcon;
  const displayName = isTeacher ? currentExampleData.name : lessonName;
  const displayDataset = isTeacher ? currentDataset : lessonDataset;
  const safeDisplayDataset = DATASETS[displayDataset] ? displayDataset : 'vehicles';

  const toFinite = (value, fallback = 0) => {
    const num = Number(value);
    return Number.isFinite(num) ? num : fallback;
  };

  const isInputEditable = (isTeacher && (activeActivity === '1a' || activeActivity === '1b'))
    || (isStudent && activeActivity === '1b');
  const isWeightEditable = (isTeacher && activeActivity === '3a')
    || (isStudent && activeActivity === '3b');
  const isProductEditable = (isTeacher && activeActivity === '2a')
    || (isStudent && activeActivity === '2b');
  const isTotalEditable = isProductEditable;

  const currentInputs = isTeacher
    ? teacherInputs
    : isStudent && activeActivity === '1b'
      ? studentInputs
      : lessonInputs;

  const i1 = currentInputs.i1;
  const i2 = currentInputs.i2;

  const currentW1 = isTeacher
    ? dynamicW1
    : isStudent && activeActivity === '3b'
      ? dynamicW1
      : lessonWeights.w1;
  const currentW2 = isTeacher
    ? dynamicW2
    : isStudent && activeActivity === '3b'
      ? dynamicW2
      : lessonWeights.w2;

  const computedProd1 = Number((toFinite(currentW1) * toFinite(i1)).toFixed(2));
  const computedProd2 = Number((toFinite(currentW2) * toFinite(i2)).toFixed(2));

  const currentProducts = isTeacher ? teacherProducts : studentProducts;
  const prod1 = isProductEditable ? currentProducts.p1 : computedProd1;
  const prod2 = isProductEditable ? currentProducts.p2 : computedProd2;

  const computedTotal = Number((toFinite(prod1) + toFinite(prod2)).toFixed(2));
  const total = isTotalEditable
    ? (isTeacher ? teacherTotal : studentTotal)
    : computedTotal;

  const formulaByActivity = {
    '1a': '$$ w_1 \\times i_1 + w_2 \\times i_2 = o $$',
    '1b': '$$ w_1 \\times i_1 + w_2 \\times i_2 = o $$',
    '2a': '$$ (w_1 \\times i_1) + (w_2 \\times i_2) = o $$',
    '2b': '$$ (w_1 \\times i_1) + (w_2 \\times i_2) = o $$',
    '3a': '$$ w_1 \\times i_1 + w_2 \\times i_2 = o \\; (\\text{προσαρμογή βαρών}) $$',
    '3b': '$$ w_1 \\times i_1 + w_2 \\times i_2 = o \\; (\\text{προσαρμογή βαρών}) $$'
  };
  const mathTitle = formulaByActivity[activeActivity] || '$$ w_1 \\times i_1 + w_2 \\times i_2 = o $$';

  const threshold = {
    satisfied: toFinite(total) >= toFinite(lessonThreshold, 5),
    value: lessonThreshold,
    total: toFinite(total)
  };

  const handleWeightChange = (which, value) => {
    const normalized = value === '' ? '' : Number(value);
    if (which === 'w1') {
      setDynamicW1(Number.isFinite(normalized) || normalized === '' ? normalized : 0);
    } else {
      setDynamicW2(Number.isFinite(normalized) || normalized === '' ? normalized : 0);
    }
  };

  const sendSocketMessage = (payload) => {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) return false;
    try {
      ws.send(JSON.stringify(payload));
      return true;
    } catch {
      return false;
    }
  };

  useEffect(() => {
    let cancelled = false;

    const clearReconnect = () => {
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
    };

    const registerCurrentRole = () => {
      if (hasRegisteredRef.current) return;

      if (isStudent) {
        sendSocketMessage({ type: 'register_student', name: studentName });
      } else if (isScreen) {
        sendSocketMessage({ type: 'register_teacher', name: 'Screen' });
      } else {
        sendSocketMessage({ type: 'register_teacher', name: 'Teacher' });
      }

      sendSocketMessage({ type: 'request_state' });
      hasRegisteredRef.current = true;
    };

    const connect = () => {
      if (cancelled) return;
      const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
      const ws = new WebSocket(`${protocol}://${window.location.host}/ws/neural-lab`);
      wsRef.current = ws;

      ws.addEventListener('open', () => {
        if (cancelled) return;
        setIsSocketConnected(true);
        hasRegisteredRef.current = false;
        registerCurrentRole();
      });

      ws.addEventListener('message', (event) => {
        let message;
        try {
          message = JSON.parse(event.data);
        } catch {
          return;
        }

        if (message?.type !== 'canvas_state') return;

        if (message.lesson?.inputs) {
          setLessonInputs({
            i1: message.lesson.inputs.i1 ?? '',
            i2: message.lesson.inputs.i2 ?? ''
          });
        }

        if (message.lesson?.weights && typeof message.lesson.weights === 'object') {
          setLessonWeights({
            w1: message.lesson.weights.w1 ?? 2,
            w2: message.lesson.weights.w2 ?? 3
          });
        }

        if (typeof message.lesson?.activityId === 'string') {
          setLessonActivity(message.lesson.activityId);
        }

        if (Number.isFinite(Number(message.lesson?.threshold))) {
          setLessonThreshold(Number(message.lesson.threshold));
        }

        if (typeof message.lesson?.dataset === 'string' && DATASETS[message.lesson.dataset]) {
          setLessonDataset(message.lesson.dataset);
        }

        if (Number.isInteger(Number(message.lesson?.exampleIndex))) {
          const nextIndex = Number(message.lesson.exampleIndex);
          const sourceDataset = (typeof message.lesson?.dataset === 'string' && DATASETS[message.lesson.dataset])
            ? message.lesson.dataset
            : 'vehicles';
          const maxIdx = DATASETS[sourceDataset].examples.length - 1;
          setLessonExampleIndex(Math.max(0, Math.min(maxIdx, nextIndex)));
        }

        if (typeof message.lesson?.icon === 'string' && message.lesson.icon.trim()) {
          setLessonIcon(message.lesson.icon.trim());
        }

        if (typeof message.lesson?.exampleName === 'string' && message.lesson.exampleName.trim()) {
          setLessonName(message.lesson.exampleName.trim());
        }

        if (Array.isArray(message.participants)) {
          setParticipants(message.participants);
        }

        if (Array.isArray(message.roster)) {
          setRoster(message.roster);
        }

        if (isStudent && message.me) {
          suppressNextStudentStateSendRef.current = true;

          if (message.me.weights) {
            setDynamicW1(message.me.weights.w1 ?? 0);
            setDynamicW2(message.me.weights.w2 ?? 0);
          }

          if (message.me.inputs) {
            setStudentInputs({
              i1: message.me.inputs.i1 ?? '',
              i2: message.me.inputs.i2 ?? ''
            });
          }

          if (message.me.products) {
            setStudentProducts({
              p1: message.me.products.p1 ?? '',
              p2: message.me.products.p2 ?? ''
            });
          }

          if (Object.prototype.hasOwnProperty.call(message.me, 'total')) {
            setStudentTotal(message.me.total ?? '');
          }
        }
      });

      ws.addEventListener('close', () => {
        if (cancelled) return;
        setIsSocketConnected(false);
        hasRegisteredRef.current = false;
        clearReconnect();
        reconnectTimerRef.current = setTimeout(connect, 1000);
      });

      ws.addEventListener('error', () => {
        if (!cancelled) setIsSocketConnected(false);
      });
    };

    connect();

    return () => {
      cancelled = true;
      clearReconnect();
      const ws = wsRef.current;
      wsRef.current = null;
      hasRegisteredRef.current = false;
      if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) {
        ws.close();
      }
    };
  }, [isScreen, isStudent, studentName]);

  useEffect(() => {
    if (!isStudent || !isSocketConnected) return;
    if (suppressNextStudentStateSendRef.current) {
      suppressNextStudentStateSendRef.current = false;
      return;
    }

    const payload = {
      type: 'student_state',
      state: {
        weights: { w1: dynamicW1, w2: dynamicW2 },
        inputs: { i1: studentInputs.i1, i2: studentInputs.i2 },
        products: { p1: studentProducts.p1, p2: studentProducts.p2 },
        total: studentTotal
      }
    };
    const serialized = JSON.stringify(payload);
    if (serialized === lastSentStudentStateRef.current) {
      return;
    }

    lastSentStudentStateRef.current = serialized;
    sendSocketMessage(payload);
  }, [dynamicW1, dynamicW2, studentInputs.i1, studentInputs.i2, studentProducts.p1, studentProducts.p2, studentTotal, isSocketConnected, isStudent]);

  useEffect(() => {
    if (!isTeacher || !isSocketConnected) return;
    const lessonInputsPayload = {
      i1: teacherInputs.i1,
      i2: teacherInputs.i2
    };

    sendSocketMessage({
      type: 'teacher_lesson',
      lesson: {
        activityId: selectedActivity,
        dataset: currentDataset,
        exampleIndex: currentExample,
        exampleName: currentExampleData.name,
        icon: currentExampleData.icon,
        inputs: lessonInputsPayload,
        weights: {
          w1: dynamicW1,
          w2: dynamicW2
        },
        threshold: lessonThreshold
      }
    });
  }, [
    isTeacher,
    isSocketConnected,
    selectedActivity,
    currentDataset,
    currentExample,
    currentExampleData.name,
    currentExampleData.icon,
    dynamicW1,
    dynamicW2,
    teacherInputs.i1,
    teacherInputs.i2,
    lessonThreshold
  ]);

  useEffect(() => {
    if (!isTeacher) {
      return;
    }

    if (selectedActivity === '1a') {
      setTeacherInputs({ i1: currentExampleData.i1, i2: currentExampleData.i2 });
    }

    if (selectedActivity === '1b') {
      setTeacherInputs({ i1: '', i2: '' });
      setStudentInputs({ i1: '', i2: '' });
    }

    if (selectedActivity === '2a' || selectedActivity === '2b') {
      setTeacherProducts({ p1: '', p2: '' });
      setTeacherTotal('');
      if (selectedActivity === '2b') {
        setStudentProducts({ p1: '', p2: '' });
        setStudentTotal('');
      }
    }

    if (selectedActivity === '3a') {
      setDynamicW1('');
      setDynamicW2('');
    }

    if (selectedActivity !== '3a') {
      setDynamicW1((prev) => (prev === '' ? 2 : prev));
      setDynamicW2((prev) => (prev === '' ? 3 : prev));
    }
  }, [isTeacher, selectedActivity, currentExampleData.i1, currentExampleData.i2]);

  useEffect(() => {
  const renderMath = () => {
    const mj = window.MathJax;
    if (!mj) return;

    if (typeof mj.typesetPromise === 'function') {
      mj.typesetPromise().catch((err) => console.error('MathJax error:', err));
      return;
    }

    if (mj.Hub && typeof mj.Hub.Queue === 'function') {
      mj.Hub.Queue(['Typeset', mj.Hub]);
    }
  };

  // Μικρή καθυστέρηση για να προλάβει το React να κάνει render το innerHTML
  const timeoutId = setTimeout(renderMath, 50);
  return () => clearTimeout(timeoutId);
}, [role, currentDataset, currentExample, selectedActivity, lessonActivity, dynamicW1, dynamicW2, teacherInputs.i1, teacherInputs.i2, studentInputs.i1, studentInputs.i2]);
  const sortedParticipants = [...participants].sort((a, b) => String(a.name || '').localeCompare(String(b.name || '')));

  return (
    <TeacherCard title={mathTitle}>
      <div className="connection-status">
        <span className={`status-dot ${isSocketConnected ? 'online' : 'offline'}`}></span>
        <strong>{isSocketConnected ? 'Σε σύνδεση' : 'Εκτός σύνδεσης'}</strong>
        {/*isStudent && <span>όνομα: {studentName}</span>*/}
        {isStudent && (
        editingName ? (
          <input
            autoFocus
            value={studentNameInput}
            onChange={(e) => setStudentNameInput(e.target.value)}
            onBlur={saveStudentName}
            onKeyDown={(e) => {
              if (e.key === 'Enter') saveStudentName();
              if (e.key === 'Escape') {
                setStudentNameInput(studentName);
                setEditingName(false);
              }
            }}
          />
        ) : (
          <span
            style={{ cursor: 'pointer', textDecoration: 'underline' }}
            onClick={() => setEditingName(true)}
          >
            όνομα: {studentName}
          </span>
        )
      )}
        {!isStudent && <span>συνδεδεμένοι: {roster.length}</span>}
      </div>

      {isScreen && (
        <>
          <div className="screen-top-bar">
            <strong>Προβολή τάξης</strong>
            <span>{DATASETS[safeDisplayDataset].emoji} {DATASETS[safeDisplayDataset].label}</span>
            <span>{displayIcon} {displayName}</span>
            <span>i1={i1}, i2={i2}</span>
            <span>w1={currentW1}, w2={currentW2}</span>
            <span>o={total}</span>
          </div>
          <div className="operation-tree" aria-label="Δέντρο πράξεων">
            <div className="tree-level">
              <div className="tree-node tree-root">o = {total}</div>
            </div>
            <div className="tree-connect"></div>
            <div className="tree-level tree-two">
              <div className="tree-node">w1 × i1 = {prod1}</div>
              <div className="tree-node">w2 × i2 = {prod2}</div>
            </div>
          </div>
        </>
      )}

      <div className="common-zone">
        <VerticalProducts
          icon={displayIcon}
          features={DATASETS[safeDisplayDataset].features}
          prod1={prod1}
          prod2={prod2}
          w1={currentW1}
          w2={currentW2}
          i1={i1}
          i2={i2}
          total={total}
          editWeights={isWeightEditable}
          onWeightChange={handleWeightChange}
          onRefresh={null}
          threshold={threshold}
          studentAnswerMode={false}
          studentAnswer=""
          onStudentAnswerChange={null}
          inputEditable={isInputEditable}
          productEditable={isProductEditable}
          totalEditable={isTotalEditable}
          totalValue={isTeacher ? teacherTotal : studentTotal}
          onInputChange={(field, value) => {
            if (isTeacher) {
              setTeacherInputs((prev) => ({ ...prev, [field]: value }));
            } else if (isStudent) {
              setStudentInputs((prev) => ({ ...prev, [field]: value }));
            }
          }}
          onProductChange={(field, value) => {
            if (isTeacher) {
              setTeacherProducts((prev) => ({ ...prev, [field]: value }));
            } else if (isStudent) {
              setStudentProducts((prev) => ({ ...prev, [field]: value }));
            }
          }}
          onTotalChange={(value) => {
            if (isTeacher) {
              setTeacherTotal(value);
            } else if (isStudent) {
              setStudentTotal(value);
            }
          }}
          inputPlaceholder="συμπλήρωσε"
          weightPlaceholder="βάρος"
          productPlaceholder="υπολογισμός"
          totalPlaceholder="δώσε o"
        />
      </div>

      {(isTeacher || isScreen) && (
        <div className="live-table-wrap">
          <StudentTable
            i1={lessonInputs.i1}
            i2={lessonInputs.i2}
            features={DATASETS[safeDisplayDataset].features}
            threshold={lessonThreshold}
            participants={sortedParticipants}
          />
        </div>
      )}

      {isTeacher && (
        <>

          <ActivitiesMenu value={selectedActivity} onChange={setSelectedActivity} />

          <DatasetSelector
            datasets={DATASETS}
            currentDataset={currentDataset}
            currentExample={currentExample}
            onDatasetChange={(dataset) => {
              setCurrentDataset(dataset);
              setCurrentExample(0);
            }}
            onExampleChange={setCurrentExample}
          />
          
        </>
      )}

      
      
    </TeacherCard>
  );
};

export default App;
