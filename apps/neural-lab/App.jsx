import React, { useEffect, useMemo, useRef, useState } from 'react';
import { TeacherCard } from './components/TeacherCard';
import { DatasetSelector } from './components/DatasetSelector';
import { VerticalProducts } from './components/VerticalProducts';
import { StudentTable } from './components/StudentTable';
import { ExamplesClassifier } from './components/ExamplesClassifier';
import { ActivitiesMenu, getNeuralActivityTitle } from './components/ActivitiesMenu';
import { StudentQrAccordion } from './components/StudentQrAccordion';
import { Accordion } from '../shared/components/Accordion';
import DATASETS from './data/datasets';
//import { StudentTable } from '../shared/components/StudentTable';
import './App.css';

const DEFAULT_THRESHOLD_RULE = { op: '>=', boundary: 5 };
const DEFAULT_SELECTED_INPUTS = { i1: true, i2: false };
const THRESHOLD_OPS = new Set(['>', '<', '>=', '<=']);

const normalizeThresholdRule = (rule, fallback = DEFAULT_THRESHOLD_RULE) => {
  if (!rule || typeof rule !== 'object') {
    return { ...fallback };
  }

  const op = THRESHOLD_OPS.has(rule.op) ? rule.op : fallback.op;
  const boundary = Number.isFinite(Number(rule.boundary)) ? Number(rule.boundary) : Number(fallback.boundary);
  return { op, boundary };
};

const evaluateThresholdRule = (value, rule) => {
  const numericValue = Number(value);
  const safeValue = Number.isFinite(numericValue) ? numericValue : 0;
  const safeRule = normalizeThresholdRule(rule);

  switch (safeRule.op) {
    case '>':
      return safeValue > safeRule.boundary;
    case '<':
      return safeValue < safeRule.boundary;
    case '<=':
      return safeValue <= safeRule.boundary;
    case '>=':
    default:
      return safeValue >= safeRule.boundary;
  }
};

const normalizeSelectedInputs = (value, fallback = DEFAULT_SELECTED_INPUTS) => {
  const source = value && typeof value === 'object' ? value : {};
  return {
    i1: typeof source.i1 === 'boolean' ? source.i1 : Boolean(fallback.i1),
    i2: typeof source.i2 === 'boolean' ? source.i2 : Boolean(fallback.i2)
  };
};

