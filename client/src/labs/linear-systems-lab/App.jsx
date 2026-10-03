import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Accordion,
  ActivitiesMenu,
  GroupingDragDrop,
  HeroTitle,
  MathFormula,
  SharedCommonZoneLayout,
  SharedInputBox,
  SharedInputRow,
  SimpleCoordinateSystem,
  StudentTable,
  readIdentitySnapshot,
  CommonZoneFullscreenButton
} from '../../shared/components';
import './App.css';

const GRAPH_COLORS = ['#2563eb', '#dc2626'];
const EMPTY_TOKEN = '□';

const ACTIVITY_LIBRARY = [
  {
    id: '1',
    code: '1.',
    title: 'Γραφική δημιουργία συστήματος',
    objective: 'Οι μαθητές γράφουν δύο εξισώσεις και βλέπουν το αντίστοιχο γράφημα.' ,
    mode: 'graphing-input'
  },
  {
    id: '2',
    code: '2.',
    title: 'Μία/Καμία/Άπειρες λύσεις',
    objective: 'Σύνδεση γεωμετρικής εικόνας με πλήθος λύσεων.',
    mode: 'grouping'
  },
  {
    id: '3',
    code: '3.',
    title: 'Ενσώματη δραστηριότητα (camera placeholder)',
    objective: 'Θα ενεργοποιηθεί σε 2η φάση με camera tracking.',
    mode: 'embodied'
  },
  {
    id: '4',
    code: '4.',
    title: 'Αλγεβρική επίλυση - μέθοδος απαλοιφής',
    objective: 'Εξαγωγή x, y και έλεγχος λύσης.',
    mode: 'algebra'
  },
  {
    id: '5',
    code: '5.',
    title: 'Επαλήθευση αλγεβρικής λύσης στο γράφημα',
    objective: 'Σύνδεση αλγεβρικής λύσης με το σημείο τομής.',
    mode: 'graphing-fixed'
  },
  {
    id: '6',
    code: '6.',
    title: 'Ενσώματη ταξινόμηση ζωνών (placeholder)',
    objective: 'Θα ενεργοποιηθεί σε 2η φάση με embodied zones.',
    mode: 'embodied'
  }
];

const LESSON_DATA = {
  '1': {
    items: [
      { id: 'ls-1', hint: 'Γράψε 2 εξισώσεις 1ου βαθμού (π.χ. y=2x-1 και y=-x+5).' }
    ]
  },
  '2': {
    groups: [
      { id: 'none', title: 'Καμία λύση', hint: 'Παράλληλες ευθείες' },
      { id: 'one', title: 'Μία λύση', hint: 'Τέμνονται σε ένα σημείο' },
      { id: 'infinite', title: 'Άπειρες λύσεις', hint: 'Ταυτίζονται' }
    ],
    items: [
      { id: 'c-1', content: 'y = 2x + 1 | y = 2x - 3', correctGroupId: 'none' },
      { id: 'c-2', content: 'y = -x + 4 | y = -x + 4', correctGroupId: 'infinite' },
      { id: 'c-3', content: 'y = 3x - 2 | y = -x + 6', correctGroupId: 'one' },
      { id: 'c-4', content: '2x + y = 7 | 2x + y = 1', correctGroupId: 'none' },
      { id: 'c-5', content: 'x - 2y = 4 | 2x - 4y = 8', correctGroupId: 'infinite' },
      { id: 'c-6', content: 'x + y = 6 | x - y = 2', correctGroupId: 'one' }
    ]
  },
  '4': {
    items: [
      { id: 'a-1', systemLatex: '\\begin{cases} 2x+y=7 \\\\ x-y=2 \\end{cases}', expected: { x: '3', y: '1' }, eliminationLatex: '(2x+y)+(x-y)=7+2 \\Rightarrow 3x=9 \\Rightarrow x=3' },
      { id: 'a-2', systemLatex: '\\begin{cases} x+y=6 \\\\ x-y=2 \\end{cases}', expected: { x: '4', y: '2' }, eliminationLatex: '(x+y)+(x-y)=6+2 \\Rightarrow 2x=8 \\Rightarrow x=4' }
    ]
  },
  '5': {
    items: [
      { id: 'v-1', systemLatex: '\\begin{cases} 2x+y=7 \\\\ x-y=2 \\end{cases}', hint: 'Παρατήρησε γραφικά το σημείο τομής για επαλήθευση.' }
    ]
  }
};

