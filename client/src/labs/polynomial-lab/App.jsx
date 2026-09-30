import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Accordion,
  ActivitiesMenu,
  ConnectionNameControl,
  HeroTitle,
  MathFormula,
  StudentQrAccordion,
  StudentTable,
  randomIdentityColor,
  readIdentityColor,
  readIdentityName,
  writeIdentityColor,
  writeIdentityName
} from '../../shared/components';
import './App.css';

const ACTIVITY_LIBRARY = [
  {
    id: '1.1',
    code: '1.1',
    title: '1.1 Βασικές έννοιες μονωνύμων',
    objective: 'Αναγνώριση συντελεστή, εκθετών και βαθμού ενός μονωνύμου.',
    tasks: ['Συντελεστής', 'Βαθμός ως προς x', 'Βαθμός ως προς y', 'Συνολικός βαθμός']
  },
  {
    id: '2',
    code: '2',
    title: 'Πράξεις με μονώνυμα και απλά πολυώνυμα',
    objective: 'Να υπολογίζουν το άθροισμα, τη διαφορά και το γινόμενο μονωνύμων και απλών πολυωνύμων μιας μεταβλητής.',
    tasks: ['Άθροισμα όμοιων όρων', 'Διαφορά πολυωνύμων', 'Γινόμενο με κοινό συντελεστή']
  },
  {
    id: '3',
    code: '3',
    title: 'Επιμεριστική ιδιότητα',
    objective: 'Να αναγνωρίζουν την επιμεριστική ιδιότητα ως βασικό κοινό στοιχείο των πράξεων πολυωνύμων, των ταυτοτήτων και της παραγοντοποίησης.',
    tasks: ['Επέκταση γινομένου', 'Διατύπωση κανόνα', 'Σύνδεση με ταυτότητες']
  },
  {
    id: '4',
    code: '4',
    title: 'Παραγοντοποίηση',
    objective: 'Να παραγοντοποιούν απλά πολυώνυμα μιας μεταβλητής με κοινό παράγοντα, ομαδοποίηση και χρήση ταυτοτήτων.',
    tasks: ['Κοινός παράγοντας', 'Ομαδοποίηση', 'Ταυτότητα (a+b)^2']
  }
];

const ALGEBRA_DATASETS = {
  monomials: {
    label: 'Μονώνυμα',
    items: [
      {
        id: 'm-1',
        expression: '3x^4y^2',
        coefficient: 3,
        degreeX: 4,
        degreeY: 2,
        totalDegree: 6
      },
      {
        id: 'm-2',
        expression: '5x^2y^3',
        coefficient: 5,
        degreeX: 2,
        degreeY: 3,
        totalDegree: 5
      },
      {
        id: 'm-3',
        expression: '7x^3y',
        coefficient: 7,
        degreeX: 3,
        degreeY: 1,
        totalDegree: 4
      }
    ]
  },
  polynomials: {
    label: 'Πολυώνυμα',
    items: [
      {
        id: 'p-1',
        expression: '3x^2 + 2x - 5',
        coefficient: '-',
        degreeX: 2,
        degreeY: '-',
        totalDegree: 2
      },
      {
        id: 'p-2',
        expression: 'x^3 - 4x + 1',
        coefficient: '-',
        degreeX: 3,
        degreeY: '-',
        totalDegree: 3
      }
    ]
  }
};

const POLYNOMIAL_ACTIVITY_OPTIONS = ACTIVITY_LIBRARY.map((activity) => ({
  value: activity.id,
  label: activity.title
}));

const DEFAULT_ACTIVITY_ID = ACTIVITY_LIBRARY[0].id;

