import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  FullScreenButton,
  Accordion,
  SettingsAccordion,
  ActivitiesMenu,
  CollaborativeGeoGebra,
  GroupingDragDrop,
  HeroTitle,
  MathFormula,
  SharedCommonZoneLayout,
  InputGrid,
  StudentScoresAccordion,
  CommonSessionSettings,
  ChatAccordion,
  StudentTable,
  AlgebraTiles,
  randomIdentityColor,
  readIdentitySnapshot,
  readIdentityColor,
  readIdentityName,
  writeIdentityColor,
  writeIdentityName
} from '../../shared/components';
import { useSessionInputLogger } from '../../shared/components/activities/SessionLogContext';
import { SCORE_CORRECT, SCORE_INCORRECT, computeStudentScore, getAnswerFieldDefinitions } from './grading';
import activityData from './data/activities.json';
import './App.css';

const { activities: ACTIVITY_LIBRARY, datasets: ALGEBRA_DATASETS } = activityData;
const getActivityDatasetKey = (activityId) => ACTIVITY_LIBRARY.find((activity) => activity.id === activityId)?.datasetKey;

const formatMonomialFromParts = (coefficient, degreeX, degreeY) => {
  if (!Number.isFinite(coefficient) || coefficient === 0) {
    return '0';
  }

  const absCoefficient = Math.abs(coefficient);
  const includeCoefficient = absCoefficient !== 1 || (degreeX === 0 && degreeY === 0);
  const xPart = degreeX > 0 ? `x${degreeX > 1 ? `^${degreeX}` : ''}` : '';
  const yPart = degreeY > 0 ? `y${degreeY > 1 ? `^${degreeY}` : ''}` : '';
  const variablePart = `${xPart}${yPart}`;
  const coefficientPart = includeCoefficient ? String(absCoefficient) : '';

  return `${coefficientPart}${variablePart}` || String(absCoefficient);
};

const getGroupingValidationState = (expressionItem, placements) => {
  const expressionItems = Array.isArray(expressionItem?.items) ? expressionItem.items : [];

  return expressionItems.reduce((state, item) => {
    const placedGroupId = placements?.[item.id] || null;
    if (!placedGroupId) {
      return state;
    }

    if (placedGroupId !== item.correctGroupId) {
      state.invalidItemIds.push(item.id);
    }
    return state;
  }, { invalidItemIds: [] });
};

const isCorrectAnswer = (value, expected) => {
  const actualText = String(value ?? '').trim();
  if (!actualText || expected === undefined || expected === null) {
    return false;
  }

  const actualNumber = Number(actualText);
  const expectedNumber = Number(expected);
  if (Number.isFinite(actualNumber) && Number.isFinite(expectedNumber)) {
    return actualNumber === expectedNumber;
  }

  return actualText.toLowerCase() === String(expected).trim().toLowerCase();
};

const DEFAULT_ACTIVITY_ID = ACTIVITY_LIBRARY[0].id;

const getCurrentStudentAnswerPayload = (
  selectedExpressionId,
  activeExpression,
  expressionDrafts,
  groupingPlacementsByExpression,
  teamAnswers,
  isGroupingActivity,
  isDegreeOnlyActivity,
  isMonomialResultActivity,
  isPolynomialResultActivity
) => {
  if (isGroupingActivity) {
    const placements = groupingPlacementsByExpression[selectedExpressionId] || {};
    const groupingItems = Array.isArray(activeExpression?.items) ? activeExpression.items : [];

    return groupingItems.reduce((answers, item) => {
      answers[`item-${item.id}`] = placements[item.id] || '';
      return answers;
    }, {});
  }

  const currentParts = expressionDrafts[selectedExpressionId] || activeExpression?.parts || [];

  if (isDegreeOnlyActivity) {
    const firstPart = currentParts[0] || {};
    return {
      degreeX: firstPart.degreeX || '',
      degreeY: firstPart.degreeY || '',
      totalDegree: firstPart.totalDegree || ''
    };
  }

  if (isPolynomialResultActivity) {
    return currentParts.reduce((answerMap, part, index) => {
      answerMap[`part-${index}-coefficient`] = part?.coefficient || '';
      answerMap[`part-${index}-degreeX`] = part?.degreeX || '';
      answerMap[`part-${index}-degreeY`] = part?.degreeY || '';
      return answerMap;
    }, {});
  }

  if (isMonomialResultActivity) {
    const firstPart = currentParts[0] || {};
    return {
      coefficient: firstPart.coefficient || '',
      degreeX: firstPart.degreeX || '',
      degreeY: firstPart.degreeY || ''
    };
  }

  return {
    coefficient: teamAnswers.coefficient || '',
    degreeX: teamAnswers.degreeX || '',
    degreeY: teamAnswers.degreeY || '',
    totalDegree: teamAnswers.totalDegree || ''
  };
};

const getStudentScoreForExpression = (student, fallbackExpression) => {
  const expressionCandidate = fallbackExpression || {};
  const expressionId = student?.expressionId || expressionCandidate.id;
  const matchedExpression = Object.values(ALGEBRA_DATASETS)
    .flatMap((dataset) => dataset.items)
    .find((item) => item.id === expressionId) || expressionCandidate;

  return computeStudentScore(student, matchedExpression, {
    scoreCorrect: matchedExpression?.scoreCorrect ?? SCORE_CORRECT,
    scoreIncorrect: matchedExpression?.scoreIncorrect ?? SCORE_INCORRECT
  });
};

