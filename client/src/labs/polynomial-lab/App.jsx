import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  CommonZoneFullscreenButton,
  Accordion,
  ActivitiesMenu,
  CollaborativeGeoGebra,
  GroupingDragDrop,
  HeroTitle,
  MathFormula,
  SharedCommonZoneLayout,
  ActivityInputGrid,
  SharedInputRow,
  StudentQrAccordion,
  StudentTable,
  AlgebraTiles,
  randomIdentityColor,
  readIdentitySnapshot,
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
    title: '1.2 Αναγνώριση όμοιων μονωνύμων (ομαδοποίηση)',
    objective: 'Ομαδοποίηση μονωνύμων με ίδιο μεταβλητό μέρος.',
    tasks: ['Αναγνώριση όμοιων μονωνύμων', 'Ταξινόμηση με drag and drop']
  },
  {
    id: '1.3',
    code: '1.3',
    title: '1.3 Πράξεις με μονώνυμα (πρόσθεση-αφαίρεση)',
    objective: 'Πρόσθεση και αφαίρεση όμοιων μονωνύμων.',
    tasks: ['Κοινός όρος', 'Συνδυασμός όρων', 'Αφαίρεση μονωνύμων']
  },
  {
    id: '1.4',
    code: '1.4',
    title: '1.4 Πράξεις με μονώνυμα (πολλαπλασιασμός)',
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
    title: '2.3 Ομαδοποίηση όμοιων όρων δύο πολυωνύμων',
    objective: 'Ομαδοποίηση όρων από δύο πολυώνυμα και αυτόματη πρόσθεση ανά ομάδα ομοίων όρων.',
    tasks: ['Ταξινόμηση όρων', 'Έλεγχος ομοιότητας', 'Αυτόματο αποτέλεσμα']
  },
  {
    id: '2.4',
    code: '2.4',
    title: '2.4 Πράξεις με πολυώνυμα (πρόσθεση-αφαίρεση)',
    objective: 'Πρόσθεση και αφαίρεση πολυωνύμων με αναγωγή όμοιων όρων.',
    tasks: ['Άθροισμα', 'Διαφορά', 'Μικτό αποτέλεσμα']
  },
  {
    id: '2.5',
    code: '2.5',
    title: '2.5 Πράξεις με πολυώνυμα (πολλαπλασιασμός)',
    objective: 'Πολλαπλασιασμός πολυωνύμων και αναγνώριση όρων του αποτελέσματος.',
    tasks: ['Πολλαπλασιασμός δύο όρων', 'Πολλαπλασιασμός τριών όρων']
  },
  {
    id: '2.6',
    code: '2.6',
    title: '2.6 Πολλαπλασιασμός με εμβαδά ορθογωνίου',
    objective: 'Οπτικοποίηση του (2x+4)(x+5) με ορθογώνιο και επιμέρους εμβαδά.',
    tasks: ['Μετακίνηση σημείου x', 'Παρατήρηση 4 υπο-εμβαδών', 'Σύνδεση με ανάπτυγμα πολυωνύμου']
  },
  {
    id: '2.7',
    code: '2.7',
    title: '2.7 Πλακίδια άλγεβρας: πολλαπλασιασμός και παραγοντοποίηση',
    objective: 'Αναπαράσταση πολυωνύμων με θετικά και αρνητικά πλακίδια, μοντέλο εμβαδού και αντίστροφη παραγοντοποίηση.',
    tasks: ['Σύνθεση πολυωνύμου με πλακίδια', 'Μοντέλο εμβαδού για γινόμενο', 'Παραγοντοποίηση τριωνύμου']
  }
];

const ACTIVITY_DATASET_KEYS = {
  '1.1': 'monomials',
  '1.2': 'monomialGrouping',
  '1.3': 'monomialOperations',
  '1.4': 'monomialMultiplications',
  '2.1': 'polynomialBasics',
  '2.2': 'likeTermReduction',
  '2.3': 'polynomialLikeTermGrouping',
  '2.4': 'polynomialOperations',
  '2.5': 'polynomialMultiplications',
  '2.6': 'polynomialAreaModel',
  '2.7': 'algebraTiles'
};