export default function App({ role = 'teacher' }) {
  const isTeacher = role === 'teacher';
  const isStudent = role === 'student';
  const wsRef = useRef(null);
  const reconnectTimerRef = useRef(null);
  const hasRegisteredRef = useRef(false);

  const [selectedActivityId, setSelectedActivityId] = useState(DEFAULT_ACTIVITY_ID);
  const [datasetKey, setDatasetKey] = useState('monomials');
  const [selectedExpressionId, setSelectedExpressionId] = useState(ALGEBRA_DATASETS.monomials.items[0].id);
  const [teamAnswers, setTeamAnswers] = useState({ coefficient: '', degreeX: '', degreeY: '', totalDegree: '' });
  const [isSocketConnected, setIsSocketConnected] = useState(false);
  const [participants, setParticipants] = useState([]);
  const [roster, setRoster] = useState([]);
  const [studentName, setStudentName] = useState(() => readIdentityName(`Student-${Math.floor(Math.random() * 900 + 100)}`));
  const [studentColor, setStudentColor] = useState(() => readIdentityColor(randomIdentityColor()));
  const [editingName, setEditingName] = useState(false);
  const [studentNameInput, setStudentNameInput] = useState(studentName);
  const [lastSentAnswers, setLastSentAnswers] = useState('');

  const activeActivity = useMemo(
    () => ACTIVITY_LIBRARY.find((item) => item.id === selectedActivityId) || ACTIVITY_LIBRARY[0],
    [selectedActivityId]
  );

  const activeDataset = ALGEBRA_DATASETS[datasetKey] || ALGEBRA_DATASETS.monomials;
  const activeItems = activeDataset.items;
  const expressionById = useMemo(() => {
    const map = {};
    Object.values(ALGEBRA_DATASETS).forEach((dataset) => {
      dataset.items.forEach((item) => {
        map[item.id] = item.expression;
      });
    });
    return map;
  }, []);
  const activeExpression = useMemo(
    () => activeItems.find((item) => item.id === selectedExpressionId) || activeItems[0],
    [activeItems, selectedExpressionId]
  );

  const sortedParticipants = useMemo(
    () => [...participants]
      .filter((student) => student && student.isConnected !== false)
      .sort((a, b) => String(a.name || a.username || '').localeCompare(String(b.name || b.username || ''))),
    [participants]
  );

  const expectedAnswers = {
    coefficient: activeExpression?.coefficient ?? '-',
    degreeX: activeExpression?.degreeX ?? '-',
    degreeY: activeExpression?.degreeY ?? '-',
    totalDegree: activeExpression?.totalDegree ?? '-'
  };

  const setActivity = (nextId) => {
    setSelectedActivityId(nextId);
    sendSocketMessage({
      type: 'teacher_lesson',
      lesson: {
        activityId: nextId,
        datasetKey,
        expressionId: selectedExpressionId
      }
    });
  };

  const setDataset = (nextKey) => {
    const nextDataset = ALGEBRA_DATASETS[nextKey] || ALGEBRA_DATASETS.monomials;
    const nextExpression = nextDataset.items[0]?.id || '';
    setDatasetKey(nextKey);
    setSelectedExpressionId(nextExpression);
    setTeamAnswers({ coefficient: '', degreeX: '', degreeY: '', totalDegree: '' });

    sendSocketMessage({
      type: 'teacher_lesson',
      lesson: {
        activityId: selectedActivityId,
        datasetKey: nextKey,
        expressionId: nextExpression
      }
    });
  };

  const setExpression = (nextExpressionId) => {
    setSelectedExpressionId(nextExpressionId);
    setTeamAnswers({ coefficient: '', degreeX: '', degreeY: '', totalDegree: '' });

    sendSocketMessage({
      type: 'teacher_lesson',
      lesson: {
        activityId: selectedActivityId,
        datasetKey,
        expressionId: nextExpressionId
      }
    });
  };

  const setTeamField = (field, value) => {
    setTeamAnswers((prev) => ({ ...prev, [field]: value }));
  };

  const sendSocketMessage = (payload) => {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      return false;
    }

    try {
      ws.send(JSON.stringify(payload));
      return true;
    } catch {
      return false;
    }
  };

  const saveStudentName = () => {
    const nextName = studentNameInput.trim();
    if (!nextName || nextName === studentName) {
      setStudentNameInput(studentName);
      setEditingName(false);
      return;
    }

    writeIdentityName(nextName);
    setStudentName(nextName);
    setEditingName(false);
    sendSocketMessage({ type: 'register_student', name: nextName, color: studentColor });
  };

  const saveStudentColor = (nextColor) => {
    setStudentColor(nextColor);
    writeIdentityColor(nextColor);
    sendSocketMessage({ type: 'register_student', name: studentName, color: nextColor });
  };

  useEffect(() => {
    let cancelled = false;

    const clearReconnect = () => {
      if (!reconnectTimerRef.current) {
        return;
      }
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    };

    const registerCurrentRole = () => {
      if (hasRegisteredRef.current) {
        return;
      }

      if (isStudent) {
        sendSocketMessage({ type: 'register_student', name: studentName, color: studentColor });
      } else {
        sendSocketMessage({ type: 'register_teacher', name: 'Teacher' });
      }
      sendSocketMessage({ type: 'request_state' });
      hasRegisteredRef.current = true;
    };

    const connect = () => {
      if (cancelled) {
        return;
      }

      const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
      const ws = new WebSocket(`${protocol}://${window.location.host}/ws/polynomial-lab`);
      wsRef.current = ws;

      ws.addEventListener('open', () => {
        if (cancelled) {
          return;
        }
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

        if (message?.type !== 'polynomial_state') {
          return;
        }

        if (message.lesson && typeof message.lesson === 'object') {
          const nextActivity = String(message.lesson.activityId || '').trim();
          const nextDatasetKey = String(message.lesson.datasetKey || '').trim();
          const nextExpressionId = String(message.lesson.expressionId || '').trim();

          if (nextActivity && ACTIVITY_LIBRARY.some((activity) => activity.id === nextActivity)) {
            setSelectedActivityId(nextActivity);
          }

          if (nextDatasetKey && ALGEBRA_DATASETS[nextDatasetKey]) {
            setDatasetKey(nextDatasetKey);
          }

          if (nextExpressionId) {
            setSelectedExpressionId(nextExpressionId);
          }
        }

        if (Array.isArray(message.participants)) {
          setParticipants(message.participants);
        }

        if (Array.isArray(message.roster)) {
          setRoster(message.roster);
        }
      });

      ws.addEventListener('close', () => {
        if (cancelled) {
          return;
        }
        setIsSocketConnected(false);
        hasRegisteredRef.current = false;
        clearReconnect();
        reconnectTimerRef.current = setTimeout(connect, 1000);
      });

      ws.addEventListener('error', () => {
        if (!cancelled) {
          setIsSocketConnected(false);
        }
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
  }, [isStudent]);

  useEffect(() => {
    if (!isStudent || !isSocketConnected) {
      return;
    }

    const payload = {
      type: 'student_answers',
      expressionId: selectedExpressionId,
      answers: {
        coefficient: teamAnswers.coefficient,
        degreeX: teamAnswers.degreeX,
        degreeY: teamAnswers.degreeY,
        totalDegree: teamAnswers.totalDegree
      }
    };

    const serialized = JSON.stringify(payload);
    if (serialized === lastSentAnswers) {
      return;
    }

    setLastSentAnswers(serialized);
    sendSocketMessage(payload);
  }, [isStudent, isSocketConnected, selectedExpressionId, teamAnswers, lastSentAnswers]);

  return (
    <div className="poly-lab-shell">
      <header className="poly-lab-header">
        <p className="poly-kicker">Collaborative Mathematics Lab</p>
        <HeroTitle>
          Polynomial Lab
        </HeroTitle>
        <div className="poly-header-badges">
          <span className="poly-badge poly-badge--blue">Μονώνυμα</span>
          <span className="poly-badge poly-badge--mint">Πολυώνυμα</span>
          <span className="poly-badge poly-badge--amber">Παραγοντοποίηση</span>
        </div>
      </header>

      <ConnectionNameControl
        connected={isSocketConnected}
        name={isStudent ? studentName : ''}
        editing={isStudent && editingName}
        value={studentNameInput}
        onChange={isStudent ? setStudentNameInput : undefined}
        onStartEdit={isStudent ? () => setEditingName(true) : undefined}
        onCommit={isStudent ? saveStudentName : undefined}
        onCancel={isStudent ? () => {
          setStudentNameInput(studentName);
          setEditingName(false);
        } : undefined}
        color={studentColor}
        showColorPicker={isStudent}
        onColorChange={isStudent ? saveStudentColor : undefined}
        infoText={isTeacher ? `συνδεδεμένοι: ${roster.length}` : ''}
        connectedLabel="Σε σύνδεση"
        disconnectedLabel="Εκτός σύνδεσης"
        namePrefix="όνομα"
        showNameLabel={isStudent}
        className="poly-connection-status"
      />

      <section className="common-zone poly-common-zone">
        <div className="poly-common-topbar">
          <div>
            <p className="poly-common-label">Κεντρικό panel</p>
            <p className="poly-common-activity">{activeActivity.title}</p>
          </div>
          <span className="poly-status-pill">{isTeacher ? 'Teacher view' : 'Student view'}</span>
        </div>

        <div className="poly-neural-zone">
          <div className="poly-expression-card" aria-label="μονώνυμο ή πολυώνυμο">
            <p className="poly-mini-label">Έκφραση</p>
            <div className="poly-expression-math"><MathFormula formula={`\\(${activeExpression.expression}\\)`} /></div>
            <p className="poly-hero-text">{activeActivity.objective}</p>
          </div>

          <div className="poly-team-card">
            <p className="poly-mini-label">Συνεργατική συμπλήρωση</p>
            <div className="poly-team-grid">
              <label className="poly-team-field">
                <span>Συντελεστής</span>
                <input
                  type="text"
                  value={teamAnswers.coefficient}
                  onChange={(event) => setTeamField('coefficient', event.target.value)}
                  placeholder="π.χ. 3"
                />
              </label>
              <label className="poly-team-field">
                <span>Βαθμός ως προς x</span>
                <input
                  type="text"
                  value={teamAnswers.degreeX}
                  onChange={(event) => setTeamField('degreeX', event.target.value)}
                  placeholder="π.χ. 4"
                />
              </label>
              <label className="poly-team-field">
                <span>Βαθμός ως προς y</span>
                <input
                  type="text"
                  value={teamAnswers.degreeY}
                  onChange={(event) => setTeamField('degreeY', event.target.value)}
                  placeholder="π.χ. 2"
                />
              </label>
              <label className="poly-team-field">
                <span>Συνολικός βαθμός</span>
                <input
                  type="text"
                  value={teamAnswers.totalDegree}
                  onChange={(event) => setTeamField('totalDegree', event.target.value)}
                  placeholder="π.χ. 6"
                />
              </label>
            </div>
            <p className="poly-answer-hint">
              Ενδεικτική λύση: συντελεστής {expectedAnswers.coefficient}, x^{expectedAnswers.degreeX}, y^{expectedAnswers.degreeY}, συνολικός βαθμός {expectedAnswers.totalDegree}
            </p>
          </div>
        </div>
      </section>

      {isTeacher && (
        <>
          <ActivitiesMenu
            title="Δραστηριότητα"
            icon="🎯"
            label="Επιλογή δραστηριότητας"
            options={POLYNOMIAL_ACTIVITY_OPTIONS}
            value={selectedActivityId}
            onChange={setActivity}
          />

          <Accordion title="Δεδομένα" icon="🗂️" open>
            <div className="data-section poly-data-menu">
              <div className="poly-select-group">
                <label className="shared-activity-label" htmlFor="poly-dataset-type">Τύπος έκφρασης</label>
                <select
                  id="poly-dataset-type"
                  className="shared-activity-select"
                  value={datasetKey}
                  onChange={(event) => setDataset(event.target.value)}
                >
                  {Object.entries(ALGEBRA_DATASETS).map(([key, value]) => (
                    <option key={key} value={key}>{value.label}</option>
                  ))}
                </select>
              </div>

              <div className="poly-select-group">
                <label className="shared-activity-label" htmlFor="poly-expression">Επιλογή έκφρασης</label>
                <select
                  id="poly-expression"
                  className="shared-activity-select"
                  value={selectedExpressionId}
                  onChange={(event) => setExpression(event.target.value)}
                >
                  {activeItems.map((item) => (
                    <option key={item.id} value={item.id}>{item.expression}</option>
                  ))}
                </select>
              </div>
            </div>
          </Accordion>

          <StudentTable
            title="📋 Πίνακας μαθητών"
            participants={sortedParticipants}
            columns={[
              { key: 'expr', label: 'Έκφραση', render: (student) => expressionById[student.expressionId] || expressionById[selectedExpressionId] || '-' },
              { key: 'coef', label: 'Συντελεστής', render: (student) => student.answers?.coefficient || '-' },
              { key: 'dx', label: 'Βαθμός x', render: (student) => student.answers?.degreeX || '-' },
              { key: 'dy', label: 'Βαθμός y', render: (student) => student.answers?.degreeY || '-' },
              { key: 'dt', label: 'Συνολικός βαθμός', render: (student) => student.answers?.totalDegree || '-' }
            ]}
            emptyMessage="Δεν υπάρχουν μαθητές για αυτό το εργαστήριο."
          />

          <StudentQrAccordion
            qrSrc="/labs/polynomial-lab/media/polynomial_student_qrcode.png"
            alt="QR code για το Polynomial Lab student link"
          />
        </>
      )}

      {!isTeacher && (
        <>
          <ActivitiesMenu
            title="Δραστηριότητα"
            icon="🎯"
            label="Επιλογή δραστηριότητας"
            options={POLYNOMIAL_ACTIVITY_OPTIONS}
            value={selectedActivityId}
            onChange={undefined}
          />

          <StudentTable
            title="📊 Συνδεδεμένοι μαθητές"
            participants={sortedParticipants}
            emptyMessage="Δεν υπάρχουν διαθέσιμοι μαθητές."
          />

          <StudentQrAccordion
            qrSrc="/labs/polynomial-lab/media/polynomial_student_qrcode.png"
            alt="QR code για σύνδεση μαθητή στο Polynomial Lab"
          />
        </>
      )}
    </div>
  );
}
