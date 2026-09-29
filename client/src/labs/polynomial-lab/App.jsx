import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Accordion,
  ActivitiesMenu,
  ConnectionNameControl,
  HeroTitle,
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
    id: 'al-9-2',
    code: 'Αλ.Π.9.2',
    title: 'Μονώνυμα και πολυώνυμα',
    objective: 'Να αναγνωρίζουν τα μονώνυμα, τα πολυώνυμα, τον βαθμό τους και την αριθμητική τιμή ενός πολυωνύμου.',
    tasks: ['Αναγνώριση μονωνύμου', 'Βαθμός πολυωνύμου', 'Αριθμητική τιμή σε x = 2, -3, 5']
  },
  {
    id: 'al-9-3',
    code: 'Αλ.Π.9.3',
    title: 'Πράξεις με μονώνυμα και απλά πολυώνυμα',
    objective: 'Να υπολογίζουν το άθροισμα, τη διαφορά και το γινόμενο μονωνύμων και απλών πολυωνύμων μιας μεταβλητής.',
    tasks: ['Άθροισμα όμοιων όρων', 'Διαφορά πολυωνύμων', 'Γινόμενο με κοινό συντελεστή']
  },
  {
    id: 'al-9-6',
    code: 'Αλ.Π.9.6',
    title: 'Επιμεριστική ιδιότητα',
    objective: 'Να αναγνωρίζουν την επιμεριστική ιδιότητα ως βασικό κοινό στοιχείο των πράξεων πολυωνύμων, των ταυτοτήτων και της παραγοντοποίησης.',
    tasks: ['Επέκταση γινομένου', 'Διατύπωση κανόνα', 'Σύνδεση με ταυτότητες']
  },
  {
    id: 'al-9-7',
    code: 'Αλ.Π.9.7',
    title: 'Παραγοντοποίηση',
    objective: 'Να παραγοντοποιούν απλά πολυώνυμα μιας μεταβλητής με κοινό παράγοντα, ομαδοποίηση και χρήση ταυτοτήτων.',
    tasks: ['Κοινός παράγοντας', 'Ομαδοποίηση', 'Ταυτότητα (a+b)^2']
  }
];

const POLYNOMIAL_ACTIVITY_OPTIONS = ACTIVITY_LIBRARY.map((activity) => ({
  value: activity.id,
  label: `${activity.code}. ${activity.title}`
}));

const DEFAULT_ACTIVITY_ID = ACTIVITY_LIBRARY[0].id;

export default function App({ role = 'teacher' }) {
  const isTeacher = role === 'teacher';
  const isStudent = role === 'student';
  const wsRef = useRef(null);
  const reconnectTimerRef = useRef(null);
  const hasRegisteredRef = useRef(false);

  const [selectedActivityId, setSelectedActivityId] = useState(DEFAULT_ACTIVITY_ID);
  const [isSocketConnected, setIsSocketConnected] = useState(false);
  const [participants, setParticipants] = useState([]);
  const [roster, setRoster] = useState([]);
  const [studentName, setStudentName] = useState(() => readIdentityName(`Student-${Math.floor(Math.random() * 900 + 100)}`));
  const [studentColor, setStudentColor] = useState(() => readIdentityColor(randomIdentityColor()));
  const [editingName, setEditingName] = useState(false);
  const [studentNameInput, setStudentNameInput] = useState(studentName);

  const activeActivity = useMemo(
    () => ACTIVITY_LIBRARY.find((item) => item.id === selectedActivityId) || ACTIVITY_LIBRARY[0],
    [selectedActivityId]
  );

  const sortedParticipants = useMemo(
    () => [...participants]
      .filter((student) => student && student.isConnected !== false)
      .sort((a, b) => String(a.name || a.username || '').localeCompare(String(b.name || b.username || ''))),
    [participants]
  );

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

        <div className="poly-hero-grid">
          <div className="poly-hero-card poly-hero-card--large">
            <span className="poly-icon">🧮</span>
            <div>
              <p className="poly-hero-code">{activeActivity.code}</p>
              <p className="poly-hero-text">{activeActivity.objective}</p>
            </div>
          </div>

          <div className="poly-hero-card">
            <p className="poly-mini-label">Στόχος άσκησης</p>
            <p className="poly-mini-value">{activeActivity.tasks[0]}</p>
          </div>

          <div className="poly-hero-card">
            <p className="poly-mini-label">Ενεργή ομάδα</p>
            <p className="poly-mini-value">{roster.length} online</p>
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
            onChange={setSelectedActivityId}
          />

          <StudentTable
            title="📋 Πίνακας μαθητών"
            participants={sortedParticipants}
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
          <Accordion title="Στόχοι δραστηριότητας" icon="📘" open>
            <div className="poly-goal-list">
              {activeActivity.tasks.map((task) => (
                <div key={task} className="poly-goal-item">• {task}</div>
              ))}
            </div>
          </Accordion>

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
