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
import { SCORE_CORRECT, SCORE_INCORRECT, computeStudentScore, getAnswerFieldDefinitions } from './grading';
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
    id: '1.2',
    code: '1.2',
    title: '1.2 Πράξεις με μονώνυμα (πρόσθεση-αφαίρεση)',
    objective: 'Πρόσθεση και αφαίρεση όμοιων μονωνύμων.',
    tasks: ['Κοινός όρος', 'Συνδυασμός όρων', 'Αφαίρεση μονωνύμων']
  },
  {
    id: '1.3',
    code: '1.3',
    title: '1.3 Πράξεις με μονώνυμα (πολλαπλασιασμός)',
    objective: 'Πολλαπλασιασμός μονωνύμων με συντελεστές και εκθέτες.',
    tasks: ['Πολλαπλασιασμός δύο μονωνύμων', 'Πολλαπλασιασμός τριών μονωνύμων']
  },
  {
    id: '2.1',
    code: '2.1',
    title: '2.1 Βασικές έννοιες πολυωνύμων',
    objective: 'Εντοπισμός βαθμού ως προς x, βαθμού ως προς y και συνολικού βαθμού ενός πολυωνύμου.',
    tasks: ['Βαθμός ως προς x', 'Βαθμός ως προς y', 'Συνολικός βαθμός']
  },
  {
    id: '2.2',
    code: '2.2',
    title: '2.2 Αναγωγή ομοίων όρων',
    objective: 'Συνδυασμός όμοιων μονωνύμων σε ένα απλοποιημένο αποτέλεσμα.',
    tasks: ['Όμοιοι όροι', 'Απλοποίηση', 'Αναγωγή']
  },
  {
    id: '2.3',
    code: '2.3',
    title: '2.3 Πράξεις με πολυώνυμα (πρόσθεση-αφαίρεση)',
    objective: 'Πρόσθεση και αφαίρεση πολυωνύμων με αναγωγή όμοιων όρων.',
    tasks: ['Άθροισμα', 'Διαφορά', 'Μικτό αποτέλεσμα']
  },
  {
    id: '2.4',
    code: '2.4',
    title: '2.4 Πράξεις με πολυώνυμα (πολλαπλασιασμός)',
    objective: 'Πολλαπλασιασμός πολυωνύμων και αναγνώριση όρων του αποτελέσματος.',
    tasks: ['Πολλαπλασιασμός δύο όρων', 'Πολλαπλασιασμός τριών όρων']
  }
];