function normalizeText(value) {
  return String(value || '').trim();
}

function getInitialItemId(activityId) {
  const items = LESSON_DATA[activityId] && LESSON_DATA[activityId].items;
  return Array.isArray(items) && items.length ? items[0].id : '';
}

function createEmptyEquationRows() {
  return {
    equation1: { x: '', y: '', rhs: '' },
    equation2: { x: '', y: '', rhs: '' }
  };
}

function normalizeNumberInput(value) {
  const source = normalizeText(value).replace(',', '.');
  if (!source) {
    return null;
  }

  const numeric = Number(source);
  return Number.isFinite(numeric) ? numeric : null;
}

function formatToken(value) {
  const token = normalizeText(value);
  return token || EMPTY_TOKEN;
}

function formatEquationFromRow(row) {
  return `${formatToken(row?.x)}x + ${formatToken(row?.y)}y = ${formatToken(row?.rhs)}`;
}

function parseLineFromCoefficients(row) {
  const a = normalizeNumberInput(row?.x);
  const b = normalizeNumberInput(row?.y);
  const c = normalizeNumberInput(row?.rhs);

  if (a === null || b === null || c === null) {
    return null;
  }

  // Current shared plot supports y = mx + b, so vertical lines (b=0) are skipped.
  if (Math.abs(b) < 1e-9) {
    return null;
  }

  return {
    m: -a / b,
    b: c / b
  };
}

function parseLinearExpression(expression) {
  const source = String(expression || '').replace(/\s+/g, '');
  if (!source) {
    return { x: 0, y: 0, c: 0 };
  }

  const terms = source.match(/[+-]?[^+-]+/g) || [];
  return terms.reduce((acc, term) => {
    if (!term || term === '+' || term === '-') {
      return acc;
    }

    if (term.includes('x')) {
      const coeff = term.replace('x', '');
      const numeric = coeff === '' || coeff === '+' ? 1 : coeff === '-' ? -1 : Number(coeff);
      if (Number.isFinite(numeric)) {
        acc.x += numeric;
      }
      return acc;
    }

    if (term.includes('y')) {
      const coeff = term.replace('y', '');
      const numeric = coeff === '' || coeff === '+' ? 1 : coeff === '-' ? -1 : Number(coeff);
      if (Number.isFinite(numeric)) {
        acc.y += numeric;
      }
      return acc;
    }

    const numeric = Number(term);
    if (Number.isFinite(numeric)) {
      acc.c += numeric;
    }
    return acc;
  }, { x: 0, y: 0, c: 0 });
}

function parseLinearEquationToSlopeIntercept(equation) {
  const source = String(equation || '').trim();
  if (!source.includes('=')) {
    return null;
  }

  const [leftRaw, rightRaw] = source.split('=');
  const left = parseLinearExpression(leftRaw);
  const right = parseLinearExpression(rightRaw);

  const a = left.x - right.x;
  const b = left.y - right.y;
  const c = left.c - right.c;

  if (!Number.isFinite(a) || !Number.isFinite(b) || !Number.isFinite(c) || Math.abs(b) < 1e-9) {
    return null;
  }

  return {
    m: -a / b,
    b: -c / b
  };
}

function extractSystemEquations(activeItem) {
  if (!activeItem) {
    return [];
  }

  const latexSource = String(activeItem.systemLatex || '');
  if (latexSource) {
    return latexSource
      .replace('\\begin{cases}', '')
      .replace('\\end{cases}', '')
      .split('\\\\')
      .map((entry) => entry.trim())
      .filter(Boolean)
      .slice(0, 2);
  }

  const contentSource = String(activeItem.content || '');
  if (contentSource.includes('|')) {
    return contentSource
      .split('|')
      .map((entry) => entry.trim())
      .filter(Boolean)
      .slice(0, 2);
  }

  return [];
}

