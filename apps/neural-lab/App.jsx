import React, { useEffect, useMemo, useRef, useState } from 'react';
import { TeacherCard } from './components/TeacherCard';
import { VerticalProducts } from './components/VerticalProducts';
import { StudentTable } from './components/StudentTable';
import './App.css';

const DATASETS = {
  vehicles: {
    label: 'Οχήματα',
    emoji: '🚗',
    examples: [
      { name: 'Αυτοκίνητο', i1: 4, i2: 1, icon: '🚗' },
      { name: 'Μοτοσυκλέτα', i1: 2, i2: 1, icon: '🏍️' },
      { name: 'Φορτηγό', i1: 6, i2: 2, icon: '🚛' },
      { name: 'Ποδήλατο', i1: 2, i2: 0, icon: '🚲' }
    ]
  },
  animals: {
    label: 'Ζώα',
    emoji: '🐾',
    examples: [
      { name: 'Σκύλος', i1: 4, i2: 0, icon: '🐕' },
      { name: 'Γάτα', i1: 4, i2: 0, icon: '🐈' },
      { name: 'Ελέφαντας', i1: 4, i2: 0, icon: '🐘' },
      { name: 'Πουλί', i1: 2, i2: 0, icon: '🐦' }
    ]
  },
  foods: {
    label: 'Φαγητά',
    emoji: '🍕',
    examples: [
      { name: 'Πίτσα', i1: 8, i2: 1, icon: '🍕' },
      { name: 'Σαλάτα', i1: 2, i2: 0, icon: '🥗' },
      { name: 'Παστίτσιο', i1: 6, i2: 1, icon: '🍝' },
      { name: 'Μπέργκερ', i1: 4, i2: 1, icon: '🍔' }
    ]
  },
  fruits: {
    label: 'Φρούτα',
    emoji: '🍎',
    examples: [
      { name: 'Μήλο', i1: 1, i2: 0, icon: '🍎' },
      { name: 'Μπανάνα', i1: 1, i2: 0, icon: '🍌' },
      { name: 'Πορτοκάλι', i1: 1, i2: 0, icon: '🍊' },
      { name: 'Σταφύλι', i1: 1, i2: 0, icon: '🍇' }
    ]
  },
  digits: {
    label: 'Ψηφία',
    emoji: '🔢',
    examples: [
      { name: 'Μηδέν', i1: 0, i2: 0, icon: '0️⃣' },
      { name: 'Ένα', i1: 1, i2: 1, icon: '1️⃣' },
      { name: 'Πέντε', i1: 5, i2: 5, icon: '5️⃣' },
      { name: 'Εννέα', i1: 9, i2: 9, icon: '9️⃣' }
    ]
  }
};