const ACTIVITY_DATASET_KEYS = {
  '1.1': 'monomials',
  '1.2': 'monomialOperations',
  '1.3': 'monomialMultiplications',
  '2.1': 'polynomialBasics',
  '2.2': 'likeTermReduction',
  '2.3': 'polynomialOperations',
  '2.4': 'polynomialMultiplications'
};

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
        totalDegree: 6,
        correctAnswers: { coefficient: 3, degreeX: 4, degreeY: 2, totalDegree: 6 },
        scoreCorrect: SCORE_CORRECT,
        scoreIncorrect: SCORE_INCORRECT
      },
      {
        id: 'm-2',
        expression: '-5x^2y^3',
        coefficient: -5,
        degreeX: 2,
        degreeY: 3,
        totalDegree: 5,
        correctAnswers: { coefficient: -5, degreeX: 2, degreeY: 3, totalDegree: 5 },
        scoreCorrect: SCORE_CORRECT,
        scoreIncorrect: SCORE_INCORRECT
      },
      {
        id: 'm-3',
        expression: '7x^3y',
        coefficient: 7,
        degreeX: 3,
        degreeY: 1,
        totalDegree: 4,
        correctAnswers: { coefficient: 7, degreeX: 3, degreeY: 1, totalDegree: 4 },
        scoreCorrect: SCORE_CORRECT,
        scoreIncorrect: SCORE_INCORRECT
      }
    ]
  },
  monomialOperations: {
    label: 'Πράξεις με μονώνυμα',
    items: [
      {
        id: 'sum-1',
        expression: '2x^2y + 3x^2y',
        answerTemplate: '□x^□y^□',
        resultMode: 'monomial',
        parts: [
          { coefficient: '', degreeX: '', degreeY: '' }
        ],
        connector: ' + ',
        correctAnswers: { coefficient: 5, degreeX: 2, degreeY: 1 },
        scoreCorrect: SCORE_CORRECT,
        scoreIncorrect: SCORE_INCORRECT
      },
      {
        id: 'sum-2',
        expression: '4xy^3 - 2xy^3',
        answerTemplate: '□x^□y^□',
        resultMode: 'monomial',
        parts: [
          { coefficient: '', degreeX: '', degreeY: '' }
        ],
        connector: ' - ',
        correctAnswers: { coefficient: 2, degreeX: 1, degreeY: 3 },
        scoreCorrect: SCORE_CORRECT,
        scoreIncorrect: SCORE_INCORRECT
      },
      {
        id: 'sum-3',
        expression: '7x^3y^2 + 3x^3y^2 - x^3y^2',
        answerTemplate: '□x^□y^□',
        resultMode: 'monomial',
        parts: [
          { coefficient: '', degreeX: '', degreeY: '' }
        ],
        connector: ' + ',
        correctAnswers: { coefficient: 9, degreeX: 3, degreeY: 2 },
        scoreCorrect: SCORE_CORRECT,
        scoreIncorrect: SCORE_INCORRECT
      }
    ]
  },
  monomialMultiplications: {
    label: 'Πολλαπλασιασμός μονωνύμων',
    items: [
      {
        id: 'mul-1',
        expression: '3x^2y · 5x^3y^2',
        answerTemplate: '□x^□y^□',
        resultMode: 'monomial',
        parts: [
          { coefficient: '', degreeX: '', degreeY: '' }
        ],
        connector: ' · ',
        correctAnswers: { coefficient: 15, degreeX: 5, degreeY: 3 },
        scoreCorrect: SCORE_CORRECT,
        scoreIncorrect: SCORE_INCORRECT
      },
      {
        id: 'mul-2',
        expression: '-2x^3y · 4xy',
        answerTemplate: '□x^□y^□',
        resultMode: 'monomial',
        parts: [
          { coefficient: '', degreeX: '', degreeY: '' }
        ],
        connector: ' · ',
        correctAnswers: { coefficient: -8, degreeX: 4, degreeY: 2 },
        scoreCorrect: SCORE_CORRECT,
        scoreIncorrect: SCORE_INCORRECT
      },
      {
        id: 'mul-3',
        expression: '6x^2y^3 · 3x^4y',
        answerTemplate: '□x^□y^□',
        resultMode: 'monomial',
        parts: [
          { coefficient: '', degreeX: '', degreeY: '' }
        ],
        connector: ' · ',
        correctAnswers: { coefficient: 18, degreeX: 6, degreeY: 4 },
        scoreCorrect: SCORE_CORRECT,
        scoreIncorrect: SCORE_INCORRECT
      }
    ]
  },
  polynomialBasics: {
    label: 'Βασικές έννοιες πολυωνύμων',
    items: [
      {
        id: 'poly-basic-1',
        expression: '3x^2y + 5xy^3 - 7x^4 + 2y^2',
        degreeX: 4,
        degreeY: 3,
        totalDegree: 7,
        resultMode: 'degreeOnly',
        parts: [
          { degreeX: '', degreeY: '', totalDegree: '' }
        ],
        correctAnswers: { degreeX: 4, degreeY: 3, totalDegree: 7 },
        scoreCorrect: SCORE_CORRECT,
        scoreIncorrect: SCORE_INCORRECT
      },
      {
        id: 'poly-basic-2',
        expression: '2x^3y^2 - 4x^2y + 3x^5',
        degreeX: 5,
        degreeY: 2,
        totalDegree: 7,
        resultMode: 'degreeOnly',
        parts: [
          { degreeX: '', degreeY: '', totalDegree: '' }
        ],
        correctAnswers: { degreeX: 5, degreeY: 2, totalDegree: 7 },
        scoreCorrect: SCORE_CORRECT,
        scoreIncorrect: SCORE_INCORRECT
      },
      {
        id: 'poly-basic-3',
        expression: 'x^4y - 5xy^2 + 3x^2y^3',
        degreeX: 4,
        degreeY: 3,
        totalDegree: 7,
        resultMode: 'degreeOnly',
        parts: [
          { degreeX: '', degreeY: '', totalDegree: '' }
        ],
        correctAnswers: { degreeX: 4, degreeY: 3, totalDegree: 7 },
        scoreCorrect: SCORE_CORRECT,
        scoreIncorrect: SCORE_INCORRECT
      }
    ]
  },
  likeTermReduction: {
    label: 'Αναγωγή ομοίων όρων',
    items: [
      {
        id: 'reduce-1',
        expression: '3x^2y + 5x^2y - 2x^2y',
        answerTemplate: '□x^□y^□',
        resultMode: 'monomial',
        parts: [
          { coefficient: '', degreeX: '', degreeY: '' }
        ],
        connector: ' + ',
        correctAnswers: { coefficient: 6, degreeX: 2, degreeY: 1 },
        scoreCorrect: SCORE_CORRECT,
        scoreIncorrect: SCORE_INCORRECT
      },
      {
        id: 'reduce-2',
        expression: '4xy^3 + 2xy^3 - 3xy^3',
        answerTemplate: '□x^□y^□',
        resultMode: 'monomial',
        parts: [
          { coefficient: '', degreeX: '', degreeY: '' }
        ],
        connector: ' + ',
        correctAnswers: { coefficient: 3, degreeX: 1, degreeY: 3 },
        scoreCorrect: SCORE_CORRECT,
        scoreIncorrect: SCORE_INCORRECT
      },
      {
        id: 'reduce-3',
        expression: '7x^3y^2 - 2x^3y^2 + 4x^3y^2',
        answerTemplate: '□x^□y^□',
        resultMode: 'monomial',
        parts: [
          { coefficient: '', degreeX: '', degreeY: '' }
        ],
        connector: ' + ',
        correctAnswers: { coefficient: 9, degreeX: 3, degreeY: 2 },
        scoreCorrect: SCORE_CORRECT,
        scoreIncorrect: SCORE_INCORRECT
      }
    ]
  },
  polynomialOperations: {
    label: 'Πράξεις με πολυώνυμα',
    items: [
      {
        id: 'poly-op-1',
        expression: '(3x^2y + 5xy^2) + (2x^2y - 3xy^2)',
        answerTemplate: '□x^□y^□ + □x^□y^□',
        resultMode: 'polynomial',
        parts: [
          { coefficient: '', degreeX: '', degreeY: '' },
          { coefficient: '', degreeX: '', degreeY: '' }
        ],
        connector: ' + ',
        correctAnswers: [
          { coefficient: 5, degreeX: 2, degreeY: 1 },
          { coefficient: 2, degreeX: 1, degreeY: 2 }
        ],
        scoreCorrect: SCORE_CORRECT,
        scoreIncorrect: SCORE_INCORRECT
      },
      {
        id: 'poly-op-2',
        expression: '(7x^3 - 2x^2y) + (4x^3 + 5x^2y)',
        answerTemplate: '□x^□y^□ + □x^□y^□',
        resultMode: 'polynomial',
        parts: [
          { coefficient: '', degreeX: '', degreeY: '' },
          { coefficient: '', degreeX: '', degreeY: '' }
        ],
        connector: ' + ',
        correctAnswers: [
          { coefficient: 11, degreeX: 3, degreeY: 0 },
          { coefficient: 3, degreeX: 2, degreeY: 1 }
        ],
        scoreCorrect: SCORE_CORRECT,
        scoreIncorrect: SCORE_INCORRECT
      },
      {
        id: 'poly-op-3',
        expression: '(6x^2y^2 - 3xy + 2x) - (2x^2y^2 - xy + x)',
        answerTemplate: '□x^□y^□ + □x^□y^□ + □x^□y^□',
        resultMode: 'polynomial',
        parts: [
          { coefficient: '', degreeX: '', degreeY: '' },
          { coefficient: '', degreeX: '', degreeY: '' },
          { coefficient: '', degreeX: '', degreeY: '' }
        ],
        connector: ' + ',
        correctAnswers: [
          { coefficient: 4, degreeX: 2, degreeY: 2 },
          { coefficient: -2, degreeX: 1, degreeY: 1 },
          { coefficient: 1, degreeX: 1, degreeY: 0 }
        ],
        scoreCorrect: SCORE_CORRECT,
        scoreIncorrect: SCORE_INCORRECT
      }
    ]
  },
  polynomialMultiplications: {
    label: 'Πολλαπλασιασμός πολυωνύμων',
    items: [
      {
        id: 'poly-mul-1',
        expression: '(2x + 3y)(x + y)',
        answerTemplate: '□x^□y^□ + □x^□y^□ + □x^□y^□',
        resultMode: 'polynomial',
        parts: [
          { coefficient: '', degreeX: '', degreeY: '' },
          { coefficient: '', degreeX: '', degreeY: '' },
          { coefficient: '', degreeX: '', degreeY: '' }
        ],
        connector: ' + ',
        correctAnswers: [
          { coefficient: 2, degreeX: 2, degreeY: 0 },
          { coefficient: 5, degreeX: 1, degreeY: 1 },
          { coefficient: 3, degreeX: 0, degreeY: 2 }
        ],
        scoreCorrect: SCORE_CORRECT,
        scoreIncorrect: SCORE_INCORRECT
      },
      {
        id: 'poly-mul-2',
        expression: '(x + 2y)(3x - y)',
        answerTemplate: '□x^□y^□ + □x^□y^□ + □x^□y^□',
        resultMode: 'polynomial',
        parts: [
          { coefficient: '', degreeX: '', degreeY: '' },
          { coefficient: '', degreeX: '', degreeY: '' },
          { coefficient: '', degreeX: '', degreeY: '' }
        ],
        connector: ' + ',
        correctAnswers: [
          { coefficient: 3, degreeX: 2, degreeY: 0 },
          { coefficient: 5, degreeX: 1, degreeY: 1 },
          { coefficient: -2, degreeX: 0, degreeY: 2 }
        ],
        scoreCorrect: SCORE_CORRECT,
        scoreIncorrect: SCORE_INCORRECT
      },
      {
        id: 'poly-mul-3',
        expression: '(2x - y)(x + 4y)',
        answerTemplate: '□x^□y^□ + □x^□y^□ + □x^□y^□',
        resultMode: 'polynomial',
        parts: [
          { coefficient: '', degreeX: '', degreeY: '' },
          { coefficient: '', degreeX: '', degreeY: '' },
          { coefficient: '', degreeX: '', degreeY: '' }
        ],
        connector: ' + ',
        correctAnswers: [
          { coefficient: 2, degreeX: 2, degreeY: 0 },
          { coefficient: 7, degreeX: 1, degreeY: 1 },
          { coefficient: -4, degreeX: 0, degreeY: 2 }
        ],
        scoreCorrect: SCORE_CORRECT,
        scoreIncorrect: SCORE_INCORRECT
      }
    ]
  }
};