export default function App({ role = 'student' }) {
  const isTeacher = role === 'teacher';
  const isStudent = !isTeacher;

  const wsRef = useRef(null);
  const reconnectTimerRef = useRef(null);
  const hasRegisteredRef = useRef(false);

  const [isSocketConnected, setIsSocketConnected] = useState(false);
  const [participants, setParticipants] = useState([]);
  const [selectedActivityId, setSelectedActivityId] = useState(ACTIVITY_LIBRARY[0].id);
  const [selectedItemId, setSelectedItemId] = useState(() => getInitialItemId(ACTIVITY_LIBRARY[0].id));
  const [answer, setAnswer] = useState({ x: '', y: '' });
  const [feedbackText, setFeedbackText] = useState('');
  const [groupingPlacementsByActivity, setGroupingPlacementsByActivity] = useState({});
  const [invalidGroupingItemIds, setInvalidGroupingItemIds] = useState([]);
  const [showEquationGraph, setShowEquationGraph] = useState(true);
  const [equationInputsByItem, setEquationInputsByItem] = useState({});
  const [lastSentState, setLastSentState] = useState('');
  const [identity, setIdentity] = useState(() => readIdentitySnapshot({ nameFallback: 'Student', colorFallback: '#4ECDC4' }));

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

  useEffect(() => {
    function handleIdentityChange() {
      setIdentity(readIdentitySnapshot({ nameFallback: 'Student', colorFallback: '#4ECDC4' }));
    }

    window.addEventListener('strobe:identity-change', handleIdentityChange);
    window.addEventListener('storage', handleIdentityChange);

    return () => {
      window.removeEventListener('strobe:identity-change', handleIdentityChange);
      window.removeEventListener('storage', handleIdentityChange);
    };
  }, []);

  const activeActivity = useMemo(
    () => ACTIVITY_LIBRARY.find((item) => item.id === selectedActivityId) || ACTIVITY_LIBRARY[0],
    [selectedActivityId]
  );

  const activeItems = useMemo(
    () => (LESSON_DATA[selectedActivityId] && LESSON_DATA[selectedActivityId].items) || [],
    [selectedActivityId]
  );

  const activeItem = useMemo(
    () => activeItems.find((item) => item.id === selectedItemId) || activeItems[0] || null,
    [activeItems, selectedItemId]
  );

  const groupingGroups = useMemo(
    () => (LESSON_DATA[selectedActivityId] && LESSON_DATA[selectedActivityId].groups) || [],
    [selectedActivityId]
  );

  const activeGroupingPlacements = useMemo(() => groupingPlacementsByActivity[selectedActivityId] || {}, [groupingPlacementsByActivity, selectedActivityId]);

  const activeEquationInputs = useMemo(() => {
    const raw = equationInputsByItem[selectedItemId];
    if (!raw || typeof raw !== 'object') {
      return createEmptyEquationRows();
    }

    const eq1 = raw.equation1 && typeof raw.equation1 === 'object' ? raw.equation1 : {};
    const eq2 = raw.equation2 && typeof raw.equation2 === 'object' ? raw.equation2 : {};

    return {
      equation1: {
        x: normalizeText(eq1.x),
        y: normalizeText(eq1.y),
        rhs: normalizeText(eq1.rhs)
      },
      equation2: {
        x: normalizeText(eq2.x),
        y: normalizeText(eq2.y),
        rhs: normalizeText(eq2.rhs)
      }
    };
  }, [equationInputsByItem, selectedItemId]);

  useEffect(() => {
    if (activeActivity.mode !== 'grouping') {
      setInvalidGroupingItemIds([]);
      return;
    }

    setGroupingPlacementsByActivity((current) => {
      if (current[selectedActivityId]) {
        return current;
      }

      const initial = activeItems.reduce((placements, item) => {
        placements[item.id] = null;
        return placements;
      }, {});

      return { ...current, [selectedActivityId]: initial };
    });
  }, [activeActivity.mode, activeItems, selectedActivityId]);

  const systemEquations = useMemo(() => {
    if (activeActivity.mode === 'graphing-input') {
      return [
        formatEquationFromRow(activeEquationInputs.equation1),
        formatEquationFromRow(activeEquationInputs.equation2)
      ];
    }
    return extractSystemEquations(activeItem);
  }, [activeActivity.mode, activeEquationInputs.equation1, activeEquationInputs.equation2, activeItem]);

  const coordinateLines = useMemo(() => {
    if (activeActivity.mode === 'graphing-input') {
      return [activeEquationInputs.equation1, activeEquationInputs.equation2]
        .map((row, index) => {
          const parsed = parseLineFromCoefficients(row);
          if (!parsed) {
            return null;
          }

          return {
            id: `line-${selectedActivityId}-${selectedItemId}-${index + 1}`,
            m: parsed.m,
            b: parsed.b,
            color: GRAPH_COLORS[index] || '#2563eb',
            label: `L${index + 1}: ${formatEquationFromRow(row)}`
          };
        })
        .filter(Boolean);
    }

    return systemEquations
      .map((equation, index) => {
        const parsed = parseLinearEquationToSlopeIntercept(equation);
        if (!parsed) {
          return null;
        }

        return {
          id: `line-${selectedActivityId}-${selectedItemId}-${index + 1}`,
          m: parsed.m,
          b: parsed.b,
          color: GRAPH_COLORS[index] || '#2563eb',
          label: `L${index + 1}: ${String(equation || '').trim() || '?'}`
        };
      })
      .filter(Boolean);
  }, [activeActivity.mode, activeEquationInputs.equation1, activeEquationInputs.equation2, selectedActivityId, selectedItemId, systemEquations]);

  const evaluation = useMemo(() => {
    if (!activeItem) {
      return { ready: false, feedback: '', invalidIds: [], payload: null };
    }

    if (activeActivity.mode === 'graphing-input') {
      const equation1 = formatEquationFromRow(activeEquationInputs.equation1);
      const equation2 = formatEquationFromRow(activeEquationInputs.equation2);
      const x1 = normalizeText(activeEquationInputs.equation1.x);
      const y1 = normalizeText(activeEquationInputs.equation1.y);
      const rhs1 = normalizeText(activeEquationInputs.equation1.rhs);
      const x2 = normalizeText(activeEquationInputs.equation2.x);
      const y2 = normalizeText(activeEquationInputs.equation2.y);
      const rhs2 = normalizeText(activeEquationInputs.equation2.rhs);
      const hasAnyInput = Boolean(x1 || y1 || rhs1 || x2 || y2 || rhs2);
      const isComplete = Boolean(x1 && y1 && rhs1 && x2 && y2 && rhs2);
      return {
        ready: hasAnyInput,
        feedback: isComplete ? 'Το σύστημα ενημερώθηκε και αποτυπώθηκε στο γράφημα.' : 'Συμπλήρωσε σταδιακά τους συντελεστές του συστήματος.',
        invalidIds: [],
        payload: {
          completed: isComplete ? '1' : '0',
          equation1,
          equation2,
          eq1x: x1,
          eq1y: y1,
          eq1rhs: rhs1,
          eq2x: x2,
          eq2y: y2,
          eq2rhs: rhs2,
          plottedLines: String(coordinateLines.length)
        }
      };
    }

    if (activeActivity.mode === 'grouping') {
      const expectedItems = Array.isArray(activeItems) ? activeItems : [];
      const allPlaced = expectedItems.every((item) => Boolean(activeGroupingPlacements[item.id]));
      if (!allPlaced) {
        return { ready: false, feedback: '', invalidIds: [], payload: null };
      }

      const invalidIds = expectedItems
        .filter((item) => (activeGroupingPlacements[item.id] || null) !== item.correctGroupId)
        .map((item) => item.id);

      const correctCount = expectedItems.length - invalidIds.length;
      const score = invalidIds.length === 0 ? 10 : 0;
      const feedback = invalidIds.length === 0
        ? 'Άριστα! Όλα τα συστήματα ομαδοποιήθηκαν σωστά.'
        : 'Υπάρχουν λάθη στην ομαδοποίηση. Έλεγξε τα κόκκινα στοιχεία.';

      return {
        ready: true,
        feedback,
        invalidIds,
        payload: {
          score,
          completed: '1',
          classification: `${correctCount}/${expectedItems.length}`
        }
      };
    }

    if (activeActivity.mode === 'embodied' || activeActivity.mode === 'graphing-fixed') {
      return { ready: false, feedback: '', invalidIds: [], payload: null };
    }

    const expected = activeItem.expected || activeItem.correct;
    const answerX = normalizeText(answer.x);
    const answerY = normalizeText(answer.y);
    if (!answerX || !answerY) {
      return { ready: false, feedback: '', invalidIds: [], payload: null };
    }

    const score = (answerX === normalizeText(expected && expected.x) ? 5 : 0) + (answerY === normalizeText(expected && expected.y) ? 5 : 0);
    const feedback = score === 10 ? 'Σωστό αποτέλεσμα.' : `Μερικό/λάθος αποτέλεσμα (${score}/10).`;

    return {
      ready: true,
      feedback,
      invalidIds: [],
      payload: {
        score,
        completed: '1',
        x: answerX,
        y: answerY
      }
    };
  }, [activeActivity.mode, activeEquationInputs.equation1, activeEquationInputs.equation2, activeGroupingPlacements, activeItem, activeItems, answer.x, answer.y, coordinateLines.length]);

  useEffect(() => {
    setInvalidGroupingItemIds(evaluation.invalidIds);
    setFeedbackText(evaluation.feedback);
  }, [evaluation.feedback, evaluation.invalidIds]);

  useEffect(() => {
    let cancelled = false;

    const clearReconnect = () => {
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
    };

    const registerCurrentRole = () => {
      if (hasRegisteredRef.current) {
        return;
      }

      if (isStudent) {
        sendSocketMessage({ type: 'register_student', name: identity.name, color: identity.color });
      } else {
        sendSocketMessage({ type: 'register_teacher', name: identity.name || 'Teacher' });
      }
      sendSocketMessage({ type: 'request_state' });
      hasRegisteredRef.current = true;
    };

    const connect = () => {
      if (cancelled) {
        return;
      }

      const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
      const ws = new WebSocket(`${protocol}://${window.location.host}/ws/linear-systems-lab`);
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

        if (message?.type !== 'linear_systems_state') {
          return;
        }

        if (Array.isArray(message.participants)) {
          setParticipants(message.participants);
        }

        const lesson = message.lesson && typeof message.lesson === 'object' ? message.lesson : null;
        if (!lesson) {
          return;
        }

        const nextActivity = normalizeText(lesson.activityId);
        const nextItemId = normalizeText(lesson.itemId);

        if (Object.prototype.hasOwnProperty.call(lesson, 'showEquationGraph')) {
          setShowEquationGraph(Boolean(lesson.showEquationGraph));
        }

        if (nextActivity && ACTIVITY_LIBRARY.some((activity) => activity.id === nextActivity)) {
          setSelectedActivityId(nextActivity);
          const activityItems = (LESSON_DATA[nextActivity] && LESSON_DATA[nextActivity].items) || [];
          const resolvedItemId = activityItems.some((item) => item.id === nextItemId)
            ? nextItemId
            : (activityItems[0] ? activityItems[0].id : '');
          setSelectedItemId(resolvedItemId);
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
  }, [identity.color, identity.name, isStudent]);

  useEffect(() => {
    if (!isSocketConnected) {
      return;
    }

    if (isStudent) {
      sendSocketMessage({ type: 'register_student', name: identity.name, color: identity.color });
      return;
    }

    sendSocketMessage({ type: 'register_teacher', name: identity.name || 'Teacher' });
  }, [identity.color, identity.name, isSocketConnected, isStudent]);

  useEffect(() => {
    if (!isStudent || !isSocketConnected || !evaluation.ready || !evaluation.payload) {
      return;
    }

    const payload = {
      type: 'student_answers',
      activityId: selectedActivityId,
      itemId: selectedItemId,
      answers: evaluation.payload
    };

    const serialized = JSON.stringify(payload);
    if (serialized === lastSentState) {
      return;
    }

    setLastSentState(serialized);
    sendSocketMessage(payload);
  }, [evaluation.payload, evaluation.ready, isSocketConnected, isStudent, lastSentState, selectedActivityId, selectedItemId]);

  const setActivity = (nextActivityId) => {
    const activityId = normalizeText(nextActivityId);
    if (!activityId || activityId === selectedActivityId) {
      return;
    }

    const nextItems = (LESSON_DATA[activityId] && LESSON_DATA[activityId].items) || [];
    const nextItemId = nextItems[0] ? nextItems[0].id : '';

    setSelectedActivityId(activityId);
    setSelectedItemId(nextItemId);
    setAnswer({ x: '', y: '' });
    setFeedbackText('');

    if (isTeacher) {
      sendSocketMessage({
        type: 'teacher_lesson',
        lesson: {
          activityId,
          itemId: nextItemId,
          showEquationGraph
        }
      });
    }
  };

  const setLessonItem = (nextItemId) => {
    const itemId = normalizeText(nextItemId);
    if (!itemId || itemId === selectedItemId) {
      return;
    }

    setSelectedItemId(itemId);
    setAnswer({ x: '', y: '' });
    setFeedbackText('');

    if (isTeacher) {
      sendSocketMessage({
        type: 'teacher_lesson',
        lesson: {
          activityId: selectedActivityId,
          itemId,
          showEquationGraph
        }
      });
    }
  };

  const setGraphVisibility = (nextVisible) => {
    const visible = Boolean(nextVisible);
    setShowEquationGraph(visible);

    if (!isTeacher) {
      return;
    }

    sendSocketMessage({
      type: 'teacher_lesson',
      lesson: {
        activityId: selectedActivityId,
        itemId: selectedItemId,
        showEquationGraph: visible
      }
    });
  };

  const updateEquationInput = (equationKey, fieldKey, value) => {
    setEquationInputsByItem((current) => {
      const currentItem = current[selectedItemId] || createEmptyEquationRows();
      const nextEquation = {
        ...(currentItem[equationKey] && typeof currentItem[equationKey] === 'object' ? currentItem[equationKey] : {}),
        [fieldKey]: value
      };

      return {
        ...current,
        [selectedItemId]: {
          ...currentItem,
          [equationKey]: nextEquation
        }
      };
    });
  };

  const sortedParticipants = useMemo(() => {
    const source = Array.isArray(participants) ? participants : [];
    return [...source].sort((a, b) => String(a.name || '').localeCompare(String(b.name || '')));
  }, [participants]);

  const graphPanelVisible = showEquationGraph && (activeActivity.mode === 'graphing-input' || coordinateLines.length > 0);
  const isGroupingMode = activeActivity.mode === 'grouping';

  const leftPanel = (
    <div className="lab-card lab-card--highlight poly-expression-card linear-expression-card" aria-label="σύστημα">
      <p className="lab-mini-label poly-mini-label">Σύστημα</p>
      {activeActivity.mode === 'graphing-input' ? (
        <div className="linear-system-preview" aria-label="system preview">
          <p>{formatEquationFromRow(activeEquationInputs.equation1)}</p>
          <p>{formatEquationFromRow(activeEquationInputs.equation2)}</p>
        </div>
      ) : activeItem && activeItem.systemLatex ? (
        <div className="lab-math-box poly-expression-math">
          <MathFormula formula={`\\(${activeItem.systemLatex}\\)`} />
        </div>
      ) : (
        <div className="lab-math-box poly-expression-math poly-expression-math--empty" />
      )}
      <p className="linear-note">{activeItem && activeItem.hint ? activeItem.hint : activeActivity.objective}</p>
    </div>
  );

  const centerPanel = (
    <div className="lab-card lab-card--panel poly-team-card linear-team-card">
      {activeActivity.mode === 'graphing-input' ? (
        <div className="poly-template-answer-panel">
          <div className="poly-team-grid poly-team-grid--full">
            <div className="poly-term-block poly-term-block--result">
              <div className="poly-term-inputs poly-term-inputs--result">
                <SharedInputRow
                  rowLabel="1."
                  tokens={['x +', 'y =', '']}
                  hideLabels
                  defaultPlaceholder=""
                  boxes={[
                    {
                      label: 'συντ. x',
                      value: activeEquationInputs.equation1.x,
                      onChange: (event) => updateEquationInput('equation1', 'x', event.target.value)
                    },
                    {
                      label: 'συντ. y',
                      value: activeEquationInputs.equation1.y,
                      onChange: (event) => updateEquationInput('equation1', 'y', event.target.value)
                    },
                    {
                      label: 'δεξιά τιμή',
                      value: activeEquationInputs.equation1.rhs,
                      onChange: (event) => updateEquationInput('equation1', 'rhs', event.target.value)
                    }
                  ]}
                />

                <SharedInputRow
                  rowLabel="2."
                  tokens={['x +', 'y =', '']}
                  hideLabels
                  defaultPlaceholder=""
                  boxes={[
                    {
                      label: 'συντ. x',
                      value: activeEquationInputs.equation2.x,
                      onChange: (event) => updateEquationInput('equation2', 'x', event.target.value)
                    },
                    {
                      label: 'συντ. y',
                      value: activeEquationInputs.equation2.y,
                      onChange: (event) => updateEquationInput('equation2', 'y', event.target.value)
                    },
                    {
                      label: 'δεξιά τιμή',
                      value: activeEquationInputs.equation2.rhs,
                      onChange: (event) => updateEquationInput('equation2', 'rhs', event.target.value)
                    }
                  ]}
                />
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {activeActivity.mode === 'grouping' ? (
        <>
          <p className="linear-note">Ομαδοποίησε κάθε σύστημα στις 3 ομάδες: καμία, μία, άπειρες λύσεις.</p>
          <GroupingDragDrop
            items={activeItems}
            groups={groupingGroups}
            placements={activeGroupingPlacements}
            onChange={(nextPlacements) => {
              setGroupingPlacementsByActivity((current) => ({
                ...current,
                [selectedActivityId]: nextPlacements
              }));
              setInvalidGroupingItemIds([]);
            }}
            invalidItemIds={invalidGroupingItemIds}
            bankLabel="Συστήματα προς ομαδοποίηση"
            emptyZoneLabel="Σύρε σύστημα εδώ"
          />
        </>
      ) : null}

      {activeActivity.mode === 'algebra' ? (
        <>
          <p className="linear-note">Συμπλήρωσε τη λύση του συστήματος.</p>
          {activeItem && activeItem.eliminationLatex ? (
            <div className="linear-expression">
              <MathFormula formula={`\\(${activeItem.eliminationLatex}\\)`} />
            </div>
          ) : null}
          <div className="linear-input-grid">
            <SharedInputBox
              label="x"
              value={answer.x}
              onChange={(event) => setAnswer((prev) => ({ ...prev, x: event.target.value }))}
              placeholder="π.χ. 3"
              className="lab-field"
            />
            <SharedInputBox
              label="y"
              value={answer.y}
              onChange={(event) => setAnswer((prev) => ({ ...prev, y: event.target.value }))}
              placeholder="π.χ. 1"
              className="lab-field"
            />
          </div>
        </>
      ) : null}

      {activeActivity.mode === 'embodied' ? (
        <div className="linear-placeholder">
          <strong>Embodied mode placeholder</strong>
          <p>Η δραστηριότητα είναι δηλωμένη και θα συνδεθεί με camera tracking στη 2η φάση.</p>
          <p>Θα χρησιμοποιηθούν zone mappings και real-time feedback ανά studentId.</p>
        </div>
      ) : null}

      {feedbackText ? <p className="linear-feedback">{feedbackText}</p> : null}
    </div>
  );

  const rightPanel = graphPanelVisible ? (
    <aside className="lab-card lab-card--panel poly-team-card linear-graph-card">
      <SimpleCoordinateSystem
        lines={coordinateLines}
        title="Γραφική παράσταση"
        showLegend
        xMin={-6}
        xMax={6}
        yMin={-6}
        yMax={6}
      />
    </aside>
  ) : null;

  return (
    <div className="linear-lab-shell">
      <header className="linear-lab-header">
        <HeroTitle
          title={`${activeActivity.code} ${activeActivity.title}`}
          subtitle={activeActivity.objective}
        />
      </header>

      <section className="common-zone lab-zone linear-common-zone">
        <CommonZoneFullscreenButton />
        <div className="linear-topbar">
          <span className="poly-status-pill">{isTeacher ? 'Teacher mode' : 'Student mode'}</span>
        </div>

        <SharedCommonZoneLayout
          className="linear-neural-zone"
          isGroupingMode={isGroupingMode}
          leftPanel={leftPanel}
          centerPanel={centerPanel}
          rightPanel={rightPanel}
        />
      </section>

      {isTeacher ? (
        <ActivitiesMenu
          title="Δραστηριότητα"
          icon="🎯"
          label="Επιλογή δραστηριότητας"
          options={ACTIVITY_LIBRARY.map((activity) => ({ value: activity.id, label: `${activity.code} ${activity.title}` }))}
          value={selectedActivityId}
          onChange={setActivity}
        />
      ) : null}

      {isTeacher ? (
        <div className="linear-bottom-panels">
          <Accordion title="Δεδομένα δραστηριότητας" icon="🗂️" open>
            <div className="lab-data-section data-section">
              <label className="shared-activity-label" htmlFor="linear-expression">Άσκηση</label>
              <select
                id="linear-expression"
                className="shared-activity-select"
                value={selectedItemId}
                onChange={(event) => setLessonItem(event.target.value)}
              >
                {activeItems.length === 0 ? <option value="">Δεν υπάρχουν ασκήσεις</option> : null}
                {activeItems.map((item, index) => (
                  <option key={item.id} value={item.id}>{`${index + 1}.`}</option>
                ))}
              </select>

              <label className="linear-toggle">
                <input
                  type="checkbox"
                  checked={showEquationGraph}
                  onChange={(event) => setGraphVisibility(event.target.checked)}
                />
                <span>Εμφάνιση οπτικής γραφικής απεικόνισης (δεξιά)</span>
              </label>
            </div>
          </Accordion>

          <StudentTable
            title="📋 Πίνακας μαθητών"
            participants={sortedParticipants}
            getRowStyle={(entry) => {
              const completed = String(entry?.answers?.completed || '') === '1';
              return completed
                ? {
                    backgroundColor: '#ecfdf5',
                    boxShadow: 'inset 0 0 0 1px rgba(16, 185, 129, 0.35)'
                  }
                : undefined;
            }}
            columns={[
              { key: 'activityCode', label: 'Δραστηριότητα', render: (entry) => entry.activityId || '-' },
              { key: 'itemId', label: 'Άσκηση', render: (entry) => entry.itemId || '-' },
              { key: 'equation1', label: 'Εξίσωση 1', render: (entry) => entry.answers?.equation1 || '-' },
              { key: 'equation2', label: 'Εξίσωση 2', render: (entry) => entry.answers?.equation2 || '-' },
              { key: 'classification', label: 'Ομαδοποίηση', render: (entry) => entry.answers?.classification || '-' },
              { key: 'score', label: 'Σκορ', render: (entry) => entry.answers?.score || '-' }
            ]}
            emptyMessage="Δεν υπάρχουν ακόμη συνδεδεμένοι μαθητές."
          />
        </div>
      ) : null}
    </div>
  );
}