const buildGroupingCorrectAnswers = (items = []) => items.reduce((answers, item) => {
  answers[`item-${item.id}`] = item.correctGroupId;
  return answers;
}, {});

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
  monomialGrouping: {
    label: 'Ομαδοποίηση μονωνύμων',
    items: [
      {
        id: 'grouping-1',
        expression: 'Ομαδοποίηση όμοιων μονωνύμων (Α)',
        resultMode: 'grouping',
        groups: [
          { id: 'g1', title: 'Ομάδα 1', hint: '3x^2y' },
          { id: 'g2', title: 'Ομάδα 2', hint: '5xy^2' },
          { id: 'g3', title: 'Ομάδα 3', hint: '7x^3y' }
        ],
        items: [
          { id: 'a1', label: '-2x^2y', correctGroupId: 'g1' },
          { id: 'a2', label: '8x^2y', correctGroupId: 'g1' },
          { id: 'b1', label: '4xy^2', correctGroupId: 'g2' },
          { id: 'b2', label: '3xy^2', correctGroupId: 'g2' },
          { id: 'c1', label: '6x^3y', correctGroupId: 'g3' },
          { id: 'c2', label: '-5x^3y', correctGroupId: 'g3' }
        ],
        correctAnswers: buildGroupingCorrectAnswers([
          { id: 'a1', correctGroupId: 'g1' },
          { id: 'a2', correctGroupId: 'g1' },
          { id: 'b1', correctGroupId: 'g2' },
          { id: 'b2', correctGroupId: 'g2' },
          { id: 'c1', correctGroupId: 'g3' },
          { id: 'c2', correctGroupId: 'g3' }
        ]),
        scoreCorrect: SCORE_CORRECT,
        scoreIncorrect: SCORE_INCORRECT
      },
      {
        id: 'grouping-2',
        expression: 'Ομαδοποίηση όμοιων μονωνύμων (Β)',
        resultMode: 'grouping',
        groups: [
          { id: 'g1', title: 'Ομάδα 1', hint: '-2x^3y^2' },
          { id: 'g2', title: 'Ομάδα 2', hint: '4xy' }
        ],
        items: [
          { id: 'd1', label: '6x^3y^2', correctGroupId: 'g1' },
          { id: 'd2', label: '-9x^3y^2', correctGroupId: 'g1' },
          { id: 'e1', label: '7xy', correctGroupId: 'g2' },
          { id: 'e2', label: '-3xy', correctGroupId: 'g2' },
          { id: 'd3', label: 'x^3y^2', correctGroupId: 'g1' },
          { id: 'e3', label: '12xy', correctGroupId: 'g2' }
        ],
        correctAnswers: buildGroupingCorrectAnswers([
          { id: 'd1', correctGroupId: 'g1' },
          { id: 'd2', correctGroupId: 'g1' },
          { id: 'e1', correctGroupId: 'g2' },
          { id: 'e2', correctGroupId: 'g2' },
          { id: 'd3', correctGroupId: 'g1' },
          { id: 'e3', correctGroupId: 'g2' }
        ]),
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
        answerTemplate: 'x^{}y^{}',
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
        answerTemplate: 'x^{}y^{}',
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
        answerTemplate: 'x^{}y^{}',
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
        answerTemplate: 'x^{}y^{}',
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
        answerTemplate: 'x^{}y^{}',
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
        answerTemplate: 'x^{}y^{}',
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
        answerTemplate: 'x^{}y^{}',
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
        answerTemplate: 'x^{}y^{}',
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
        answerTemplate: 'x^{}y^{}',
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
  polynomialLikeTermGrouping: {
    label: 'Ομαδοποίηση όμοιων όρων (δύο πολυώνυμα)',
    items: [
      {
        id: 'poly-group-1',
        expression: '(3x^2 + 5xy - 2y^2) + (4x^2 - 3xy + y^2)',
        resultMode: 'grouping',
        leftPolynomial: '3x^2 + 5xy - 2y^2',
        rightPolynomial: '4x^2 - 3xy + y^2',
        operator: '+',
        groups: [
          { id: 'g-x2', title: 'Όμοιοι όροι x^2', hint: 'x^2', degreeX: 2, degreeY: 0 },
          { id: 'g-xy', title: 'Όμοιοι όροι xy', hint: 'xy', degreeX: 1, degreeY: 1 },
          { id: 'g-y2', title: 'Όμοιοι όροι y^2', hint: 'y^2', degreeX: 0, degreeY: 2 }
        ],
        items: [
          { id: 'l1', label: '3x^2', coefficient: 3, degreeX: 2, degreeY: 0, source: 'L', correctGroupId: 'g-x2' },
          { id: 'l2', label: '5xy', coefficient: 5, degreeX: 1, degreeY: 1, source: 'L', correctGroupId: 'g-xy' },
          { id: 'l3', label: '-2y^2', coefficient: -2, degreeX: 0, degreeY: 2, source: 'L', correctGroupId: 'g-y2' },
          { id: 'r1', label: '4x^2', coefficient: 4, degreeX: 2, degreeY: 0, source: 'R', correctGroupId: 'g-x2' },
          { id: 'r2', label: '-3xy', coefficient: -3, degreeX: 1, degreeY: 1, source: 'R', correctGroupId: 'g-xy' },
          { id: 'r3', label: 'y^2', coefficient: 1, degreeX: 0, degreeY: 2, source: 'R', correctGroupId: 'g-y2' }
        ],
        resultOrder: ['g-x2', 'g-xy', 'g-y2'],
        correctAnswers: buildGroupingCorrectAnswers([
          { id: 'l1', correctGroupId: 'g-x2' },
          { id: 'l2', correctGroupId: 'g-xy' },
          { id: 'l3', correctGroupId: 'g-y2' },
          { id: 'r1', correctGroupId: 'g-x2' },
          { id: 'r2', correctGroupId: 'g-xy' },
          { id: 'r3', correctGroupId: 'g-y2' }
        ]),
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
        answerTemplate: 'x^{}y^{} + x^{}y^{}',
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
        answerTemplate: 'x^{}y^{} + x^{}y^{}',
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
        answerTemplate: 'x^{}y^{} + x^{}y^{} + x^{}y^{}',
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
        answerTemplate: 'x^{}y^{} + x^{}y^{} + x^{}y^{}',
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
        answerTemplate: 'x^{}y^{} + x^{}y^{} + x^{}y^{}',
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
        answerTemplate: 'x^{}y^{} + x^{}y^{} + x^{}y^{}',
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
  },
  polynomialAreaModel: {
    label: 'Εμβαδικό μοντέλο πολυωνύμου',
    items: [
      {
        id: 'poly-area-1',
        expression: '(x + 4)(x + 5)',
        geogebraRoomId: 'polynomial-lab-2-6-area-x',
        resultMode: 'geogebraArea',
        correctAnswers: {},
        scoreCorrect: SCORE_CORRECT,
        scoreIncorrect: SCORE_INCORRECT
      },
      {
        id: 'poly-area-2',
        expression: '(2x + 4)(x + 5)',
        geogebraRoomId: 'polynomial-lab-2-6-area-2x',
        resultMode: 'geogebraArea',
        correctAnswers: {},
        scoreCorrect: SCORE_CORRECT,
        scoreIncorrect: SCORE_INCORRECT
      }
    ]
  },
  algebraTiles: {
    label: 'Πλακίδια άλγεβρας',
    items: [
      {
        id: 'algebra-tiles-linear',
        expression: '3x + 2',
        resultMode: 'algebraTiles',
        correctAnswers: {},
        scoreCorrect: SCORE_CORRECT,
        scoreIncorrect: SCORE_INCORRECT
      },
      {
        id: 'algebra-tiles-quadratic',
        expression: '2x² − x + 4',
        resultMode: 'algebraTiles',
        correctAnswers: {},
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

const getAnswerColumnsForExpression = (expressionItem) => {
  const fields = getAnswerFieldDefinitions(expressionItem);
  const groupingLabelByField = new Map(
    (expressionItem?.items || []).map((item) => [`item-${item.id}`, item.label])
  );

  return fields.map((fieldName) => {
    const partMatch = fieldName.match(/^part-(\d+)-(coefficient|degreeX|degreeY)$/);
    const label = partMatch
      ? partMatch[2] === 'coefficient' ? 'συντελεστής' : partMatch[2] === 'degreeX' ? 'x' : 'y'
      : groupingLabelByField.has(fieldName)
        ? groupingLabelByField.get(fieldName)
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
  const [lastSentAnswers, setLastSentAnswers] = useState('');
  const [lessonGeogebraRoomId, setLessonGeogebraRoomId] = useState('');
  const [algebraTilesByExpression, setAlgebraTilesByExpression] = useState({});

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
      return `${coefficient}x^${degreeX}y^${degreeY}`;
    });

    return rendered.join(expressionItem.connector || ' + ');
  };

  const getMonomialAnswerPreview = (parts) => {
    const coefficient = parts?.[0]?.coefficient || '';
    const degreeX = parts?.[0]?.degreeX || '';
    const degreeY = parts?.[0]?.degreeY || '';
    return `${coefficient}x^${degreeX}y^${degreeY}`;
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
  const getExpressionOptionLabel = (item) => {
    if (isMonomialGroupingActivity && Array.isArray(item?.groups) && item.groups.length > 0) {
      return item.groups.map((group) => group.hint).join(' | ');
    }

    if (isPolynomialGroupingActivity && item?.leftPolynomial && item?.rightPolynomial) {
      return `(${item.leftPolynomial}) + (${item.rightPolynomial})`;
    }

    return item?.expression || item?.id || '';
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
      title: group.title,
      hint: <MathFormula formula={`\\(${group.hint}\\)`} />
    })),
    [activeExpression]
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
        expressionId: nextExpression,
        geogebraRoomId: String(nextDataset.items[0]?.geogebraRoomId || '').trim()
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
        expressionId: nextExpressionId,
        geogebraRoomId: String(
          (activeItems.find((item) => item.id === nextExpressionId)?.geogebraRoomId)
          || ''
        ).trim()
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

      <section className="common-zone lab-zone poly-common-zone">
        <CommonZoneFullscreenButton />
        <SharedCommonZoneLayout
          className={isGeogebraAreaActivity ? 'poly-neural-zone--geogebra' : ''}
          isGroupingMode={isGroupingActivity}
        >
          {!isGeogebraAreaActivity ? (
            <div className="lab-card lab-card--highlight poly-expression-card" aria-label="μονώνυμο ή πολυώνυμο">
              <p className="lab-mini-label poly-mini-label">Έκφραση</p>
              {isGroupingActivity ? (
                null
              ) : groupedPolynomialExpression ? (
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
          ) : null}

          <div className={`lab-card lab-card--panel poly-team-card ${isGeogebraAreaActivity ? 'poly-team-card--geogebra' : ''}`.trim()}>
            {isGroupingActivity ? (
              <div className="poly-grouping-panel">
                <p className="poly-hero-text">
                  {isPolynomialGroupingActivity
                    ? 'Ομαδοποίησε τους όρους από τα δύο πολυώνυμα. Αν ένας όρος μπει λάθος, γίνεται κόκκινος και πρέπει να αφαιρεθεί πρώτα.'
                    : 'Σύρε κάθε μονώνυμο στην ομάδα με το ίδιο μεταβλητό μέρος.'}
                </p>
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
                  items={groupingItems}
                  groups={groupingGroups}
                  placements={activeGroupingPlacements}
                  onChange={setGroupingPlacements}
                  invalidItemIds={invalidGroupingItemIds}
                  disabledItemIds={groupingLockedItemIds}
                  bankLabel="Μονώνυμα προς ομαδοποίηση"
                  emptyZoneLabel="Άφησε εδώ μονώνυμα"
                />
                {isPolynomialGroupingActivity && (
                  <>
                    {invalidGroupingItemIds.length > 0 && (
                      <p className="poly-grouping-warning">Υπάρχει λάθος τοποθέτηση. Αφαίρεσε πρώτα τον κόκκινο όρο.</p>
                    )}
                    <div className="lab-preview poly-preview-panel">
                      <p className="lab-mini-label poly-mini-label">Αυτόματο αποτέλεσμα</p>
                      <div className="lab-math-box lab-math-box--compact poly-expression-math poly-expression-math--small">
                        <MathFormula formula={`\\(${polynomialGroupingResult?.formula || ''}\\)`} />
                      </div>
                      {!polynomialGroupingResult?.isComplete && (
                        <p className="poly-grouping-hint">Ολοκλήρωσε σωστά όλες τις ομάδες για τελικό αποτέλεσμα.</p>
                      )}
                    </div>
                  </>
                )}
              </div>
            ) : isAlgebraTilesActivity ? (
              <AlgebraTiles
                key={selectedExpressionId}
                initialExample={selectedExpressionId === 'algebra-tiles-quadratic' ? 'quadratic' : 'linear'}
                canvasMode="multiplication"
                tiles={algebraTilesByExpression[selectedExpressionId]}
                onTilesChange={updateAlgebraTiles}
              />
            ) : isGeogebraAreaActivity ? (
              <div className="poly-geogebra-area-panel">
                <p className="poly-hero-text">
                  Μετακίνησε μόνο το <strong>slider x</strong> και παρατήρησε πώς αλλάζουν τα 4 επιμέρους εμβαδά.
                </p>
                <CollaborativeGeoGebra
                  roomId={geogebraRoomId}
                  className="poly-geogebra-board"
                  showPermissionControls={isTeacher}
                  showLegend={isTeacher}
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
                {isDegreeOnlyActivity ? (
                  <div className="poly-team-grid poly-team-grid--full">
                    <div className="poly-term-block poly-term-block--result">
                      <div className="poly-term-inputs poly-term-inputs--result">
                        <SharedInputRow
                          rowLabel="1."
                          hideLabels
                          defaultPlaceholder=""
                          boxes={[
                            {
                              label: 'Βαθμός ως προς x',
                              value: degreeOnlyInputValues.degreeX,
                              onChange: (event) => updateExpressionPart(0, 'degreeX', event.target.value)
                            },
                            {
                              label: 'Βαθμός ως προς y',
                              value: degreeOnlyInputValues.degreeY,
                              onChange: (event) => updateExpressionPart(0, 'degreeY', event.target.value)
                            },
                            {
                              label: 'Συνολικός βαθμός',
                              value: degreeOnlyInputValues.totalDegree,
                              onChange: (event) => updateExpressionPart(0, 'totalDegree', event.target.value)
                            }
                          ]}
                        />
                      </div>
                    </div>
                  </div>
                ) : isPolynomialResultActivity ? (
                  <div className="poly-team-grid poly-team-grid--full">
                    {activeExpressionParts.map((part, index) => (
                      <div key={`${selectedExpressionId}-term-${index}`} className="poly-term-block poly-term-block--result">
                        <div className="poly-term-inputs poly-term-inputs--result">
                          <SharedInputRow
                            rowLabel={`${index + 1}.`}
                            tokens={['x^', 'y^', '']}
                            hideLabels
                            defaultPlaceholder=""
                            boxes={[
                              {
                                label: 'συντελεστής',
                                value: part.coefficient || '',
                                onChange: (event) => updateExpressionPart(index, 'coefficient', event.target.value)
                              },
                              {
                                label: 'x^',
                                value: part.degreeX || '',
                                onChange: (event) => updateExpressionPart(index, 'degreeX', event.target.value)
                              },
                              {
                                label: 'y^',
                                value: part.degreeY || '',
                                onChange: (event) => updateExpressionPart(index, 'degreeY', event.target.value)
                              }
                            ]}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="poly-team-grid poly-team-grid--full">
                    <div className="poly-term-block poly-term-block--result">
                      <div className="poly-term-inputs poly-term-inputs--result">
                        <SharedInputRow
                          rowLabel="1."
                          tokens={['x^', 'y^', '']}
                          hideLabels
                          defaultPlaceholder=""
                          boxes={[
                            {
                              label: 'συντελεστής',
                              value: resultInputValues.coefficient,
                              onChange: (event) => updateExpressionPart(0, 'coefficient', event.target.value)
                            },
                            {
                              label: 'x^',
                              value: resultInputValues.degreeX,
                              onChange: (event) => updateExpressionPart(0, 'degreeX', event.target.value)
                            },
                            {
                              label: 'y^',
                              value: resultInputValues.degreeY,
                              onChange: (event) => updateExpressionPart(0, 'degreeY', event.target.value)
                            }
                          ]}
                        />
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
              <ActivityInputGrid
                columns={2}
                className="lab-input-grid poly-team-grid"
                labelClassName="shared-input-box__label"
                fields={[
                  { id: 'coefficient', className: 'shared-input-box lab-field poly-team-field', inputClassName: 'shared-input-box__input', label: 'Συντελεστής', value: teamAnswers.coefficient, onChange: (value) => setTeamField('coefficient', value) },
                  { id: 'degree-x', className: 'shared-input-box lab-field poly-team-field', inputClassName: 'shared-input-box__input', label: 'Βαθμός ως προς x', value: teamAnswers.degreeX, onChange: (value) => setTeamField('degreeX', value) },
                  { id: 'degree-y', className: 'shared-input-box lab-field poly-team-field', inputClassName: 'shared-input-box__input', label: 'Βαθμός ως προς y', value: teamAnswers.degreeY, onChange: (value) => setTeamField('degreeY', value) },
                  { id: 'total-degree', className: 'shared-input-box lab-field poly-team-field', inputClassName: 'shared-input-box__input', label: 'Συνολικός βαθμός', value: teamAnswers.totalDegree, onChange: (value) => setTeamField('totalDegree', value) }
                ]}
              />
            )}
          </div>
        </SharedCommonZoneLayout>
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
                    <option key={item.id} value={item.id}>{getExpressionOptionLabel(item)}</option>
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