const resolveThresholdBySelectedInputs = (threshold, selectedInputs) => {
  if (!threshold || typeof threshold !== 'object') {
    return DEFAULT_THRESHOLD_RULE;
  }

  const hasThresholdVariants = threshold.both || threshold.i1 || threshold.i2;
  if (!hasThresholdVariants) {
    return normalizeThresholdRule(threshold);
  }

  const normalizedSelection = normalizeSelectedInputs(selectedInputs);
  const key = normalizedSelection.i1 && normalizedSelection.i2
    ? 'both'
    : normalizedSelection.i1
      ? 'i1'
      : normalizedSelection.i2
        ? 'i2'
        : 'both';

  const selectedThreshold = threshold[key] || threshold.both || threshold.i1 || threshold.i2;
  return normalizeThresholdRule(selectedThreshold);
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
  // Δείκτης του γραμμικού demo που εμφανίζεται από το τρέχον σύνολο δεδομένων (για τον δάσκαλο).
  const [currentLinearDemoIndex, setCurrentLinearDemoIndex] = useState(undefined);
  // Δείκτης του γραμμικού demo που εμφανίζεται από το τρέχον σύνολο δεδομένων (για τον μαθητή).
  const [lessonLinearDemoIndex, setLessonLinearDemoIndex] = useState(undefined);
  // Η τρέχουσα δραστηριότητα που έχει επιλέξει ο δάσκαλος.
  const [selectedActivity, setSelectedActivity] = useState('1');
  // Η δραστηριότητα που έχει οριστεί από τον δάσκαλο και εμφανίζεται στους μαθητές.
  const [lessonActivity, setLessonActivity] = useState('1');
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
  const [lessonProducts, setLessonProducts] = useState({ p1: '', p2: '' });
  const [lessonTotal, setLessonTotal] = useState('');
  const [lessonWeights, setLessonWeights] = useState({ w1: 2, w2: 3 });
  const [lessonThreshold, setLessonThreshold] = useState(DEFAULT_THRESHOLD_RULE);
  const [selectedInputs, setSelectedInputs] = useState(DEFAULT_SELECTED_INPUTS);
  const [lessonSelectedInputs, setLessonSelectedInputs] = useState(DEFAULT_SELECTED_INPUTS);
  const [lessonDataset, setLessonDataset] = useState('vehicles');
  const [lessonExampleIndex, setLessonExampleIndex] = useState(0);
  const [lessonIcon, setLessonIcon] = useState('🚗');
  const [lessonName, setLessonName] = useState('Αυτοκίνητο');
  const [lessonActivityTitle, setLessonActivityTitle] = useState(getNeuralActivityTitle('1'));
  


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
  const currentDatasetLinearDemos = DATASETS[currentDataset]?.linear_demos || [];
  const teacherThresholdFromDemo = resolveThresholdBySelectedInputs(
    currentDatasetLinearDemos[currentLinearDemoIndex]?.threshold,
    selectedInputs
  );
  const teacherThresholdRule = normalizeThresholdRule(teacherThresholdFromDemo);
  const isTeacher = role === 'teacher';
  const isScreen = role === 'screen';
  const isStudent = role === 'student';
  const activeActivity = isTeacher ? selectedActivity : lessonActivity;
  const displayIcon = isTeacher ? currentExampleData.icon : lessonIcon;
  const displayName = isTeacher ? currentExampleData.name : lessonName;

  const displayDataset = isTeacher ? currentDataset : lessonDataset;
  const safeDisplayDataset = DATASETS[displayDataset] ? displayDataset : 'vehicles';
  const effectiveSelectedInputs = isTeacher ? selectedInputs : lessonSelectedInputs;
  const showInput1 = Boolean(effectiveSelectedInputs.i1);
  const showInput2 = Boolean(effectiveSelectedInputs.i2);
  const showTotalRow = showInput1 && showInput2;

  const effectiveLinearDemoIndex = isTeacher ? currentLinearDemoIndex : lessonLinearDemoIndex;

  let demoIcon = null;
  let demoLabel = 'Μη επιλεγμένο';

  // Activities 1-3 keep right-side icon area empty.
  if (activeActivity === '4' && effectiveLinearDemoIndex !== undefined && DATASETS[safeDisplayDataset]?.linear_demos) {
    const demos = DATASETS[safeDisplayDataset].linear_demos;
    const selectedDemo = demos[effectiveLinearDemoIndex];
    if (selectedDemo) {
      const targetExample = DATASETS[safeDisplayDataset].examples.find(
        ex => ex.name === selectedDemo.example
      );
      demoIcon = targetExample ? targetExample.icon : null;
      demoLabel = selectedDemo.example || 'Μη επιλεγμένο';
    }
  }

  const toFinite = (value, fallback = 0) => {
    const num = Number(value);
    return Number.isFinite(num) ? num : fallback;
  };

  const isInputEditable = activeActivity === '1';
  const isWeightEditable = activeActivity === '3' || activeActivity === '4';
  const isProductEditable = activeActivity === '2';
  const isTotalEditable = isProductEditable;
  const isThresholdVisible = activeActivity === '3' || activeActivity === '4';
  const showThresholdUnderIcon = activeActivity === '4';
  const effectiveThresholdRule = isTeacher ? teacherThresholdRule : lessonThreshold;
  const thresholdDisplayText = `${effectiveThresholdRule.op} ${effectiveThresholdRule.boundary}`;

  const currentInputs = isTeacher
    ? teacherInputs
    : isStudent && activeActivity === '1'
      ? studentInputs
      : lessonInputs;

  const i1 = currentInputs.i1;
  const i2 = currentInputs.i2;

  const currentW1 = isTeacher
    ? dynamicW1
    : isStudent && (activeActivity === '3' || activeActivity === '4')
      ? dynamicW1
      : lessonWeights.w1;
  const currentW2 = isTeacher
    ? dynamicW2
    : isStudent && (activeActivity === '3' || activeActivity === '4')
      ? dynamicW2
      : lessonWeights.w2;

  const effectiveI1 = showInput1 ? i1 : 0;
  const effectiveI2 = showInput2 ? i2 : 0;
  const effectiveW1 = showInput1 ? currentW1 : 0;
  const effectiveW2 = showInput2 ? currentW2 : 0;

  const computedProd1 = showInput1 ? Number((toFinite(effectiveW1) * toFinite(effectiveI1)).toFixed(2)) : '';
  const computedProd2 = showInput2 ? Number((toFinite(effectiveW2) * toFinite(effectiveI2)).toFixed(2)) : '';

  const currentProducts = isTeacher ? teacherProducts : studentProducts;
  const prod1 = showInput1 ? (isProductEditable ? currentProducts.p1 : computedProd1) : '';
  const prod2 = showInput2 ? (isProductEditable ? currentProducts.p2 : computedProd2) : '';

  const computedTotal = Number((toFinite(prod1) + toFinite(prod2)).toFixed(2));
  const total = isTotalEditable
    ? (isTeacher ? teacherTotal : studentTotal)
    : (showTotalRow ? computedTotal : '');
  const isEmptyCalcInput = (value) => value === '' || value === null || typeof value === 'undefined' || value === '-';
  const useQuestionForOutputs = activeActivity === '1' || activeActivity === '3' || activeActivity === '4';
  const missingP1Input = activeActivity === '1'
    ? showInput1 && isEmptyCalcInput(i1)
    : activeActivity === '3' || activeActivity === '4'
      ? showInput1 && isEmptyCalcInput(currentW1)
      : false;
  const missingP2Input = activeActivity === '1'
    ? showInput2 && isEmptyCalcInput(i2)
    : activeActivity === '3' || activeActivity === '4'
      ? showInput2 && isEmptyCalcInput(currentW2)
      : false;
  const missingTotalInput = showTotalRow && (missingP1Input || missingP2Input);
  const displayedProd1 = !showInput1
    ? ''
    : useQuestionForOutputs && !isProductEditable && missingP1Input
      ? '?'
      : prod1;
  const displayedProd2 = !showInput2
    ? ''
    : useQuestionForOutputs && !isProductEditable && missingP2Input
      ? '?'
      : prod2;
  const displayedTotal = !showTotalRow
    ? ''
    : useQuestionForOutputs && !isTotalEditable && missingTotalInput
      ? '?'
      : total;

  // const formulaByActivity = {
  //   '1': '$$ w_1 \\times i_1 + w_2 \\times i_2 = o $$',
  //   '2': '$$ (w_1 \\times i_1) + (w_2 \\times i_2) = o $$',
  //   '3': '$$ w_1 \\times i_1 + w_2 \\times i_2 \\gt \\text{threshold} $$',
  //   '4': '$$ w_1 \\times i_1 + w_2 \\times i_2 \\gt \\text{threshold} $$'
  // };
  // const mathTitle = formulaByActivity[activeActivity] || '$$ w_1 \\times i_1 + w_2 \\times i_2 = o $$';
  const teacherActivityTitle = getNeuralActivityTitle(selectedActivity);
  const heroTitle = isTeacher ? teacherActivityTitle : (lessonActivityTitle || getNeuralActivityTitle(activeActivity));

  const threshold = {
    satisfied: showTotalRow && !missingTotalInput && evaluateThresholdRule(total, effectiveThresholdRule),
    value: thresholdDisplayText,
    rule: effectiveThresholdRule,
    total: toFinite(total)
  };
  const demoFooterText = activeActivity === '4' ? (showTotalRow ? `άθροισμα: ${displayedTotal}` : 'άθροισμα: -') : '';

  const handleWeightChange = (which, value) => {
    const normalized = value === '' || value === '-' ? value : Number(value);
    if (which === 'w1') {
      setDynamicW1(Number.isFinite(normalized) || normalized === '' || normalized === '-' ? normalized : 0);
    } else {
      setDynamicW2(Number.isFinite(normalized) || normalized === '' || normalized === '-' ? normalized : 0);
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

  const sendTeacherLessonPatch = (lessonPatch) => {
    if (!isTeacher || !isSocketConnected) return;
    sendSocketMessage({
      type: 'teacher_lesson',
      lesson: lessonPatch
    });
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
      // Όταν ανοίξει η σύνδεση WebSocket
      ws.addEventListener('open', () => {
        if (cancelled) return;
        setIsSocketConnected(true);
        hasRegisteredRef.current = false;
        registerCurrentRole();
      });
      // Όταν ληφθεί μήνυμα από τον server
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

        if (message.lesson?.products) {
          setLessonProducts({
            p1: message.lesson.products.p1 ?? '',
            p2: message.lesson.products.p2 ?? ''
          });
        }

        if (Object.prototype.hasOwnProperty.call(message.lesson, 'total')) {
          setLessonTotal(message.lesson.total ?? '');
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

        if (typeof message.lesson?.activityTitle === 'string' && message.lesson.activityTitle.trim()) {
          setLessonActivityTitle(message.lesson.activityTitle.trim());
        } else if (typeof message.lesson?.activityId === 'string') {
          setLessonActivityTitle(getNeuralActivityTitle(message.lesson.activityId));
        }

        if (Number.isInteger(Number(message.lesson?.targetIndex))) {
          setLessonTarget(Number(message.lesson.targetIndex));
        }

        if (Object.prototype.hasOwnProperty.call(message.lesson, 'threshold')) {
          const incomingThreshold = message.lesson.threshold;
          if (Number.isFinite(Number(incomingThreshold))) {
            setLessonThreshold(normalizeThresholdRule({ op: '>=', boundary: Number(incomingThreshold) }));
          } else {
            setLessonThreshold(normalizeThresholdRule(incomingThreshold));
          }
        }

        if (Object.prototype.hasOwnProperty.call(message.lesson, 'selectedInputs')) {
          setLessonSelectedInputs(normalizeSelectedInputs(message.lesson.selectedInputs));
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
        if (message.lesson && Object.prototype.hasOwnProperty.call(message.lesson, 'linearDemoIndex')) {
          const idx = Number(message.lesson.linearDemoIndex);
          if (Number.isInteger(idx) && idx >= 0) {
            setLessonLinearDemoIndex(idx);
          } else {
            setLessonLinearDemoIndex(undefined);
          }
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
            setDynamicW1((prev) => (prev === '-' ? prev : (message.me.weights.w1 ?? '')));
            setDynamicW2((prev) => (prev === '-' ? prev : (message.me.weights.w2 ?? '')));
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
      // Όταν κλείσει η σύνδεση WebSocket
      ws.addEventListener('close', () => {
        if (cancelled) return;
        setIsSocketConnected(false);
        hasRegisteredRef.current = false;
        clearReconnect();
        reconnectTimerRef.current = setTimeout(connect, 1000);
      });

      // Όταν παρουσιαστεί σφάλμα στη σύνδεση WebSocket
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
      i1: currentExampleData.i1,
      i2: currentExampleData.i2
    };

    sendSocketMessage({
      type: 'teacher_lesson',
      lesson: {
        activityId: selectedActivity,
        activityTitle: teacherActivityTitle,
        dataset: currentDataset,
        exampleIndex: currentExample,
        exampleName: currentExampleData.name,
        icon: currentExampleData.icon,
        inputs: lessonInputsPayload,
        weights: {
          w1: dynamicW1,
          w2: dynamicW2
        },
        selectedInputs,
        threshold: teacherThresholdRule,
        linearDemoIndex: currentLinearDemoIndex
      }
    });
  }, [
    isTeacher,
    isSocketConnected,
    selectedActivity,
    teacherActivityTitle,
    currentDataset,
    currentExample,
    currentExampleData.name,
    currentExampleData.icon,
    dynamicW1,
    dynamicW2,
    teacherThresholdRule.op,
    teacherThresholdRule.boundary,
    currentLinearDemoIndex,
    selectedInputs.i1,
    selectedInputs.i2
  ]);

  useEffect(() => {
    if (!isTeacher) {
      return;
    }

    if (selectedActivity === '1') {
      // Activity 1: Inputs always empty for teacher to provide
      setTeacherInputs({ i1: '', i2: '' });
      setStudentInputs({ i1: '', i2: '' });
      // Reset linear demo to disabled state
      setCurrentLinearDemoIndex(undefined);
    }

    if (selectedActivity === '2') {
      // Auto-fill inputs from example
      setTeacherInputs({ i1: currentExampleData.i1, i2: currentExampleData.i2 });
      setTeacherProducts({ p1: '', p2: '' });
      setTeacherTotal('');
      setStudentProducts({ p1: '', p2: '' });
      setStudentTotal('');
      setStudentInputs({ i1: '', i2: '' });
      // Reset linear demo to disabled state
      setCurrentLinearDemoIndex(undefined);
    }

    if (selectedActivity === '3') {
      // Auto-fill inputs from example for weight adjustment activity
      setTeacherInputs({ i1: currentExampleData.i1, i2: currentExampleData.i2 });
      setDynamicW1('');
      setDynamicW2('');
      // Reset linear demo to disabled state
      setCurrentLinearDemoIndex(undefined);
    }

    if (selectedActivity === '4') {
      // Auto-fill inputs from example for threshold activity
      setTeacherInputs({ i1: currentExampleData.i1, i2: currentExampleData.i2 });
      setDynamicW1('');
      setDynamicW2('');
      // Auto-select first linear_demo for threshold activity
      setCurrentLinearDemoIndex(0);
    }

    if (selectedActivity !== '3' && selectedActivity !== '4') {
      setDynamicW1((prev) => (prev === '' ? 2 : prev));
      setDynamicW2((prev) => (prev === '' ? 3 : prev));
    }
  }, [isTeacher, selectedActivity, currentExampleData.i1, currentExampleData.i2]);

  useEffect(() => {
    if (!isStudent) {
      return;
    }

    if (lessonActivity === '2') {
      setStudentProducts({ p1: '', p2: '' });
      setStudentTotal('');
    }

    if (lessonActivity === '3' || lessonActivity === '4') {
      setDynamicW1('');
      setDynamicW2('');
    }
  }, [isStudent, lessonActivity, lessonExampleIndex]);

  const sortedParticipants = [...participants].sort((a, b) => String(a.name || '').localeCompare(String(b.name || '')));

  return (
    <TeacherCard title={heroTitle}>
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
          demoIcon={demoIcon}
          demoLabel={demoLabel}
          features={DATASETS[safeDisplayDataset].features}
          prod1={displayedProd1}
          prod2={displayedProd2}
          w1={currentW1}
          w2={currentW2}
          i1={i1}
          i2={i2}
          total={displayedTotal}
          showInput1={showInput1}
          showInput2={showInput2}
          showTotal={showTotalRow}
          editWeights={isWeightEditable}
          onWeightChange={handleWeightChange}
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
          showThreshold={isThresholdVisible}
          thresholdValue={demoFooterText}
          showThresholdUnderIcon={showThresholdUnderIcon}
        />
      </div>
        
      {(isTeacher || isScreen || isStudent) && (
        <div className="live-table-wrap">
          <ExamplesClassifier
            datasets={DATASETS}
            currentDataset={safeDisplayDataset}
            currentLinearDemoIndex={effectiveLinearDemoIndex}
            activityId={activeActivity}
            selectedInputs={effectiveSelectedInputs}
            features={DATASETS[safeDisplayDataset].features}
            weights={{ w1: currentW1, w2: currentW2 }}
          />
        </div>
      )}

      {(isTeacher || isScreen) && (
        <div className="live-table-wrap">
          <StudentTable
            i1={lessonInputs.i1}
            i2={lessonInputs.i2}
            selectedInputs={lessonSelectedInputs}
            features={DATASETS[safeDisplayDataset].features}
            threshold={effectiveThresholdRule}
            participants={sortedParticipants}
            activity={lessonActivity}
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
            currentLinearDemoIndex={currentLinearDemoIndex}
            selectedInputs={selectedInputs}
            features={DATASETS[safeDisplayDataset].features}
            onDatasetChange={(dataset) => {
              const nextExampleData = DATASETS[dataset]?.examples?.[0];
              setCurrentDataset(dataset);
              setCurrentExample(0);
              setCurrentLinearDemoIndex(0);

              if (nextExampleData) {
                sendTeacherLessonPatch({
                  dataset,
                  exampleIndex: 0,
                  exampleName: nextExampleData.name,
                  icon: nextExampleData.icon,
                  inputs: {
                    i1: nextExampleData.i1,
                    i2: nextExampleData.i2
                  },
                  linearDemoIndex: 0
                });
              } else {
                sendTeacherLessonPatch({ dataset });
              }
            }}
            onExampleChange={setCurrentExample}
            onLinearDemoChange={setCurrentLinearDemoIndex}
            onSelectedInputsChange={(next) => {
              const normalized = normalizeSelectedInputs(next);
              setSelectedInputs(normalized);
              sendTeacherLessonPatch({ selectedInputs: normalized });
            }}
            isLinearDemoDisabled={['1', '2', '3'].includes(selectedActivity)}
            demoIconWhenDisabled="?"
          />

          <StudentQrAccordion />
          
        </>
      )}

      
      
    </TeacherCard>
  );
};

export default App;