const POLYNOMIAL_ACTIVITY_OPTIONS = ACTIVITY_LIBRARY.map((activity) => ({
  value: activity.id,
  label: activity.title
}));

const DEFAULT_ACTIVITY_ID = ACTIVITY_LIBRARY[0].id;

const getCurrentStudentAnswerPayload = (selectedExpressionId, activeExpression, expressionDrafts, teamAnswers, isDegreeOnlyActivity, isMonomialResultActivity, isPolynomialResultActivity) => {
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

const getAnswerColumnsForExpression = (expressionItem) => {
  const fields = getAnswerFieldDefinitions(expressionItem);

  return fields.map((fieldName) => {
    const partMatch = fieldName.match(/^part-(\d+)-(coefficient|degreeX|degreeY)$/);
    const label = partMatch
      ? partMatch[2] === 'coefficient' ? 'συντελεστής' : partMatch[2] === 'degreeX' ? 'x' : 'y'
      : fieldName === 'coefficient'
        ? 'Συντελεστής'
        : fieldName === 'degreeX'
          ? 'Βαθμός x'
          : fieldName === 'degreeY'
            ? 'Βαθμός y'
            : 'Συνολικός βαθμός';

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

const getAnswerHeaderGroupsForExpression = (expressionItem) => {
  const fields = getAnswerFieldDefinitions(expressionItem);
  const groups = new Map();

  fields.forEach((fieldName) => {
    const match = fieldName.match(/^part-(\d+)-/);
    if (!match) {
      return;
    }

    const termIndex = Number(match[1]) + 1;
    if (!groups.has(termIndex)) {
      groups.set(termIndex, { label: `Όρος ${termIndex}`, colSpan: 0 });
    }
    groups.get(termIndex).colSpan += 1;
  });

  return Array.from(groups.values());
};

export default function App({ role = 'teacher' }) {
  const isTeacher = role === 'teacher';
  const isStudent = role === 'student';
  const wsRef = useRef(null);
  const reconnectTimerRef = useRef(null);
  const hasRegisteredRef = useRef(false);

  const [selectedActivityId, setSelectedActivityId] = useState(DEFAULT_ACTIVITY_ID);
  const [selectedExpressionId, setSelectedExpressionId] = useState(ALGEBRA_DATASETS[ACTIVITY_DATASET_KEYS[DEFAULT_ACTIVITY_ID]].items[0].id);
  const [teamAnswers, setTeamAnswers] = useState({
    coefficient: '',
    degreeX: '',
    degreeY: '',
    totalDegree: ''
  });
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

  const activeDatasetKey = ACTIVITY_DATASET_KEYS[selectedActivityId] || 'monomials';
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

  const getExpressionPreview = (expressionItem, partsOverride = expressionItem?.parts) => {
    if (!expressionItem) {
      return '';
    }

    const slots = partsOverride && partsOverride.length > 0
      ? partsOverride
      : [{ coefficient: '', degreeX: '', degreeY: '' }];
    const rendered = slots.map((slot) => {
      const coefficient = slot.coefficient || '□';
      const degreeX = slot.degreeX || '□';
      const degreeY = slot.degreeY || '□';
      return `${coefficient}x^${degreeX}y^${degreeY}`;
    });

    return rendered.join(expressionItem.connector || ' + ');
  };

  const getMonomialAnswerPreview = (parts) => {
    const coefficient = parts?.[0]?.coefficient || '□';
    const degreeX = parts?.[0]?.degreeX || '□';
    const degreeY = parts?.[0]?.degreeY || '□';
    return `${coefficient}x^${degreeX}y^${degreeY}`;
  };

  const isDegreeOnlyActivity = selectedActivityId === '2.1';
  const isMonomialResultActivity = ['1.2', '1.3', '2.2'].includes(selectedActivityId);
  const isPolynomialResultActivity = ['2.3', '2.4'].includes(selectedActivityId);
  const isTemplateActivity = isMonomialResultActivity || isPolynomialResultActivity || isDegreeOnlyActivity;
  const leftExpressionText = activeExpression.expression;
  const resultInputValues = activeExpressionParts[0] || { coefficient: '', degreeX: '', degreeY: '' };
  const degreeOnlyInputValues = activeExpressionParts[0] || { degreeX: '', degreeY: '', totalDegree: '' };
  const degreeOnlyPreviewText = `\\deg_x = ${degreeOnlyInputValues.degreeX || '□'}, \\deg_y = ${degreeOnlyInputValues.degreeY || '□'}, \\deg_{xy} = ${degreeOnlyInputValues.totalDegree || '□'}`;
  const groupedPolynomialExpression = useMemo(() => {
    if (selectedActivityId !== '2.3') {
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
    const nextDataset = ALGEBRA_DATASETS[ACTIVITY_DATASET_KEYS[nextId]] || ALGEBRA_DATASETS.monomials;
    const nextExpression = nextDataset.items[0]?.id || '';
    setSelectedActivityId(nextId);
    setSelectedExpressionId(nextExpression);
    setTeamAnswers({ coefficient: '', degreeX: '', degreeY: '', totalDegree: '' });
    sendSocketMessage({
      type: 'teacher_lesson',
      lesson: {
        activityId: nextId,
        datasetKey: ACTIVITY_DATASET_KEYS[nextId] || 'monomials',
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
        datasetKey: ACTIVITY_DATASET_KEYS[selectedActivityId] || 'monomials',
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
      answers: getCurrentStudentAnswerPayload(
        selectedExpressionId,
        activeExpression,
        expressionDrafts,
        teamAnswers,
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
    activeExpression,
    isDegreeOnlyActivity,
    isMonomialResultActivity,
    isPolynomialResultActivity
  ]);

  useEffect(() => {
    if (selectedActivityId && ACTIVITY_DATASET_KEYS[selectedActivityId]) {
      const dataset = ALGEBRA_DATASETS[ACTIVITY_DATASET_KEYS[selectedActivityId]];
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

  return (
    <div className="lab-shell poly-lab-shell">
      <header className="lab-header poly-lab-header">
        <HeroTitle>
          {activeActivity.title}
        </HeroTitle>
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

      <section className="common-zone lab-zone poly-common-zone">
        <div className="lab-workspace poly-neural-zone">
          <div className="lab-card lab-card--highlight poly-expression-card" aria-label="μονώνυμο ή πολυώνυμο">
            <p className="lab-mini-label poly-mini-label">Έκφραση</p>
            {groupedPolynomialExpression ? (
              <div className="poly-stacked-expression">
                <div className="poly-stacked-expression-row">
                  <MathFormula formula={`\\(${groupedPolynomialExpression.left}\\)`} />
                </div>
                <div className="poly-stacked-expression-operator" aria-label="operator between polynomial terms">
                  {groupedPolynomialExpression.operator}
                </div>
                <div className="poly-stacked-expression-row">
                  <MathFormula formula={`\\(${groupedPolynomialExpression.right}\\)`} />
                </div>
              </div>
            ) : (
              <div className="lab-math-box poly-expression-math">
                <MathFormula formula={`\\(${leftExpressionText}\\)`} />
              </div>
            )}
            {selectedActivityId === '1.1' && (
              <p className="poly-hero-text">{activeActivity.objective}</p>
            )}
          </div>

          <div className="lab-card lab-card--panel poly-team-card">
            {isTemplateActivity ? (
              <div className="poly-template-answer-panel">
                {isDegreeOnlyActivity ? (
                  <div className="poly-team-grid poly-team-grid--full">
                    <div className="poly-term-block poly-term-block--result">
                      <div className="poly-term-inputs poly-term-inputs--result">
                        <label className="lab-field poly-team-field">
                          <span>Βαθμός ως προς x</span>
                          <input
                            type="text"
                            value={degreeOnlyInputValues.degreeX}
                            onChange={(event) => updateExpressionPart(0, 'degreeX', event.target.value)}
                            placeholder="π.χ. 4"
                          />
                        </label>
                        <label className="lab-field poly-team-field">
                          <span>Βαθμός ως προς y</span>
                          <input
                            type="text"
                            value={degreeOnlyInputValues.degreeY}
                            onChange={(event) => updateExpressionPart(0, 'degreeY', event.target.value)}
                            placeholder="π.χ. 2"
                          />
                        </label>
                        <label className="lab-field poly-team-field">
                          <span>Συνολικός βαθμός</span>
                          <input
                            type="text"
                            value={degreeOnlyInputValues.totalDegree}
                            onChange={(event) => updateExpressionPart(0, 'totalDegree', event.target.value)}
                            placeholder="π.χ. 6"
                          />
                        </label>
                      </div>
                    </div>
                  </div>
                ) : isPolynomialResultActivity ? (
                  <div className="poly-team-grid poly-team-grid--full">
                    {activeExpressionParts.map((part, index) => (
                      <div key={`${selectedExpressionId}-term-${index}`} className="poly-term-block poly-term-block--result">
                        <div className="poly-term-inputs poly-term-inputs--result">
                          <label className="lab-field poly-team-field">
                            <span>συντελεστής</span>
                            <input
                              type="text"
                              value={part.coefficient || ''}
                              onChange={(event) => updateExpressionPart(index, 'coefficient', event.target.value)}
                              placeholder="π.χ. 3"
                            />
                          </label>
                          <label className="lab-field poly-team-field">
                            <span>x^</span>
                            <input
                              type="text"
                              value={part.degreeX || ''}
                              onChange={(event) => updateExpressionPart(index, 'degreeX', event.target.value)}
                              placeholder="π.χ. 4"
                            />
                          </label>
                          <label className="lab-field poly-team-field">
                            <span>y^</span>
                            <input
                              type="text"
                              value={part.degreeY || ''}
                              onChange={(event) => updateExpressionPart(index, 'degreeY', event.target.value)}
                              placeholder="π.χ. 2"
                            />
                          </label>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="poly-team-grid poly-team-grid--full">
                    <div className="poly-term-block poly-term-block--result">
                      <div className="poly-term-inputs poly-term-inputs--result">
                        <label className="lab-field poly-team-field">
                          <span>συντελεστής</span>
                          <input
                            type="text"
                            value={resultInputValues.coefficient}
                            onChange={(event) => updateExpressionPart(0, 'coefficient', event.target.value)}
                            placeholder="π.χ. 3"
                          />
                        </label>
                        <label className="lab-field poly-team-field">
                          <span>x^</span>
                          <input
                            type="text"
                            value={resultInputValues.degreeX}
                            onChange={(event) => updateExpressionPart(0, 'degreeX', event.target.value)}
                            placeholder="π.χ. 4"
                          />
                        </label>
                        <label className="lab-field poly-team-field">
                          <span>y^</span>
                          <input
                            type="text"
                            value={resultInputValues.degreeY}
                            onChange={(event) => updateExpressionPart(0, 'degreeY', event.target.value)}
                            placeholder="π.χ. 2"
                          />
                        </label>
                      </div>
                    </div>
                  </div>
                )}

                <div className="lab-preview poly-preview-panel">
                  <p className="lab-mini-label poly-mini-label">Απάντηση</p>
                  <div className="lab-math-box lab-math-box--compact poly-expression-math poly-expression-math--small">
                    <MathFormula formula={`\\(${rightPreviewText}\\)`} />
                  </div>
                </div>
              </div>
            ) : (
              <div className="lab-input-grid poly-team-grid">
                <label className="lab-field poly-team-field">
                  <span>Συντελεστής</span>
                  <input
                    type="text"
                    value={teamAnswers.coefficient}
                    onChange={(event) => setTeamField('coefficient', event.target.value)}
                    placeholder="π.χ. 3"
                  />
                </label>
                <label className="lab-field poly-team-field">
                  <span>Βαθμός ως προς x</span>
                  <input
                    type="text"
                    value={teamAnswers.degreeX}
                    onChange={(event) => setTeamField('degreeX', event.target.value)}
                    placeholder="π.χ. 4"
                  />
                </label>
                <label className="lab-field poly-team-field">
                  <span>Βαθμός ως προς y</span>
                  <input
                    type="text"
                    value={teamAnswers.degreeY}
                    onChange={(event) => setTeamField('degreeY', event.target.value)}
                    placeholder="π.χ. 2"
                  />
                </label>
                <label className="lab-field poly-team-field">
                  <span>Συνολικός βαθμός</span>
                  <input
                    type="text"
                    value={teamAnswers.totalDegree}
                    onChange={(event) => setTeamField('totalDegree', event.target.value)}
                    placeholder="π.χ. 6"
                  />
                </label>
              </div>
            )}
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
            <div className="lab-data-section data-section poly-data-menu">
              <div className="lab-select-group poly-select-group">
                <label className="shared-activity-label" htmlFor="poly-expression">Έκφραση</label>
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
              ...getAnswerColumnsForExpression(activeExpression),
              {
                key: 'score',
                label: 'Συνολικό σκορ',
                render: (student) => {
                  const numericScore = getStudentScoreForExpression(student, activeExpression);
                  return Number.isFinite(numericScore) ? numericScore : '-';
                }
              }
            ]}
            headerGroups={getAnswerHeaderGroupsForExpression(activeExpression)}
            emptyMessage="Δεν υπάρχουν μαθητές για αυτό το εργαστήριο."
          />

          <StudentQrAccordion
            qrSrc="/labs/polynomial-lab/media/polynomial_student_qrcode.png"
            alt="QR code για το Polynomial Lab student link"
          />
        </>
      )}

      {!isTeacher && null}
    </div>
  );
}