const getAnswerColumnsForExpression = (expressionItem, t) => {
  const fields = getAnswerFieldDefinitions(expressionItem);
  const groupingLabelByField = new Map(
    (expressionItem?.items || []).map((item) => [`item-${item.id}`, item.label])
  );

  return fields.map((fieldName) => {
    const partMatch = fieldName.match(/^part-(\d+)-(coefficient|degreeX|degreeY)$/);
    const label = partMatch
      ? partMatch[2] === 'coefficient' ? t('coefficient') : partMatch[2] === 'degreeX' ? 'x' : 'y'
      : groupingLabelByField.has(fieldName)
        ? groupingLabelByField.get(fieldName)
      : fieldName === 'coefficient'
        ? t('coefficient')
        : fieldName === 'degreeX'
          ? t('degreeX')
          : fieldName === 'degreeY'
            ? t('degreeY')
            : t('totalDegree');

    return {
      key: fieldName,
      label,
      render: (student) => {
        const value = student?.answers?.[fieldName];
        return value ?? '-';
      }
    };
  });
};

const getAnswerHeaderGroupsForExpression = (expressionItem, t) => {
  const fields = getAnswerFieldDefinitions(expressionItem);
  const groups = new Map();

  fields.forEach((fieldName) => {
    const match = fieldName.match(/^part-(\d+)-/);
    if (!match) {
      return;
    }

    const termIndex = Number(match[1]) + 1;
    if (!groups.has(termIndex)) {
      groups.set(termIndex, { label: t('termHeader', { term: termIndex }), colSpan: 0 });
    }
    groups.get(termIndex).colSpan += 1;
  });

  return Array.from(groups.values());
};

