import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivitiesAccordion,
  GroupingDragDrop,
  PlacementBoard,
  HeroTitle,
  MathFormula,
  SharedCommonZoneLayout,
  InputGrid,
  SharedInputRow,
  PlotWidget,
  EquationWidget,
  DataAccordion,
  GroupsAccordion,
  GridButton,
  createPlacementGroupColumns,
  OptionsGrid,
  NumberLine,
  readIdentitySnapshot,
  FullScreenButton,
  useSessionInputLogger
} from '../../shared/components';
import storedActivityData from './data/activities.json';
import { resolveWorkshopDocument } from '../../shared/components/activities/activityDocument';
import './App.css';

const activityData = resolveWorkshopDocument(storedActivityData);
const { workshop: COURSE, activities: ACTIVITY_LIBRARY, lessons: LESSON_DATA } = activityData;
const PRESENTATION = COURSE.presentation;
const EQUATION_COPY = PRESENTATION.widgets.equation;
const GRAPH_COPY = PRESENTATION.widgets.graph;
const PLACEMENT_COPY = PRESENTATION.activities.placement;
const POINT_GRID_COPY = PRESENTATION.activities.pointGrid;
const NUMBER_LINE_COPY = PRESENTATION.activities.numberLine;
const GRAPHING_INPUT_COPY = PRESENTATION.activities.graphingInput;
const ALGEBRA_COPY = PRESENTATION.activities.algebra;
const EMBODIED_COPY = PRESENTATION.activities.embodied;
const FEEDBACK_COPY = PRESENTATION.feedback;
const SERVICE_COPY = PRESENTATION.services;
const TABLE_COPY = PRESENTATION.tables;

const EMPTY_TOKEN = '?';
const POINT_GRID_ACTIVITY = ACTIVITY_LIBRARY.find((activity) => activity.mode === 'point-grid');
const POINT_GRID_ACTIVITY_ID = POINT_GRID_ACTIVITY?.id;
const POINT_GRID_SETTINGS = POINT_GRID_ACTIVITY?.resourceSettings?.pointGrid || {};
const POINT_GRID_EQUATIONS = LESSON_DATA[POINT_GRID_ACTIVITY_ID]?.equations || [];
const NUMBER_LINE_ACTIVITY_ID = ACTIVITY_LIBRARY.find((activity) => activity.mode === 'number-line')?.id;
const NUMBER_LINE_EQUATIONS = LESSON_DATA[NUMBER_LINE_ACTIVITY_ID]?.equations || [];
const POINT_GRID_WIDTH = POINT_GRID_SETTINGS.maxX - POINT_GRID_SETTINGS.minX + 1;
const POINT_GRID_HEIGHT = POINT_GRID_SETTINGS.maxY - POINT_GRID_SETTINGS.minY + 1;
const POINT_GRID_AXIS_LABELS = POINT_GRID_SETTINGS.showAxisLabels !== false;
const POINT_GRID_SPACERS = Array.from({ length: POINT_GRID_WIDTH + 1 }, (_, index) => ({ id: `grid-spacer-${index}`, kind: 'spacer' }));
const POINT_GRID_CELLS = Array.from({ length: POINT_GRID_HEIGHT }, (_, rowIndex) => {
  const y = POINT_GRID_SETTINGS.maxY - rowIndex;
  return Array.from({ length: POINT_GRID_WIDTH }, (_, columnIndex) => ({
    id: `point-${columnIndex + POINT_GRID_SETTINGS.minX}-${y}`,
    kind: 'point',
    x: columnIndex + POINT_GRID_SETTINGS.minX,
    y
  }));
}).flat();
function parseSelectedPoints(value) {
  let parsed = value;
  if (typeof value === 'string') {
    try {
      parsed = JSON.parse(value);
    } catch {
      return [];
    }
  }

  if (!Array.isArray(parsed)) return [];
  const unique = new Map();
  parsed.forEach((point) => {
    const x = Number(point?.x);
    const y = Number(point?.y);
    if (!Number.isInteger(x) || !Number.isInteger(y)
      || x < POINT_GRID_SETTINGS.minX || x > POINT_GRID_SETTINGS.maxX
      || y < POINT_GRID_SETTINGS.minY || y > POINT_GRID_SETTINGS.maxY) return;
    unique.set(`${x},${y}`, { x, y });
  });
  return [...unique.values()];
}
const POINT_GRID_ITEMS = [
  ...(POINT_GRID_AXIS_LABELS
    ? [{ id: 'point-grid-corner', kind: 'corner' }, ...Array.from({ length: POINT_GRID_WIDTH }, (_, index) => ({ id: `x-label-${index}`, kind: 'x-label', value: index + POINT_GRID_SETTINGS.minX }))]
    : POINT_GRID_SPACERS),
  ...Array.from({ length: POINT_GRID_HEIGHT }, (_, rowIndex) => [
    POINT_GRID_AXIS_LABELS
      ? { id: `y-label-${rowIndex}`, kind: 'y-label', value: POINT_GRID_SETTINGS.maxY - rowIndex }
      : { id: `grid-row-spacer-${rowIndex}`, kind: 'spacer' },
    ...POINT_GRID_CELLS.slice(rowIndex * POINT_GRID_WIDTH, (rowIndex + 1) * POINT_GRID_WIDTH)
  ]).flat()
];

function normalizeText(value) {
  return String(value || '').trim();
}