const App = ({ role = 'teacher' }) => {
  const wsRef = useRef(null);
  const reconnectTimerRef = useRef(null);
  const hasRegisteredRef = useRef(false);
  const suppressNextStudentWeightsSendRef = useRef(false);
  const lastSentStudentWeightsRef = useRef({ w1: null, w2: null });

  const [currentDataset, setCurrentDataset] = useState('vehicles');
  const [currentExample, setCurrentExample] = useState(0);
  const [useQuestionMarks, setUseQuestionMarks] = useState(false);
  const [editWeights, setEditWeights] = useState(false);
  const [thresholdEnabled, setThresholdEnabled] = useState(false);
  const [thresholdOp, setThresholdOp] = useState('gt');
  const [thresholdValue, setThresholdValue] = useState(10);
  const [dynamicW1, setDynamicW1] = useState(2);
  const [dynamicW2, setDynamicW2] = useState(3);
  const [isSocketConnected, setIsSocketConnected] = useState(false);
  const [participants, setParticipants] = useState([]);
  const [roster, setRoster] = useState([]);
  const [lessonInputs, setLessonInputs] = useState({ i1: 2, i2: 3 });
  const [lessonThreshold, setLessonThreshold] = useState(5);
  const [lessonDataset, setLessonDataset] = useState('vehicles');
  const [lessonExampleIndex, setLessonExampleIndex] = useState(0);
  const [lessonIcon, setLessonIcon] = useState('🚗');
  const [lessonName, setLessonName] = useState('Αυτοκίνητο');
  const [lessonUseQuestionMarks, setLessonUseQuestionMarks] = useState(false);
  const [studentAnswer, setStudentAnswer] = useState('');

  const studentName = useMemo(() => {
    try {
      const stored = String(window.localStorage.getItem('strobeStudentConnectName') || '').trim();
      return stored || `Student-${Math.floor(Math.random() * 900 + 100)}`;
    } catch {
      return `Student-${Math.floor(Math.random() * 900 + 100)}`;
    }
  }, []);

  const currentExampleData = DATASETS[currentDataset].examples[currentExample];
  const isTeacher = role === 'teacher';
  const isScreen = role === 'screen';
  const isStudent = role === 'student';

  const effectiveUseQuestionMarks = isTeacher ? useQuestionMarks : lessonUseQuestionMarks;
  const displayIcon = isTeacher ? currentExampleData.icon : lessonIcon;
  const displayName = isTeacher ? currentExampleData.name : lessonName;
  const displayDataset = isTeacher ? currentDataset : lessonDataset;
  const safeDisplayDataset = DATASETS[displayDataset] ? displayDataset : 'vehicles';

  const i1 = isTeacher ? currentExampleData.i1 : lessonInputs.i1;
  const i2 = isTeacher ? currentExampleData.i2 : lessonInputs.i2;
  const isWeightEditable = isStudent || (isTeacher && editWeights);
  const w1 = isWeightEditable ? dynamicW1 : 2;
  const w2 = isWeightEditable ? dynamicW2 : 3;
  const prod1 = w1 * i1;
  const prod2 = w2 * i2;
  const total = prod1 + prod2;

  const threshold = thresholdEnabled && !isStudent ? {
    satisfied: thresholdOp === 'gt' ? total > thresholdValue : total < thresholdValue,
    op: thresholdOp,
    value: thresholdValue,
    total: total
  } : null;

  const handleWeightChange = (which, value) => {
    if (which === 'w1') {
      setDynamicW1(value);
    } else {
      setDynamicW2(value);
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
            i1: Number.isFinite(Number(message.lesson.inputs.i1)) ? Number(message.lesson.inputs.i1) : 2,
            i2: Number.isFinite(Number(message.lesson.inputs.i2)) ? Number(message.lesson.inputs.i2) : 3
          });
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

        if (typeof message.lesson?.useQuestionMarks === 'boolean') {
          setLessonUseQuestionMarks(message.lesson.useQuestionMarks);
        }

        if (Array.isArray(message.participants)) {
          setParticipants(message.participants);
        }

        if (Array.isArray(message.roster)) {
          setRoster(message.roster);
        }

        if (isStudent && message.me?.weights) {
          const nextW1 = Number(message.me.weights.w1);
          const nextW2 = Number(message.me.weights.w2);
          if (Number.isFinite(nextW1) && Number.isFinite(nextW2)) {
            suppressNextStudentWeightsSendRef.current = true;
            setDynamicW1(nextW1);
            setDynamicW2(nextW2);
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
    if (suppressNextStudentWeightsSendRef.current) {
      suppressNextStudentWeightsSendRef.current = false;
      return;
    }

    if (
      lastSentStudentWeightsRef.current.w1 === dynamicW1
      && lastSentStudentWeightsRef.current.w2 === dynamicW2
    ) {
      return;
    }

    lastSentStudentWeightsRef.current = { w1: dynamicW1, w2: dynamicW2 };
    sendSocketMessage({ type: 'student_weights', weights: { w1: dynamicW1, w2: dynamicW2 } });
  }, [dynamicW1, dynamicW2, isSocketConnected, isStudent]);

  useEffect(() => {
    if (!isTeacher || !isSocketConnected) return;
    sendSocketMessage({
      type: 'teacher_lesson',
      lesson: {
        dataset: currentDataset,
        exampleIndex: currentExample,
        exampleName: currentExampleData.name,
        icon: currentExampleData.icon,
        inputs: {
          i1: currentExampleData.i1,
          i2: currentExampleData.i2
        },
        useQuestionMarks
      }
    });
  }, [
    isTeacher,
    isSocketConnected,
    currentDataset,
    currentExample,
    currentExampleData.name,
    currentExampleData.icon,
    currentExampleData.i1,
    currentExampleData.i2,
    useQuestionMarks
  ]);

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
}, [role, currentDataset, currentExample, useQuestionMarks, editWeights, thresholdEnabled, thresholdOp, thresholdValue, dynamicW1, dynamicW2, lessonDataset, lessonExampleIndex, lessonUseQuestionMarks]);
  const sortedParticipants = [...participants].sort((a, b) => String(a.name || '').localeCompare(String(b.name || '')));

  return (
    <TeacherCard title="$$ w_1 \times i_1 + w_2 \times i_2 = o $$">
      <div className="connection-status">
        <span className={`status-dot ${isSocketConnected ? 'online' : 'offline'}`}></span>
        <strong>{isSocketConnected ? 'Συνδεδεμένο' : 'Αποσυνδεδεμένο'}</strong>
        <span>κανάλι: /ws/neural-lab</span>
        {isStudent && <span>όνομα: {studentName}</span>}
        {!isStudent && <span>συνδεδεμένοι: {roster.length}</span>}
      </div>

      {isScreen && (
        <>
          <div className="screen-top-bar">
            <strong>Προβολή τάξης</strong>
            <span>{DATASETS[safeDisplayDataset].emoji} {DATASETS[safeDisplayDataset].label}</span>
            <span>{displayIcon} {displayName}</span>
            <span>i1={i1}, i2={i2}</span>
            <span>w1={w1}, w2={w2}</span>
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
          prod1={prod1}
          prod2={prod2}
          w1={w1}
          w2={w2}
          i1={i1}
          i2={i2}
          total={total}
          useQuestionMarks={effectiveUseQuestionMarks}
          editWeights={isWeightEditable}
          onWeightChange={handleWeightChange}
          onRefresh={() => {}}
          threshold={threshold}
          studentAnswerMode={isStudent && effectiveUseQuestionMarks}
          studentAnswer={studentAnswer}
          onStudentAnswerChange={setStudentAnswer}
        />
      </div>

      {(isTeacher || isScreen) && (
        <div className="live-table-wrap">
          <h3>Συνδεδεμένοι μαθητές</h3>
          <StudentTable
            i1={lessonInputs.i1}
            i2={lessonInputs.i2}
            threshold={lessonThreshold}
            participants={sortedParticipants}
          />
        </div>
      )}

      {isTeacher && (
        <>
          <div className="toolbar">
            <button
              className={`tool-icon ${useQuestionMarks ? 'active' : ''}`}
              onClick={() => setUseQuestionMarks(!useQuestionMarks)}
              data-tooltip="Εμφάνιση ερωτηματικών (?)"
            >
              ❓ ?
            </button>
            <button
              className={`tool-icon ${editWeights ? 'active' : ''}`}
              onClick={() => {
                setEditWeights(!editWeights);
                setDynamicW1(2);
                setDynamicW2(3);
              }}
              data-tooltip="Επεξεργασία βαρών (w₁, w₂)"
            >
              ⚙️ Βάρη
            </button>
            <button
              className={`tool-icon ${thresholdEnabled ? 'active' : ''}`}
              onClick={() => setThresholdEnabled(!thresholdEnabled)}
              data-tooltip="Ενεργοποίηση ορίου"
            >
              📏 Όριο
            </button>
            {thresholdEnabled && (
              <div className="threshold-controls">
                <select
                  value={thresholdOp}
                  onChange={(e) => setThresholdOp(e.target.value)}
                >
                  <option value="gt">&gt;</option>
                  <option value="lt">&lt;</option>
                </select>
                <input
                  type="number"
                  value={thresholdValue}
                  onChange={(e) => setThresholdValue(parseInt(e.target.value, 10) || 0)}
                  step="1"
                  style={{ width: '70px' }}
                />
              </div>
            )}
          </div>

          <div className="control-bar">
            <div className="select-group">
              <label>📂 Σύνολο δεδομένων</label>
              <select
                value={currentDataset}
                onChange={(e) => {
                  setCurrentDataset(e.target.value);
                  setCurrentExample(0);
                }}
              >
                {Object.entries(DATASETS).map(([key, val]) => (
                  <option key={key} value={key}>
                    {val.emoji} {val.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="select-group">
              <label>📌 Παράδειγμα</label>
              <select
                value={currentExample}
                onChange={(e) => setCurrentExample(parseInt(e.target.value, 10))}
              >
                {DATASETS[currentDataset].examples.map((ex, idx) => (
                  <option key={idx} value={idx}>
                    {ex.icon} {ex.name} (ρόδες={ex.i1}, μηχανές={ex.i2})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </>
      )}

      
      
    </TeacherCard>
  );
};

export default App;