export default function App({ role = 'teacher' }) {
  const { t } = useTranslation('polynomial');
  const { t: tNav } = useTranslation('navigation');
  const navigate = useNavigate();
  const sessionLogging = useSessionInputLogger();
  const isTeacher = role === 'teacher';
  const isStudent = role === 'student';
  const wsRef = useRef(null);
  const reconnectTimerRef = useRef(null);
  const hasRegisteredRef = useRef(false);

  const [selectedActivityId, setSelectedActivityId] = useState(DEFAULT_ACTIVITY_ID);
  const [selectedExpressionId, setSelectedExpressionId] = useState(ALGEBRA_DATASETS[getActivityDatasetKey(DEFAULT_ACTIVITY_ID)].items[0].id);
  const [teamAnswers, setTeamAnswers] = useState({
    coefficient: '',
    degreeX: '',
    degreeY: '',
    totalDegree: ''
  });
  const [isSocketConnected, setIsSocketConnected] = useState(false);
  const [participants, setParticipants] = useState([]);
  const [scoreRecords, setScoreRecords] = useState([]);
  const [roster, setRoster] = useState([]);
  const [studentName, setStudentName] = useState(() => readIdentityName(`Student-${Math.floor(Math.random() * 900 + 100)}`));
  const [studentColor, setStudentColor] = useState(() => readIdentityColor(randomIdentityColor()));
  const [lastSentAnswers, setLastSentAnswers] = useState('');
  const [lessonGeogebraRoomId, setLessonGeogebraRoomId] = useState('');
  const [feedbackEnabled, setFeedbackEnabled] = useState(false);
  const [algebraTilesByExpression, setAlgebraTilesByExpression] = useState({});
  const [savedActivities, setSavedActivities] = useState([]);

  useEffect(() => {
    if (!isTeacher) return undefined;
    let cancelled = false;
    const loadActivities = () => fetch('/teacher/activities', { cache: 'no-store' })
      .then((response) => response.ok ? response.json() : [])
      .then((activities) => {
        if (!cancelled) setSavedActivities(Array.isArray(activities) ? activities : []);
      })
      .catch(() => {});

    loadActivities();
    const timer = window.setInterval(loadActivities, 10000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [isTeacher]);

  useEffect(() => {
    function syncIdentity() {
      const next = readIdentitySnapshot({
        nameFallback: `Student-${Math.floor(Math.random() * 900 + 100)}`,
        colorFallback: randomIdentityColor()
      });
      setStudentName(next.name);
      setStudentColor(next.color);
    }

    syncIdentity();
    window.addEventListener('strobe:identity-change', syncIdentity);
    window.addEventListener('storage', syncIdentity);

    return () => {
      window.removeEventListener('strobe:identity-change', syncIdentity);
      window.removeEventListener('storage', syncIdentity);
    };
  }, []);

  const activityTitle = t(`activity_${selectedActivityId.replace('.', '_')}`);

  const activeDatasetKey = getActivityDatasetKey(selectedActivityId) || 'monomials';
  const activeDataset = ALGEBRA_DATASETS[activeDatasetKey] || ALGEBRA_DATASETS.monomials;
  const activeItems = activeDataset.items;
  const [expressionDrafts, setExpressionDrafts] = useState(() => {
    const initialDrafts = {};
    Object.values(ALGEBRA_DATASETS).forEach((dataset) => {
      dataset.items.forEach((item) => {
        if (item.parts) {
          initialDrafts[item.id] = item.parts.map((part) => ({ ...part }));
        }
      });
    });
    return initialDrafts;
  });
  const [groupingPlacementsByExpression, setGroupingPlacementsByExpression] = useState(() => {
    const initialPlacements = {};
    Object.values(ALGEBRA_DATASETS).forEach((dataset) => {
      dataset.items.forEach((item) => {
        if (item.resultMode === 'grouping' && Array.isArray(item.items)) {
          initialPlacements[item.id] = item.items.reduce((placements, groupingItem) => {
            placements[groupingItem.id] = null;
            return placements;
          }, {});
        }
      });
    });
    return initialPlacements;
  });

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
  const activeExpressionParts = expressionDrafts[selectedExpressionId] || activeExpression?.parts || [];
  const activeGroupingPlacements = groupingPlacementsByExpression[selectedExpressionId] || {};

  const getExpressionPreview = (expressionItem, partsOverride = expressionItem?.parts) => {
    if (!expressionItem) {
      return '';
    }

    const slots = partsOverride && partsOverride.length > 0
      ? partsOverride
      : [{ coefficient: '', degreeX: '', degreeY: '' }];
    const rendered = slots.map((slot) => {
      const coefficient = slot.coefficient || '';
      const degreeX = slot.degreeX || '';
      const degreeY = slot.degreeY || '';
      return `${coefficient}x^{${degreeX}}y^{${degreeY}}`;
    });

    return rendered.join(expressionItem.connector || ' + ');
  };

  const getMonomialAnswerPreview = (parts) => {
    const coefficient = parts?.[0]?.coefficient || '';
    const degreeX = parts?.[0]?.degreeX || '';
    const degreeY = parts?.[0]?.degreeY || '';
    return `${coefficient}x^{${degreeX}}y^{${degreeY}}`;
  };

  const isMonomialGroupingActivity = selectedActivityId === '1.2';
  const isPolynomialGroupingActivity = selectedActivityId === '2.3';
  const isGeogebraAreaActivity = selectedActivityId === '2.6';
  const isAlgebraTilesActivity = selectedActivityId === '2.7';
  const isGroupingActivity = isMonomialGroupingActivity || isPolynomialGroupingActivity;
  const isDegreeOnlyActivity = selectedActivityId === '2.1';
  const isMonomialResultActivity = ['1.3', '1.4', '2.2'].includes(selectedActivityId);
  const isPolynomialResultActivity = ['2.4', '2.5'].includes(selectedActivityId);
  const isTemplateActivity = isMonomialResultActivity || isPolynomialResultActivity || isDegreeOnlyActivity;
  const expressionGeogebraRoomId = String(activeExpression?.geogebraRoomId || '').trim();
  const geogebraRoomId = isGeogebraAreaActivity
    ? String(lessonGeogebraRoomId || expressionGeogebraRoomId || 'polynomial-lab-2-6-area-2x').trim()
    : '';
  const leftExpressionText = activeExpression.expression;
  const resultInputValues = activeExpressionParts[0] || { coefficient: '', degreeX: '', degreeY: '' };
  const degreeOnlyInputValues = activeExpressionParts[0] || { degreeX: '', degreeY: '', totalDegree: '' };
  const degreeOnlyPreviewText = `\\deg_x = ${degreeOnlyInputValues.degreeX || ''}, \\deg_y = ${degreeOnlyInputValues.degreeY || ''}, \\deg_{xy} = ${degreeOnlyInputValues.totalDegree || ''}`;
  const groupedPolynomialExpression = useMemo(() => {
    if (selectedActivityId !== '2.4') {
      return null;
    }

    const match = leftExpressionText.match(/\((.*)\)\s*([+-])\s*\((.*)\)/);
    if (!match) {
      return null;
    }

    return {
      left: match[1],
      operator: match[2],
      right: match[3]
    };
  }, [selectedActivityId, leftExpressionText]);
  const rightPreviewText = isDegreeOnlyActivity
    ? degreeOnlyPreviewText
    : isMonomialResultActivity
      ? getMonomialAnswerPreview(activeExpressionParts)
      : getExpressionPreview(activeExpression, activeExpressionParts);
  const isInputIncorrect = (index, field, value) => {
    if (!feedbackEnabled) {
      return false;
    }
    const correctAnswers = activeExpression?.correctAnswers;
    const expected = Array.isArray(correctAnswers)
      ? correctAnswers[index]?.[field]
      : correctAnswers?.[field];
    return !isCorrectAnswer(value, expected);
  };
  const getExpressionOptionLabel = (item) => {
    if (isMonomialGroupingActivity && Array.isArray(item?.groups) && item.groups.length > 0) {
      return item.groups.map((group) => group.hint).join(' | ');
    }

    if (isPolynomialGroupingActivity && item?.leftPolynomial && item?.rightPolynomial) {
      return `(${item.leftPolynomial}) + (${item.rightPolynomial})`;
    }

    return item?.expression || item?.id || '';
  };
  const renderWrappedExpression = (expression) => {
    const terms = String(expression || '').match(/[+-]?\s*[^+-]+/g) || [String(expression || '')];
    return (
      <div className="poly-wrapped-expression">
        {terms.map((term, index) => <MathFormula key={`${term}-${index}`} formula={`\\(${term.trim()}\\)`} />)}
      </div>
    );
  };
  const groupingItems = useMemo(
    () => (activeExpression?.items || []).map((item) => ({
      id: item.id,
      content: <MathFormula formula={`\\(${item.label}\\)`} />
    })),
    [activeExpression]
  );
  const groupingGroups = useMemo(
    () => (activeExpression?.groups || []).map((group) => ({
      id: group.id,
      title: isGroupingActivity ? '' : group.title,
      hint: <MathFormula formula={`\\(${group.hint}\\)`} />
    })),
    [activeExpression, isGroupingActivity]
  );
  const groupingValidationState = useMemo(
    () => getGroupingValidationState(activeExpression, activeGroupingPlacements),
    [activeExpression, activeGroupingPlacements]
  );
  const invalidGroupingItemIds = groupingValidationState.invalidItemIds;
  const groupingLockedItemIds = useMemo(() => {
    if (!isPolynomialGroupingActivity || invalidGroupingItemIds.length === 0) {
      return [];
    }

    const invalidSet = new Set(invalidGroupingItemIds);
    return (activeExpression?.items || [])
      .map((item) => item.id)
      .filter((itemId) => !invalidSet.has(itemId));
  }, [isPolynomialGroupingActivity, invalidGroupingItemIds, activeExpression]);
  const polynomialGroupingResult = useMemo(() => {
    if (!isPolynomialGroupingActivity) {
      return null;
    }

    const expressionItems = Array.isArray(activeExpression?.items) ? activeExpression.items : [];
    const groups = Array.isArray(activeExpression?.groups) ? activeExpression.groups : [];
    const resultOrder = Array.isArray(activeExpression?.resultOrder)
      ? activeExpression.resultOrder
      : groups.map((group) => group.id);

    const termStrings = resultOrder.map((groupId) => {
      const group = groups.find((entry) => entry.id === groupId);
      if (!group) {
        return null;
      }

      const requiredItems = expressionItems.filter((item) => item.correctGroupId === groupId);
      const hasWrongInGroup = expressionItems.some((item) => {
        const placement = activeGroupingPlacements[item.id] || null;
        return placement === groupId && item.correctGroupId !== groupId;
      });
      const allRequiredPlaced = requiredItems.every((item) => activeGroupingPlacements[item.id] === groupId);

      if (hasWrongInGroup || !allRequiredPlaced || requiredItems.length === 0) {
        return null;
      }

      const coefficientSum = requiredItems.reduce((sum, item) => sum + Number(item.coefficient || 0), 0);
      return {
        id: groupId,
        value: formatMonomialFromParts(coefficientSum, group.degreeX || 0, group.degreeY || 0),
        coefficientSum
      };
    }).filter(Boolean);

    const formula = termStrings.length > 0
      ? termStrings.reduce((accumulator, term, index) => {
        if (index === 0) {
          return term.coefficientSum < 0 ? `-${term.value}` : term.value;
        }
        return `${accumulator} ${term.coefficientSum < 0 ? '-' : '+'} ${term.value}`;
      }, '')
      : '';

    const isComplete = resultOrder.length > 0 && termStrings.length === resultOrder.length;
    return { formula, isComplete };
  }, [isPolynomialGroupingActivity, activeExpression, activeGroupingPlacements]);

  const updateExpressionPart = (index, field, value) => {
    setExpressionDrafts((prevDrafts) => {
      const nextParts = [...(prevDrafts[selectedExpressionId] || activeExpression?.parts || [])];
      nextParts[index] = { ...(nextParts[index] || {}), [field]: value };
      return {
        ...prevDrafts,
        [selectedExpressionId]: nextParts
      };
    });
  };

  const setGroupingPlacements = (nextPlacements) => {
    if (isPolynomialGroupingActivity && invalidGroupingItemIds.length > 0) {
      const changedItemIds = Object.keys(nextPlacements).filter(
        (itemId) => (activeGroupingPlacements?.[itemId] || null) !== (nextPlacements?.[itemId] || null)
      );

      const invalidSet = new Set(invalidGroupingItemIds);
      const touchesNonInvalidItem = changedItemIds.some((itemId) => !invalidSet.has(itemId));
      if (touchesNonInvalidItem) {
        return;
      }
    }

    setGroupingPlacementsByExpression((prev) => ({
      ...prev,
      [selectedExpressionId]: nextPlacements
    }));
  };

  const sortedParticipants = useMemo(
    () => [...participants]
      .filter((student) => student && student.isConnected !== false)
      .sort((a, b) => String(a.name || a.username || '').localeCompare(String(b.name || b.username || ''))),
    [participants]
  );

  useEffect(() => {
    if (!isTeacher || !sessionLogging?.scoreVisible) {
      setScoreRecords([]);
      return undefined;
    }

    let cancelled = false;
    const refreshScores = async () => {
      try {
        const response = await fetch('/api/scores');
        if (!response.ok) return;
        const payload = await response.json();
        if (!cancelled) setScoreRecords(Array.isArray(payload.students) ? payload.students : []);
      } catch {
        // Keep the last available score values if a refresh fails.
      }
    };

    refreshScores();
    const timer = window.setInterval(refreshScores, 5000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [isTeacher, sessionLogging?.scoreVisible]);

  const expectedAnswers = {
    coefficient: activeExpression?.coefficient ?? '-',
    degreeX: activeExpression?.degreeX ?? '-',
    degreeY: activeExpression?.degreeY ?? '-',
    totalDegree: activeExpression?.totalDegree ?? '-'
  };

  const setActivity = (nextId) => {
    if (nextId.startsWith('saved:')) {
      const activityPath = nextId.slice('saved:'.length);
      const separator = activityPath.indexOf('/');
      const resource = activityPath.slice(0, separator);
      const filename = activityPath.slice(separator + 1);
      fetch(`/teacher/activities/${encodeURIComponent(resource)}/${encodeURIComponent(filename)}`, { cache: 'no-store' })
        .then((response) => {
          if (!response.ok) throw new Error('Activity could not be loaded.');
          return response.json();
        })
        .then((activity) => fetch('/teacher/classroom/selection', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ app: 'activity-runner', activity })
        }))
        .then((response) => {
          if (!response.ok) throw new Error('Activity could not be opened for the classroom.');
          navigate('/workshops/activities/teacher');
        })
        .catch((error) => window.alert(error.message));
      return;
    }

    const nextDatasetKey = getActivityDatasetKey(nextId);
    const nextDataset = ALGEBRA_DATASETS[nextDatasetKey] || ALGEBRA_DATASETS.monomials;
    const nextExpression = nextDataset.items[0]?.id || '';
    setSelectedActivityId(nextId);
    setSelectedExpressionId(nextExpression);
    setTeamAnswers({ coefficient: '', degreeX: '', degreeY: '', totalDegree: '' });
    sendSocketMessage({
      type: 'teacher_lesson',
      lesson: {
        activityId: nextId,
        datasetKey: nextDatasetKey || 'monomials',
        expressionId: nextExpression,
        geogebraRoomId: String(nextDataset.items[0]?.geogebraRoomId || '').trim(),
        feedbackEnabled
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
        datasetKey: getActivityDatasetKey(selectedActivityId) || 'monomials',
        expressionId: nextExpressionId,
        feedbackEnabled,
        geogebraRoomId: String(
          (activeItems.find((item) => item.id === nextExpressionId)?.geogebraRoomId)
          || ''
        ).trim()
      }
    });
  };

  const setFeedbackOption = (enabled) => {
    setFeedbackEnabled(enabled);
    sendSocketMessage({
      type: 'teacher_lesson',
      lesson: {
        activityId: selectedActivityId,
        datasetKey: getActivityDatasetKey(selectedActivityId) || 'monomials',
        expressionId: selectedExpressionId,
        geogebraRoomId: lessonGeogebraRoomId,
        feedbackEnabled: enabled
      }
    });
  };

  const setTeamField = (field, value) => {
    setTeamAnswers((prev) => ({ ...prev, [field]: value }));
  };

  const updateAlgebraTiles = (tiles) => {
    setAlgebraTilesByExpression((current) => ({ ...current, [selectedExpressionId]: tiles }));
    sendSocketMessage({ type: 'algebra_tiles_update', expressionId: selectedExpressionId, tiles });
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
        sendSocketMessage({ type: 'register_teacher', name: studentName || 'Teacher' });
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
          const nextGeogebraRoomId = String(message.lesson.geogebraRoomId || '').trim();

          if (nextActivity && ACTIVITY_LIBRARY.some((activity) => activity.id === nextActivity)) {
            setSelectedActivityId(nextActivity);
          }

          if (nextDatasetKey && ALGEBRA_DATASETS[nextDatasetKey] && nextExpressionId) {
            setSelectedExpressionId((prev) => {
              if (prev === nextExpressionId) {
                return prev;
              }
              return nextExpressionId;
            });
          }

          if (nextExpressionId && !(nextDatasetKey && ALGEBRA_DATASETS[nextDatasetKey])) {
            setSelectedExpressionId(nextExpressionId);
          }

          setLessonGeogebraRoomId(nextGeogebraRoomId);
          setFeedbackEnabled(Boolean(message.lesson.feedbackEnabled));
        }

        if (Array.isArray(message.participants)) {
          setParticipants(message.participants);
        }

        if (Array.isArray(message.roster)) {
          setRoster(message.roster);
        }

        if (message.algebraTiles && typeof message.algebraTiles === 'object') {
          setAlgebraTilesByExpression(message.algebraTiles);
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
    if (!isSocketConnected) {
      return;
    }

    if (isStudent) {
      sendSocketMessage({ type: 'register_student', name: studentName, color: studentColor });
      return;
    }

    sendSocketMessage({ type: 'register_teacher', name: studentName || 'Teacher' });
  }, [isSocketConnected, isStudent, studentColor, studentName]);

  useEffect(() => {
    if (!isStudent || !isSocketConnected) {
      return;
    }

    if (selectedActivityId === '2.6') {
      return;
    }

    const payload = {
      type: 'student_answers',
      expressionId: selectedExpressionId,
      answers: getCurrentStudentAnswerPayload(
        selectedExpressionId,
        activeExpression,
        expressionDrafts,
        groupingPlacementsByExpression,
        teamAnswers,
        isGroupingActivity,
        isDegreeOnlyActivity,
        isMonomialResultActivity,
        isPolynomialResultActivity
      )
    };

    const serialized = JSON.stringify(payload);
    if (serialized === lastSentAnswers) {
      return;
    }

    setLastSentAnswers(serialized);
    sendSocketMessage(payload);
  }, [
    isStudent,
    isSocketConnected,
    selectedExpressionId,
    teamAnswers,
    lastSentAnswers,
    expressionDrafts,
    groupingPlacementsByExpression,
    activeExpression,
    isGroupingActivity,
    isDegreeOnlyActivity,
    isMonomialResultActivity,
    isPolynomialResultActivity
  ]);

  useEffect(() => {
    const datasetKey = getActivityDatasetKey(selectedActivityId);
    if (selectedActivityId && datasetKey) {
      const dataset = ALGEBRA_DATASETS[datasetKey];
      if (dataset && dataset.items.length > 0) {
        setSelectedExpressionId((prev) => {
          if (dataset.items.some((item) => item.id === prev)) {
            return prev;
          }
          return dataset.items[0].id;
        });
      }
    }
  }, [selectedActivityId]);

  const currentStudentAnswers = getCurrentStudentAnswerPayload(
    selectedExpressionId,
    activeExpression,
    expressionDrafts,
    groupingPlacementsByExpression,
    teamAnswers,
    isGroupingActivity,
    isDegreeOnlyActivity,
    isMonomialResultActivity,
    isPolynomialResultActivity
  );
  const hasCurrentStudentAnswer = Object.values(currentStudentAnswers || {}).some((value) => String(value ?? '').trim() !== '');
  const currentStudentScore = hasCurrentStudentAnswer
    ? computeStudentScore({ answers: currentStudentAnswers }, activeExpression, {
      scoreCorrect: activeExpression?.scoreCorrect ?? SCORE_CORRECT,
      scoreIncorrect: activeExpression?.scoreIncorrect ?? SCORE_INCORRECT
    })
    : 0;

  return (
    <>
      <HeroTitle>{`${tNav('items.polynomial')} - ${activityTitle}`}</HeroTitle>

      <section className="common-zone lab-zone">
        <FullScreenButton />
        <SharedCommonZoneLayout
          className={isGeogebraAreaActivity ? 'poly-neural-zone--geogebra' : ''}
          isGroupingMode={isGroupingActivity}
        >
          {!isGeogebraAreaActivity ? (
            <div className="lab-card lab-card--highlight poly-expression-card" aria-label={t('expressionType')}>
              <p className="lab-mini-label poly-mini-label">{t('expression')}</p>
              {isGroupingActivity ? (
                null
              ) : groupedPolynomialExpression ? (
                <div className="poly-stacked-expression">
                  <div className="poly-stacked-expression-row">
                    {renderWrappedExpression(groupedPolynomialExpression.left)}
                  </div>
                  <div className="poly-stacked-expression-operator" aria-label={t('operatorBetweenTerms')}>
                    {groupedPolynomialExpression.operator}
                  </div>
                  <div className="poly-stacked-expression-row">
                    {renderWrappedExpression(groupedPolynomialExpression.right)}
                  </div>
                </div>
              ) : (
                <div className="lab-math-box poly-expression-math">
                  {renderWrappedExpression(leftExpressionText)}
                </div>
              )}
            </div>
          ) : null}

          <div className={`lab-card lab-card--panel poly-team-card ${isGeogebraAreaActivity ? 'poly-team-card--geogebra' : ''}`.trim()}>
            {isGroupingActivity ? (
              <div className="poly-grouping-panel">
                {isPolynomialGroupingActivity && (
                  <div className="poly-grouping-equation">
                    <div className="poly-grouping-expression-card">
                      <MathFormula formula={`\\(${activeExpression.leftPolynomial}\\)`} />
                    </div>
                    <div className="poly-grouping-operator">+</div>
                    <div className="poly-grouping-expression-card">
                      <MathFormula formula={`\\(${activeExpression.rightPolynomial}\\)`} />
                    </div>
                  </div>
                )}
                <GroupingDragDrop
                  activity={`polynomial:${selectedActivityId}:${selectedExpressionId}`}
                  items={groupingItems}
                  groups={groupingGroups}
                  placements={activeGroupingPlacements}
                  onChange={setGroupingPlacements}
                  invalidItemIds={feedbackEnabled ? invalidGroupingItemIds : []}
                  disabledItemIds={groupingLockedItemIds}
                  bankLabel={t(isPolynomialGroupingActivity ? 'polynomialTermsToGroup' : 'monomialsToGroup')}
                />
                {isPolynomialGroupingActivity && (
                  <>
                    {invalidGroupingItemIds.length > 0 && (
                      <p className="poly-grouping-warning">{t('wrongPlacement')}</p>
                    )}
                    <div className="lab-preview poly-preview-panel">
                      <p className="lab-mini-label poly-mini-label">{t('automaticResult')}</p>
                      <div className="lab-math-box lab-math-box--compact poly-expression-math poly-expression-math--small">
                        {renderWrappedExpression(polynomialGroupingResult?.formula || '')}
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : isAlgebraTilesActivity ? (
              <AlgebraTiles
                activity={`polynomial:${selectedActivityId}:${selectedExpressionId}`}
                key={selectedExpressionId}
                tiles={algebraTilesByExpression[selectedExpressionId]}
                onTilesChange={updateAlgebraTiles}
              />
            ) : isGeogebraAreaActivity ? (
              <div className="poly-geogebra-area-panel">
                <CollaborativeGeoGebra
                  roomId={geogebraRoomId}
                  sessionApp="polynomial-lab"
                  className="poly-geogebra-board"
                  showStatus={false}
                  editable={Boolean(sessionLogging?.activeSessionId)}
                  showPermissionControls={isTeacher}
                  showToolBar={false}
                  showAlgebraView={false}
                  showAlgebraInput={false}
                  showMenuBar={false}
                  showResetIcon={false}
                  showZoomButtons={false}
                  showFullscreenButton={false}
                  showSuggestionButtons={false}
                />
              </div>
            ) : isTemplateActivity ? (
              <div className="poly-template-answer-panel">
                <InputGrid
                  activity={`polynomial:${selectedActivityId}:${selectedExpressionId}`}
                  columns={2}
                  className="lab-input-grid poly-team-grid"
                  labelClassName="shared-input-box__label"
                  fields={isDegreeOnlyActivity ? [
                    { id: 'degree-x', className: 'shared-input-box lab-field poly-team-field', inputClassName: `shared-input-box__input${isInputIncorrect(0, 'degreeX', degreeOnlyInputValues.degreeX) ? ' poly-input--invalid' : ''}`, label: t('degreeX'), value: degreeOnlyInputValues.degreeX, onChange: (value) => updateExpressionPart(0, 'degreeX', value) },
                    { id: 'degree-y', className: 'shared-input-box lab-field poly-team-field', inputClassName: `shared-input-box__input${isInputIncorrect(0, 'degreeY', degreeOnlyInputValues.degreeY) ? ' poly-input--invalid' : ''}`, label: t('degreeY'), value: degreeOnlyInputValues.degreeY, onChange: (value) => updateExpressionPart(0, 'degreeY', value) },
                    { id: 'total-degree', className: 'shared-input-box lab-field poly-team-field', inputClassName: `shared-input-box__input${isInputIncorrect(0, 'totalDegree', degreeOnlyInputValues.totalDegree) ? ' poly-input--invalid' : ''}`, label: t('totalDegree'), value: degreeOnlyInputValues.totalDegree, onChange: (value) => updateExpressionPart(0, 'totalDegree', value) }
                  ] : isPolynomialResultActivity ? activeExpressionParts.flatMap((part, index) => ([
                    { id: `part-${index}-coefficient`, className: 'shared-input-box lab-field poly-team-field', inputClassName: `shared-input-box__input${isInputIncorrect(index, 'coefficient', part.coefficient) ? ' poly-input--invalid' : ''}`, label: t('termCoefficient', { term: index + 1 }), value: part.coefficient || '', onChange: (value) => updateExpressionPart(index, 'coefficient', value) },
                    { id: `part-${index}-degree-x`, className: 'shared-input-box lab-field poly-team-field', inputClassName: `shared-input-box__input${isInputIncorrect(index, 'degreeX', part.degreeX) ? ' poly-input--invalid' : ''}`, label: t('termDegreeX', { term: index + 1 }), value: part.degreeX || '', onChange: (value) => updateExpressionPart(index, 'degreeX', value) },
                    { id: `part-${index}-degree-y`, className: 'shared-input-box lab-field poly-team-field', inputClassName: `shared-input-box__input${isInputIncorrect(index, 'degreeY', part.degreeY) ? ' poly-input--invalid' : ''}`, label: t('termDegreeY', { term: index + 1 }), value: part.degreeY || '', onChange: (value) => updateExpressionPart(index, 'degreeY', value) }
                  ])) : [
                    { id: 'coefficient', className: 'shared-input-box lab-field poly-team-field', inputClassName: `shared-input-box__input${isInputIncorrect(0, 'coefficient', resultInputValues.coefficient) ? ' poly-input--invalid' : ''}`, label: t('coefficient'), value: resultInputValues.coefficient, onChange: (value) => updateExpressionPart(0, 'coefficient', value) },
                    { id: 'degree-x', className: 'shared-input-box lab-field poly-team-field', inputClassName: `shared-input-box__input${isInputIncorrect(0, 'degreeX', resultInputValues.degreeX) ? ' poly-input--invalid' : ''}`, label: t('degreeX'), value: resultInputValues.degreeX, onChange: (value) => updateExpressionPart(0, 'degreeX', value) },
                    { id: 'degree-y', className: 'shared-input-box lab-field poly-team-field', inputClassName: `shared-input-box__input${isInputIncorrect(0, 'degreeY', resultInputValues.degreeY) ? ' poly-input--invalid' : ''}`, label: t('degreeY'), value: resultInputValues.degreeY, onChange: (value) => updateExpressionPart(0, 'degreeY', value) }
                  ]}
                />

                {!isDegreeOnlyActivity && (
                  <div className="lab-preview poly-preview-panel">
                    <p className="lab-mini-label poly-mini-label">{t('answer')}</p>
                    <div className="lab-math-box lab-math-box--compact poly-expression-math poly-expression-math--small">
                      {renderWrappedExpression(rightPreviewText)}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <InputGrid
                activity={`polynomial:${selectedActivityId}:${selectedExpressionId}`}
                columns={2}
                className="lab-input-grid poly-team-grid"
                labelClassName="shared-input-box__label"
                fields={[
                  { id: 'coefficient', className: 'shared-input-box lab-field poly-team-field', inputClassName: `shared-input-box__input${isInputIncorrect(0, 'coefficient', teamAnswers.coefficient) ? ' poly-input--invalid' : ''}`, label: t('coefficient'), value: teamAnswers.coefficient, onChange: (value) => setTeamField('coefficient', value) },
                  { id: 'degree-x', className: 'shared-input-box lab-field poly-team-field', inputClassName: `shared-input-box__input${isInputIncorrect(0, 'degreeX', teamAnswers.degreeX) ? ' poly-input--invalid' : ''}`, label: t('degreeX'), value: teamAnswers.degreeX, onChange: (value) => setTeamField('degreeX', value) },
                  { id: 'degree-y', className: 'shared-input-box lab-field poly-team-field', inputClassName: `shared-input-box__input${isInputIncorrect(0, 'degreeY', teamAnswers.degreeY) ? ' poly-input--invalid' : ''}`, label: t('degreeY'), value: teamAnswers.degreeY, onChange: (value) => setTeamField('degreeY', value) },
                  { id: 'total-degree', className: 'shared-input-box lab-field poly-team-field', inputClassName: `shared-input-box__input${isInputIncorrect(0, 'totalDegree', teamAnswers.totalDegree) ? ' poly-input--invalid' : ''}`, label: t('totalDegree'), value: teamAnswers.totalDegree, onChange: (value) => setTeamField('totalDegree', value) }
                ]}
              />
            )}
          </div>
        </SharedCommonZoneLayout>
      </section>

      {isTeacher && (
        <>
          <ActivitiesMenu
            title={t('activities')}
            icon="🎯"
            label={t('chooseActivity')}
            options={ACTIVITY_LIBRARY.map((activity) => ({
              value: activity.id,
              label: t(`activity_${activity.id.replace('.', '_')}`)
            })).concat(savedActivities.map((activity) => ({
              value: `saved:${activity.resource}/${activity.filename}`,
              label: `${activity.name} (${t(`activityBuilder.resourceNames.${activity.resource}`, { ns: 'interface', defaultValue: activity.resource })})`
            })))}
            value={selectedActivityId}
            onChange={setActivity}
          />

          <SettingsAccordion>
            <CommonSessionSettings
              feedbackEnabled={feedbackEnabled}
              onFeedbackChange={setFeedbackOption}
              feedbackDescription={t('feedbackToggle')}
            />
          </SettingsAccordion>

          <Accordion title={t('expression')} icon="🔢">
            <div className="lab-data-section data-section poly-data-menu">
              <div className="lab-select-group poly-select-group">
                <label className="shared-activity-label" htmlFor="poly-expression">{t('expression')}</label>
                <select
                  id="poly-expression"
                  className="shared-activity-select"
                  value={selectedExpressionId}
                  onChange={(event) => setExpression(event.target.value)}
                >
                  {activeItems.map((item) => (
                    <option key={item.id} value={item.id}>{getExpressionOptionLabel(item)}</option>
                  ))}
                </select>
              </div>
            </div>
          </Accordion>

          <StudentTable
            title={t('studentTable')}
            participants={sortedParticipants}
            columns={[
              ...getAnswerColumnsForExpression(activeExpression, t),
              ...(sessionLogging?.scoreVisible ? [
                {
                  key: 'activityScore',
                  label: t('score', { ns: 'scores' }),
                  render: (student) => {
                    const participantName = String(student.username || student.name || student.displayName || '').trim().toLocaleLowerCase();
                    const record = scoreRecords.find((entry) => String(entry.name || '').trim().toLocaleLowerCase() === participantName);
                    const value = record?.activities?.[`polynomial:${selectedActivityId}:${selectedExpressionId}`];
                    return Number.isFinite(Number(value)) ? Number(Number(value).toFixed(2)) : '-';
                  }
                }
              ] : [])
            ]}
            headerGroups={getAnswerHeaderGroupsForExpression(activeExpression, t)}
            emptyMessage={t('noStudents')}
          />

        </>
      )}

      <StudentScoresAccordion
        role={role}
        studentName={studentName}
        activity={`polynomial:${selectedActivityId}:${selectedExpressionId}`}
        currentScore={currentStudentScore}
        hidePanel
      />
      <ChatAccordion />
    </>
  );
}