function formatWidgetLabel(template, values) {
  return String(template || '').replace(/\{(\w+)\}/g, (match, key) => String(values[key] ?? match));
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

  if (Math.abs(b) < 1e-9) {
    return Math.abs(a) < 1e-9 ? null : { verticalX: c / a };
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

  if (!Number.isFinite(a) || !Number.isFinite(b) || !Number.isFinite(c)) {
    return null;
  }

  if (Math.abs(b) < 1e-9) {
    return Math.abs(a) < 1e-9 ? null : { verticalX: -c / a };
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
  const { t } = useTranslation('interface');
  const sessionLogging = useSessionInputLogger();
  const isTeacher = role === 'teacher';
  const isStudent = !isTeacher;

  const wsRef = useRef(null);
  const studentSocketIdRef = useRef('');
  const reconnectTimerRef = useRef(null);
  const hasRegisteredRef = useRef(false);

  const [isSocketConnected, setIsSocketConnected] = useState(false);
  const [participants, setParticipants] = useState([]);
  const [sessionLogParticipants, setSessionLogParticipants] = useState([]);
  const [selectedActivityId, setSelectedActivityId] = useState(ACTIVITY_LIBRARY[0].id);
  const [selectedItemId, setSelectedItemId] = useState(() => getInitialItemId(ACTIVITY_LIBRARY[0].id));
  const [selectedExpressionId, setSelectedExpressionId] = useState('');
  const [answer, setAnswer] = useState({ x: '', y: '' });
  const [groupingPlacementsByActivity, setGroupingPlacementsByActivity] = useState({});
  const [invalidGroupingItemIds, setInvalidGroupingItemIds] = useState([]);
  const [showEquationGraph, setShowEquationGraph] = useState(() => ACTIVITY_LIBRARY[0]?.widgets?.find((widget) => widget.region === 'right')?.visibleByDefault !== false);
  const [equationInputsByItem, setEquationInputsByItem] = useState({});
  const [lastSentState, setLastSentState] = useState('');
  const [identity, setIdentity] = useState(() => readIdentitySnapshot({ nameFallback: 'Student', colorFallback: '#4ECDC4' }));
  const [assignedEquationIndex, setAssignedEquationIndex] = useState(null);
  const [selectedPoints, setSelectedPoints] = useState([]);
  const [numberLineMarks, setNumberLineMarks] = useState([]);

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
  const numberLinePresentation = activeActivity.presentation;

  const activeItems = useMemo(
    () => (LESSON_DATA[selectedActivityId] && LESSON_DATA[selectedActivityId].items) || [],
    [selectedActivityId]
  );

  const activeItem = useMemo(
    () => activeItems.find((item) => item.id === selectedItemId) || activeItems[0] || null,
    [activeItems, selectedItemId]
  );

  const groupingGroups = useMemo(
    () => ((LESSON_DATA[selectedActivityId] && LESSON_DATA[selectedActivityId].groups) || []).map((group) => ({
      ...group,
      title: group.title,
      hint: group.hint
    })),
    [selectedActivityId, t]
  );

  const activeGroupingPlacements = useMemo(() => {
    const byActivity = groupingPlacementsByActivity[selectedActivityId] || {};
    return byActivity[selectedItemId] || {};
  }, [groupingPlacementsByActivity, selectedActivityId, selectedItemId]);

  const placementStateKey = activeActivity.mode === 'placement-board'
    ? `${selectedItemId}:${selectedExpressionId}`
    : selectedItemId;

  const activePlacementGroups = useMemo(() => {
    if (!activeItem || !Array.isArray(activeItem.groups)) {
      return [];
    }

    return activeItem.groups;
  }, [activeItem]);

  const activePlacementGraphItems = useMemo(() => {
    if (activeActivity.mode !== 'placement-board') {
      return [];
    }

    return [];
  }, [activeActivity.mode]);

  const activeExpressionOptions = useMemo(() => {
    if (!Array.isArray(activeItem?.expressions)) {
      return [];
    }

    return activeItem.expressions.map((expression, index) => ({
      value: expression.id || `expr-${index + 1}`,
      label: expression.equation || formatWidgetLabel(TABLE_COPY.equationTemplate, { number: index + 1 })
    }));
  }, [activeItem]);

  const activeSelectedExpression = useMemo(
    () => activeItem?.expressions?.find((expression) => expression.id === selectedExpressionId) || activeItem?.expressions?.[0] || null,
    [activeItem, selectedExpressionId]
  );

  const activePlacementItems = useMemo(() => activeSelectedExpression?.items || [], [activeSelectedExpression]);

  useEffect(() => {
    if (!activeItem || !Array.isArray(activeItem.expressions) || !activeItem.expressions.length) {
      return;
    }

    setSelectedExpressionId((current) => {
      const nextValue = activeExpressionOptions.some((option) => option.value === current) ? current : activeExpressionOptions[0].value;
      return nextValue;
    });
  }, [activeExpressionOptions, activeItem]);

  const activeSelectedEquation = useMemo(() => {
    return activeSelectedExpression?.equation || '';
  }, [activeSelectedExpression]);

  const activePlacementPlacements = useMemo(() => {
    const byActivity = groupingPlacementsByActivity[selectedActivityId] || {};
    return byActivity[placementStateKey] || {};
  }, [groupingPlacementsByActivity, placementStateKey, selectedActivityId]);

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
    if (!['grouping', 'placement-board'].includes(activeActivity.mode)) {
      setInvalidGroupingItemIds([]);
      return;
    }

    setGroupingPlacementsByActivity((current) => {
      const currentActivityMap = current[selectedActivityId] || {};
      if (currentActivityMap[placementStateKey]) {
        return current;
      }

      const activityItems = activeActivity.mode === 'placement-board' ? activePlacementItems : activeItems;
      const initial = activityItems.reduce((placements, item) => {
        placements[item.id] = null;
        return placements;
      }, {});

      return {
        ...current,
        [selectedActivityId]: {
          ...currentActivityMap,
          [placementStateKey]: initial
        }
      };
    });
  }, [activeActivity.mode, activeItems, activePlacementItems, placementStateKey, selectedActivityId]);

  const systemEquations = useMemo(() => {
    if (activeActivity.mode === 'graphing-input') {
      return [
        formatEquationFromRow(activeEquationInputs.equation1),
        formatEquationFromRow(activeEquationInputs.equation2)
      ];
    }

    if (activeActivity.mode === 'placement-board') {
      return activeSelectedEquation ? [activeSelectedEquation] : [];
    }

    return extractSystemEquations(activeItem);
  }, [activeActivity.mode, activeEquationInputs.equation1, activeEquationInputs.equation2, activeItem, activeSelectedEquation]);

  const graphWidgetSettings = activeActivity.widgets?.find((widget) => widget.region === 'right')?.settings || {};
  const graphColors = graphWidgetSettings.lineColors || ['#2563eb', '#dc2626'];
  const graphLineLabelTemplate = graphWidgetSettings.lineLabelTemplate || '{equation}';

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
            ...parsed,
            color: graphColors[index] || '#2563eb',
            label: formatWidgetLabel(graphLineLabelTemplate, { index: index + 1, equation: formatEquationFromRow(row) })
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
          ...parsed,
          color: graphColors[index] || '#2563eb',
          label: formatWidgetLabel(graphLineLabelTemplate, { index: index + 1, equation: String(equation || '').trim() || '?' })
        };
      })
      .filter(Boolean);
  }, [activeActivity.mode, activeEquationInputs.equation1, activeEquationInputs.equation2, graphColors, graphLineLabelTemplate, selectedActivityId, selectedItemId, systemEquations]);

  const evaluation = useMemo(() => {
    if (activeActivity.mode === 'number-line') {
      const assignedEquation = Number.isInteger(assignedEquationIndex)
        ? NUMBER_LINE_EQUATIONS[assignedEquationIndex % NUMBER_LINE_EQUATIONS.length]
        : null;
      if (!assignedEquation) return { ready: false, feedback: '', invalidIds: [], payload: null };
      const ownMark = numberLineMarks.find((mark) => mark.own && mark.kind === 'point');
      const selectedX = ownMark ? Math.round(Number(ownMark.value)) : null;
      const expectedX = assignedEquation.rhs / assignedEquation.x;
      const isCorrect = Number.isInteger(selectedX) && selectedX === expectedX;
      return {
        ready: true,
        feedback: '',
        invalidIds: [],
        payload: {
          completed: ownMark ? '1' : '0',
          numberLineX: ownMark ? String(selectedX) : '',
          score: ownMark && isCorrect ? 10 : 0
        }
      };
    }

    if (activeActivity.mode === 'point-grid') {
      const assignedEquation = Number.isInteger(assignedEquationIndex)
        ? POINT_GRID_EQUATIONS[assignedEquationIndex % POINT_GRID_EQUATIONS.length]
        : null;
      if (!assignedEquation) {
        return { ready: false, feedback: '', invalidIds: [], payload: null };
      }

      const expectedPoints = POINT_GRID_CELLS.filter((point) => (
        assignedEquation.x * point.x + assignedEquation.y * point.y === assignedEquation.rhs
      ));
      const expectedKeys = new Set(expectedPoints.map((point) => `${point.x},${point.y}`));
      const selectedKeys = new Set(selectedPoints.map((point) => `${point.x},${point.y}`));
      const correctCount = [...selectedKeys].filter((key) => expectedKeys.has(key)).length;
      const unionCount = expectedKeys.size + selectedKeys.size - correctCount;
      const score = unionCount ? Math.round((correctCount / unionCount) * 10) : 0;
      return {
        ready: true,
        feedback: '',
        invalidIds: [],
        payload: {
          completed: selectedPoints.length ? '1' : '0',
          selectedPoints: JSON.stringify(selectedPoints),
          selectedPointCount: selectedPoints.length,
          score
        }
      };
    }

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
        feedback: isComplete ? FEEDBACK_COPY.systemUpdated : FEEDBACK_COPY.enterCoefficients,
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
      const expectedItems = activeItems;
      const placements = expectedItems.reduce((next, item) => {
        next[item.id] = activeGroupingPlacements[item.id] || null;
        return next;
      }, {});
      const allPlaced = expectedItems.every((item) => Boolean(placements[item.id]));
      if (!allPlaced) {
        return {
          ready: false,
          feedback: '',
          invalidIds: [],
          payload: {
            completed: '0',
            placements,
            correctPlacements: Object.fromEntries(expectedItems.map((item) => [item.id, item.correctGroupId || null])),
            classification: `${expectedItems.filter((item) => Boolean(placements[item.id])).length}/${expectedItems.length}`
          }
        };
      }

      const invalidIds = expectedItems
        .filter((item) => (placements[item.id] || null) !== item.correctGroupId)
        .map((item) => item.id);

      const correctCount = expectedItems.length - invalidIds.length;
      const score = invalidIds.length === 0 ? 10 : 0;
      const feedback = invalidIds.length === 0
        ? FEEDBACK_COPY.allGrouped
        : FEEDBACK_COPY.groupingErrors;

      return {
        ready: true,
        feedback,
        invalidIds,
        payload: {
          score,
          completed: '1',
          placements,
          correctPlacements: Object.fromEntries(expectedItems.map((item) => [item.id, item.correctGroupId || null])),
          classification: `${correctCount}/${expectedItems.length}`
        }
      };
    }

    if (activeActivity.mode === 'placement-board') {
      const pointEntries = activePlacementItems.map((point) => {
        const actual = activePlacementPlacements[point.id] || null;
        const expected = point.correctGroupId || null;
        return {
          id: point.id,
          actual,
          expected
        };
      });

      const unansweredIds = pointEntries
        .filter((entry) => !entry.actual)
        .map((entry) => entry.id);
      const invalidIds = pointEntries
        .filter((entry) => entry.actual && entry.actual !== entry.expected)
        .map((entry) => entry.id);

      const allAnswered = pointEntries.length > 0 && unansweredIds.length === 0;
      const correctCount = pointEntries.filter((entry) => entry.actual === entry.expected).length;
      const score = pointEntries.length ? Math.round((correctCount / pointEntries.length) * 10) : 0;

      if (!allAnswered) {
        return {
          ready: false,
          feedback: pointEntries.length === 0 ? '' : PLACEMENT_COPY.incomplete,
          invalidIds: [],
          payload: {
            completed: '0',
            score,
            placements: Object.fromEntries(pointEntries.map((entry) => [entry.id, entry.actual])),
            correctPlacements: Object.fromEntries(pointEntries.map((entry) => [entry.id, entry.expected])),
            classification: `${correctCount}/${pointEntries.length}`
          }
        };
      }

      return {
        ready: true,
        feedback: invalidIds.length === 0 ? PLACEMENT_COPY.correct : PLACEMENT_COPY.incorrect,
        invalidIds,
        payload: {
          score,
          completed: '1',
          placements: Object.fromEntries(pointEntries.map((entry) => [entry.id, entry.actual])),
          correctPlacements: Object.fromEntries(pointEntries.map((entry) => [entry.id, entry.expected])),
          classification: `${correctCount}/${pointEntries.length}`
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
    const feedback = score === 10 ? FEEDBACK_COPY.correct : formatWidgetLabel(FEEDBACK_COPY.partial, { score });

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
  }, [activeActivity.mode, activeEquationInputs.equation1, activeEquationInputs.equation2, activeGroupingPlacements, activeItem, activeItems, activePlacementItems, activePlacementPlacements, answer.x, answer.y, assignedEquationIndex, coordinateLines.length, numberLineMarks, selectedPoints, t]);

  useEffect(() => {
    setInvalidGroupingItemIds(evaluation.invalidIds);
  }, [evaluation.invalidIds]);

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

        if (message?.type === 'linear_systems_assignment') {
          studentSocketIdRef.current = String(message.studentId || '');
          setAssignedEquationIndex(Number.isInteger(message.assignmentIndex) ? message.assignmentIndex : null);
          return;
        }

        if (message?.type !== 'linear_systems_state') {
          return;
        }

        if (Array.isArray(message.participants)) {
          setParticipants(message.participants);
          const ownParticipant = message.participants.find((participant) => participant.id === studentSocketIdRef.current);
          if (ownParticipant) {
            setAssignedEquationIndex(Number.isInteger(ownParticipant.assignmentIndex) ? ownParticipant.assignmentIndex : null);
            const nextPoints = parseSelectedPoints(ownParticipant.answers?.selectedPoints);
            setSelectedPoints((current) => (
              JSON.stringify(current) === JSON.stringify(nextPoints) ? current : nextPoints
            ));
          }
        }

        const lesson = message.lesson && typeof message.lesson === 'object' ? message.lesson : null;
        if (!lesson) {
          return;
        }

        const nextActivity = normalizeText(lesson.activityId);
        const nextItemId = normalizeText(lesson.itemId);
        const nextExpressionId = normalizeText(lesson.expressionId);

        if (Object.prototype.hasOwnProperty.call(lesson, 'showEquationGraph')) {
          setShowEquationGraph(Boolean(lesson.showEquationGraph));
        }
        if (Object.prototype.hasOwnProperty.call(lesson, 'expressionId')) {
          setSelectedExpressionId(nextExpressionId);
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
    if (!isTeacher || !sessionLogging?.activeSessionId) {
      setSessionLogParticipants([]);
      return undefined;
    }

    let cancelled = false;
    let requestInFlight = false;
    const refreshParticipants = async () => {
      if (requestInFlight) return;
      requestInFlight = true;
      try {
        const response = await fetch('/api/session-logs/active/linear-systems-lab/students', { cache: 'no-store' });
        const payload = response.ok ? await response.json() : null;
        if (!cancelled) setSessionLogParticipants(Array.isArray(payload?.students) ? payload.students : []);
      } catch {
        if (!cancelled) setSessionLogParticipants([]);
      } finally {
        requestInFlight = false;
      }
    };

    refreshParticipants();
    const timer = window.setInterval(refreshParticipants, 750);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [isTeacher, sessionLogging?.activeSessionId]);

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
    const nextExpressionId = nextItems[0]?.expressions?.[0]?.id || '';
    const nextActivity = ACTIVITY_LIBRARY.find((activity) => activity.id === activityId);
    const nextShowEquationGraph = nextActivity?.widgets?.find((widget) => widget.region === 'right')?.visibleByDefault !== false;

    setSelectedActivityId(activityId);
    setSelectedItemId(nextItemId);
    setSelectedExpressionId(nextExpressionId);
    setShowEquationGraph(nextShowEquationGraph);
    setAnswer({ x: '', y: '' });

    if (isTeacher) {
      sendSocketMessage({
        type: 'teacher_lesson',
        lesson: {
          activityId,
          itemId: nextItemId,
          expressionId: nextExpressionId,
          showEquationGraph: nextShowEquationGraph
        }
      });
    }
  };

  const setLessonItem = (nextItemId) => {
    const itemId = normalizeText(nextItemId);
    if (!itemId || itemId === selectedItemId) {
      return;
    }

    const nextItem = activeItems.find((item) => item.id === itemId);
    const nextExpressionId = nextItem?.expressions?.[0]?.id || '';
    setSelectedItemId(itemId);
    setSelectedExpressionId(nextExpressionId);
    setAnswer({ x: '', y: '' });

    if (isTeacher) {
      sendSocketMessage({
        type: 'teacher_lesson',
        lesson: {
          activityId: selectedActivityId,
          itemId,
          expressionId: nextExpressionId,
          showEquationGraph
        }
      });
    }
  };

  const setLessonExpression = (nextExpressionId) => {
    const expressionId = normalizeText(nextExpressionId);
    if (!expressionId || expressionId === selectedExpressionId) return;
    setSelectedExpressionId(expressionId);
    setInvalidGroupingItemIds([]);
    if (isTeacher) {
      sendSocketMessage({
        type: 'teacher_lesson',
        lesson: {
          activityId: selectedActivityId,
          itemId: selectedItemId,
          expressionId,
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
        expressionId: selectedExpressionId,
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
    const mergedByName = new Map(source.map((participant) => [
      String(participant.name || participant.username || '').trim().toLocaleLowerCase(),
      participant
    ]));

    sessionLogParticipants.forEach((sessionParticipant) => {
      const nameKey = String(sessionParticipant.name || sessionParticipant.username || '').trim().toLocaleLowerCase();
      const current = mergedByName.get(nameKey) || {};
      const livePlacements = sessionParticipant.answers?.[selectedActivityId] || {};
      mergedByName.set(nameKey, {
        ...current,
        ...sessionParticipant,
        answers: {
          ...(current.answers || {}),
          ...(sessionParticipant.answers || {}),
          placements: {
            ...(current.answers?.placements || {}),
            ...(livePlacements || {})
          }
        }
      });
    });

    const merged = [...mergedByName.values()];
    const resolved = merged.map((participant) => {
      const livePlacements = participant.answers?.[selectedActivityId] || {};
      return {
        ...participant,
        answers: {
          ...(participant.answers || {}),
          placements: {
            ...(participant.answers?.placements || {}),
            ...(livePlacements || {})
          }
        }
      };
    });
    return resolved.sort((a, b) => String(a.name || '').localeCompare(String(b.name || '')));
  }, [participants, selectedActivityId, sessionLogParticipants]);

  const placementTableColumns = useMemo(() => {
    if (activeActivity.mode !== 'placement-board') {
      return [];
    }

    return [
      ...createPlacementGroupColumns(
        activePlacementGroups,
        activePlacementItems,
        (entry, item) => entry?.answers?.placements?.[item.id],
        sessionLogging?.scoreVisible !== false
      ),
      ...(sessionLogging?.scoreVisible !== false ? [{
        key: 'placement-score',
        label: t('score'),
        render: (entry) => {
          const placements = entry?.answers?.placements && typeof entry.answers.placements === 'object' ? entry.answers.placements : {};
          const correctCount = activePlacementItems.filter((item) => placements[item.id] === item.correctGroupId).length;
          const score = activePlacementItems.length ? Math.round((correctCount / activePlacementItems.length) * 10) : 0;
          return `${score}/10`;
        }
      }] : [])
    ];
  }, [activeActivity.mode, activePlacementGroups, activePlacementItems, sessionLogging?.scoreVisible]);

  const graphPanelVisible = showEquationGraph && (activeActivity.mode === 'graphing-input' || activeActivity.mode === 'placement-board' || coordinateLines.length > 0);
  const isGroupingMode = activeActivity.mode === 'grouping';
  const leftWidget = activeActivity.widgets?.find((widget) => widget.region === 'left');
  const leftWidgetSettings = { ...(leftWidget?.settings || leftWidget || {}), ...(leftWidget?.presentation || {}) };
  const leftWidgetContent = leftWidgetSettings.content || {};
  const rightWidget = activeActivity.widgets?.find((widget) => widget.region === 'right') || {};
  const rightWidgetSettings = rightWidget.settings || {};
  const numberLineSettings = activeActivity.resourceSettings?.numberLine || {};
  const assignedPointEquation = Number.isInteger(assignedEquationIndex)
    ? POINT_GRID_EQUATIONS[assignedEquationIndex % POINT_GRID_EQUATIONS.length]
    : null;
  const assignedNumberLineEquation = Number.isInteger(assignedEquationIndex)
    ? NUMBER_LINE_EQUATIONS[assignedEquationIndex % NUMBER_LINE_EQUATIONS.length]
    : null;
  const graphVisibilityControl = (
    <label className="linear-toggle">
      <input
        type="checkbox"
        checked={showEquationGraph}
        onChange={(event) => setGraphVisibility(event.target.checked)}
      />
      <span>{rightWidget.visibilityLabel || GRAPH_COPY.showGraph}</span>
    </label>
  );

  const leftPanel = activeActivity.mode === 'number-line' ? null : (
    <div className="lab-card lab-card--highlight poly-expression-card linear-expression-card" aria-label={leftWidgetSettings.ariaLabel || EQUATION_COPY.ariaLabel}>
      <p className="lab-mini-label poly-mini-label">{leftWidgetSettings.miniLabel || EQUATION_COPY.label}</p>
      {activeActivity.mode === 'graphing-input' ? (
        <div className="linear-system-preview" aria-label={leftWidgetSettings.previewAriaLabel || EQUATION_COPY.previewAriaLabel}>
          <p>{formatEquationFromRow(activeEquationInputs.equation1)}</p>
          <p>{formatEquationFromRow(activeEquationInputs.equation2)}</p>
        </div>
      ) : activeActivity.mode === 'point-grid' ? (
        <div className="linear-point-grid-equation">
          {isStudent ? (
            assignedPointEquation ? (
              <EquationWidget expression={assignedPointEquation.equation} />
            ) : <p>{POINT_GRID_COPY.waiting}</p>
          ) : (
            <p>{POINT_GRID_COPY.teacherInfo}</p>
          )}
        </div>
      ) : activeActivity.mode === 'placement-board' ? (
        <div className="linear-placement-equations" aria-label={leftWidgetContent.placementAriaLabel || leftWidgetSettings.ariaLabel || EQUATION_COPY.ariaLabel}>
          {activeSelectedEquation ? (
            <div key={`${activeItem.id}-selected-equation`} className="linear-placement-equation">
              {leftWidgetContent.type === 'equation' ? (
                <EquationWidget {...(leftWidgetContent.settings || {})} expression={activeSelectedEquation} />
              ) : null}
            </div>
          ) : null}
        </div>
      ) : activeItem && activeItem.systemLatex ? (
        <div className="lab-math-box poly-expression-math">
          <MathFormula formula={`\\(${activeItem.systemLatex}\\)`} />
        </div>
      ) : (
        <div className="lab-math-box poly-expression-math poly-expression-math--empty" />
      )}
    </div>
  );

  const centerPanel = (
    <div className={`lab-card lab-card--panel poly-team-card linear-team-card${activeActivity.mode === 'number-line' ? ' linear-team-card--full' : ''}`}>
      {activeActivity.mode === 'graphing-input' ? (
        <div className="poly-template-answer-panel">
          <div className="poly-team-grid poly-team-grid--full">
            <div className="poly-term-block poly-term-block--result">
              <div className="poly-term-inputs poly-term-inputs--result">
                {GRAPHING_INPUT_COPY.equations.map((equation) => (
                  <SharedInputRow
                    key={equation.id}
                    activity={`linear-systems:${selectedActivityId}`}
                    rowLabel={equation.rowLabel}
                    tokens={equation.tokens}
                    hideLabels
                    defaultPlaceholder=""
                    boxes={[
                      {
                        label: EQUATION_COPY.coefficientX,
                        value: activeEquationInputs[equation.id].x,
                        onChange: (event) => updateEquationInput(equation.id, 'x', event.target.value)
                      },
                      {
                        label: EQUATION_COPY.coefficientY,
                        value: activeEquationInputs[equation.id].y,
                        onChange: (event) => updateEquationInput(equation.id, 'y', event.target.value)
                      },
                      {
                        label: EQUATION_COPY.rightHandSide,
                        value: activeEquationInputs[equation.id].rhs,
                        onChange: (event) => updateEquationInput(equation.id, 'rhs', event.target.value)
                      }
                    ]}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {activeActivity.mode === 'number-line' ? (
        <section className={numberLinePresentation.panel.className} style={{ width: numberLinePresentation.layout.width }}>
          <div className={numberLinePresentation.panel.equationClassName}>
            {isStudent ? (
              assignedNumberLineEquation ? (
                <p><strong>{formatWidgetLabel(numberLinePresentation.panel.equationHeading, { equation: assignedNumberLineEquation.equation })}</strong></p>
              ) : <p>{formatWidgetLabel(numberLinePresentation.panel.waitingText, { waiting: POINT_GRID_COPY.waiting })}</p>
            ) : <p>{formatWidgetLabel(numberLinePresentation.panel.teacherText, { teacherInfo: NUMBER_LINE_COPY.teacherInfo })}</p>}
          </div>
          <p className={numberLinePresentation.panel.instructionClassName}>
            {isStudent ? NUMBER_LINE_COPY.instruction : NUMBER_LINE_COPY.teacherInstruction}
          </p>
          <NumberLine
            {...numberLineSettings}
            roomId="linear-systems-x-intercepts"
            sessionApp="linear-systems-lab"
            canEdit={isStudent}
            onMarksChange={setNumberLineMarks}
          />
        </section>
      ) : null}

      {activeActivity.mode === 'point-grid' ? (
        <section className="linear-point-grid-panel">
          <p className="linear-point-grid-panel__instruction">
            {isStudent ? POINT_GRID_COPY.instruction : POINT_GRID_COPY.teacherInstruction}
          </p>
          <div className="linear-point-grid-panel__scroll">
            <OptionsGrid
              items={POINT_GRID_ITEMS}
              columns={POINT_GRID_WIDTH + 1}
              className="linear-point-grid"
              style={{ '--point-grid-columns': POINT_GRID_WIDTH }}
              ariaLabel={POINT_GRID_COPY.ariaLabel}
              renderItem={(item) => {
                if (item.kind === 'corner') return <span className="linear-point-grid__corner" key={item.id}>{POINT_GRID_COPY.axisCorner}</span>;
                if (item.kind === 'spacer') return <span aria-hidden="true" key={item.id} />;
                if (item.kind === 'x-label') return <span className="linear-point-grid__axis-label" key={item.id}>{item.value}</span>;
                if (item.kind === 'y-label') return <span className="linear-point-grid__axis-label" key={item.id}>{item.value}</span>;

                const isSelected = selectedPoints.some((point) => point.x === item.x && point.y === item.y);
                const markers = participants
                  .filter((participant) => participant.id !== studentSocketIdRef.current
                    && parseSelectedPoints(participant.answers?.selectedPoints).some((point) => point.x === item.x && point.y === item.y))
                  .map((participant) => ({ id: participant.id, name: participant.name, color: participant.color }));
                if (isSelected && isStudent) {
                  markers.push({ id: 'current-student', name: identity.name, color: identity.color });
                }

                return (
                  <GridButton
                    className={`linear-point-grid__point${item.x === 0 ? ' is-y-axis' : ''}${item.y === 0 ? ' is-x-axis' : ''}${isSelected ? ' is-selected' : ''}`}
                    aria-label={formatWidgetLabel(POINT_GRID_COPY.point, { x: item.x, y: item.y })}
                    pressed={isSelected}
                    title={markers.map((marker) => marker.name).filter(Boolean).join(', ')}
                    style={isSelected && isStudent ? { backgroundColor: identity.color, color: '#fff' } : undefined}
                    disabled={!isStudent}
                    onClick={() => setSelectedPoints((current) => (
                      current.some((point) => point.x === item.x && point.y === item.y)
                        ? current.filter((point) => point.x !== item.x || point.y !== item.y)
                        : [...current, { x: item.x, y: item.y }]
                    ))}
                  >
                    <span className="linear-point-grid__coordinates">{formatWidgetLabel(TABLE_COPY.pointCoordinates, item)}</span>
                    {markers.length > 0 ? (
                      <span className="linear-point-grid__markers" aria-hidden="true">
                        {markers.map((marker) => (
                          <span
                            key={marker.id}
                            className="linear-point-grid__marker"
                            style={{ backgroundColor: marker.color }}
                          />
                        ))}
                      </span>
                    ) : null}
                  </GridButton>
                );
              }}
            />
          </div>
        </section>
      ) : null}

      {activeActivity.mode === 'grouping' ? (
        <>
          <GroupingDragDrop
            activity={`linear-systems:${selectedActivityId}`}
            items={activeItems}
            groups={groupingGroups}
            placements={activeGroupingPlacements}
            onChange={(nextPlacements) => {
              setGroupingPlacementsByActivity((current) => ({
                ...current,
                [selectedActivityId]: {
                  ...(current[selectedActivityId] || {}),
                  [selectedItemId]: nextPlacements
                }
              }));
              setInvalidGroupingItemIds([]);
            }}
            invalidItemIds={invalidGroupingItemIds}
            bankLabel={PLACEMENT_COPY.groupingBank}
          />
        </>
      ) : null}

      {activeActivity.mode === 'placement-board' ? (
        <PlacementBoard
          key={selectedExpressionId}
          activity={`linear-systems:${selectedActivityId}`}
          items={activePlacementItems}
          groups={activePlacementGroups}
          placements={activePlacementPlacements}
          invalidItemIds={invalidGroupingItemIds}
          onChange={(nextPlacements) => {
            setGroupingPlacementsByActivity((current) => ({
              ...current,
              [selectedActivityId]: {
                ...(current[selectedActivityId] || {}),
                [placementStateKey]: nextPlacements
              }
            }));
            setInvalidGroupingItemIds([]);
          }}
          bankLabel={TABLE_COPY.placementBank}
        />
      ) : null}

      {activeActivity.mode === 'algebra' ? (
        <>
          <p className="linear-note">{ALGEBRA_COPY.solutionInstruction}</p>
          {activeItem && activeItem.eliminationLatex ? (
            <div className="linear-expression">
              <MathFormula formula={`\\(${activeItem.eliminationLatex}\\)`} />
            </div>
          ) : null}
          <InputGrid
            activity={`linear-systems:${selectedActivityId}`}
            columns={ALGEBRA_COPY.columns}
            labelClassName="activity-input-grid__label"
            fields={ALGEBRA_COPY.fields.map((field) => ({
              id: field.id,
              label: field.label,
              value: answer[field.id],
              placeholder: formatWidgetLabel(ALGEBRA_COPY.example, { value: field.example }),
              inputClassName: 'activity-input-grid__input',
              onChange: (value) => setAnswer((prev) => ({ ...prev, [field.id]: value }))
            }))}
          />
        </>
      ) : null}

      {activeActivity.mode === 'embodied' ? (
        <div className="linear-placeholder">
          <strong>{EMBODIED_COPY.title}</strong>
          <p>{EMBODIED_COPY.description}</p>
          <p>{EMBODIED_COPY.zones}</p>
        </div>
      ) : null}

    </div>
  );

  const rightPanel = graphPanelVisible ? (
    <aside className="lab-card lab-card--panel poly-team-card linear-graph-card">
      <p className="lab-mini-label poly-mini-label">{rightWidgetSettings.miniLabel || rightWidgetSettings.title || GRAPH_COPY.title}</p>
      {rightWidget.type === 'plot-widget' ? (
        <PlotWidget
          {...rightWidgetSettings}
          lines={coordinateLines}
          graphItems={activeActivity.mode === 'placement-board' ? activePlacementGraphItems : undefined}
          title=""
          accessibleLabel={rightWidgetSettings.ariaLabel || rightWidgetSettings.title || GRAPH_COPY.title}
        />
      ) : null}
    </aside>
  ) : null;

  return (
    <>
      <HeroTitle
        title={formatWidgetLabel(PRESENTATION.hero.titleTemplate, { ...PRESENTATION.hero, ...activeActivity })}
        subtitle={formatWidgetLabel(PRESENTATION.hero.subtitleTemplate, { ...PRESENTATION.hero, ...activeActivity })}
      />

      <section className="common-zone lab-zone">
        <FullScreenButton />
        <SharedCommonZoneLayout
          className="linear-neural-zone"
          isGroupingMode={isGroupingMode}
          leftPanel={leftPanel}
          centerPanel={centerPanel}
          rightPanel={rightPanel}
        />
      </section>

      {isTeacher ? (
        <ActivitiesAccordion
          options={ACTIVITY_LIBRARY.map((activity) => ({ value: activity.id, label: `${activity.code} ${activity.title}` }))}
          value={selectedActivityId}
          onChange={setActivity}
        />
      ) : null}

      {isTeacher ? (
        <>
          {activeActivity.mode !== 'placement-board' && activeActivity.mode !== 'point-grid' && activeActivity.mode !== 'number-line' ? (
            <DataAccordion
              title={SERVICE_COPY.exerciseTitle}
              label={SERVICE_COPY.exerciseTitle}
              icon="??"
              value={selectedItemId}
              options={activeItems.map((item, index) => ({ value: item.id, label: `${index + 1}.` }))}
              onChange={setLessonItem}
              emptyLabel={SERVICE_COPY.noExercises}
              selectId="linear-exercise"
            >
              {graphVisibilityControl}
            </DataAccordion>
          ) : null}

          {activeActivity.mode === 'placement-board' ? (
            <DataAccordion
              title={SERVICE_COPY.equationsTitle}
              label={SERVICE_COPY.equationLabel}
              icon="??"
              value={selectedExpressionId}
              options={activeExpressionOptions}
              onChange={setLessonExpression}
              selectId="linear-expression"
            >
              {graphVisibilityControl}
            </DataAccordion>
          ) : null}

          <GroupsAccordion
            open={['point-grid', 'number-line'].includes(activeActivity.mode)}
            nameColumnLabel={['placement-board', 'point-grid', 'number-line'].includes(activeActivity.mode) ? TABLE_COPY.groupColumn : ''}
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
              { key: 'activityCode', label: t('activities'), render: (entry) => entry.activityId || '-' },
              ...(!['point-grid', 'number-line'].includes(activeActivity.mode) ? [{ key: 'itemId', label: TABLE_COPY.exerciseColumn, render: (entry) => entry.itemId || '-' }] : []),
              ...(activeActivity.mode === 'placement-board' ? placementTableColumns : [
                ...(activeActivity.mode === 'point-grid' ? [
                  {
                    key: 'assigned-equation',
                    label: POINT_GRID_COPY.equationColumn,
                    render: (entry) => POINT_GRID_EQUATIONS[entry.assignmentIndex % POINT_GRID_EQUATIONS.length]?.equation || '-'
                  },
                  {
                    key: 'selected-point',
                    label: POINT_GRID_COPY.pointColumn,
                    render: (entry) => {
                      const points = parseSelectedPoints(entry.answers?.selectedPoints);
                      return points.length ? (
                        <span className="linear-point-grid-student-selections">
                          {points.map((point) => (
                            <span className="linear-point-grid-student-selections__item" key={`${point.x},${point.y}`}>
                              <span aria-hidden="true" style={{ backgroundColor: entry.color || '#3b82f6' }} />
              {formatWidgetLabel(TABLE_COPY.pointCoordinates, point)}
                            </span>
                          ))}
                        </span>
                      ) : '-';
                    }
                  }
                ] : [
                  ...(activeActivity.mode === 'number-line' ? [
                    {
                      key: 'assigned-number-line-equation',
                      label: POINT_GRID_COPY.equationColumn,
                      render: (entry) => NUMBER_LINE_EQUATIONS[entry.assignmentIndex % NUMBER_LINE_EQUATIONS.length]?.equation || '-'
                    },
                    {
                      key: 'number-line-x',
                      label: NUMBER_LINE_COPY.valueColumn,
                      render: (entry) => entry.answers?.numberLineX !== undefined ? formatWidgetLabel(TABLE_COPY.numberLineAnswer, { value: entry.answers.numberLineX }) : '-'
                    }
                  ] : [
                    { key: 'equation1', label: formatWidgetLabel(TABLE_COPY.equationTemplate, { number: 1 }), render: (entry) => entry.answers?.equation1 || '-' },
                    { key: 'equation2', label: formatWidgetLabel(TABLE_COPY.equationTemplate, { number: 2 }), render: (entry) => entry.answers?.equation2 || '-' },
                    { key: 'classification', label: TABLE_COPY.classification, render: (entry) => entry.answers?.classification || '-' }
                  ])
                ])
              ]),
              ...(activeActivity.mode !== 'placement-board' && sessionLogging?.scoreVisible !== false ? [{ key: 'score', label: t('score'), render: (entry) => entry.answers?.score ?? '-' }] : [])
            ]}
            emptyMessage={t('noStudents')}
          />
        </>
      ) : null}
    </>
  );
}

