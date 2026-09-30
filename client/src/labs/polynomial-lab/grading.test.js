import test from 'node:test';
import assert from 'node:assert/strict';
import { computeStudentScore, getAnswerFieldDefinitions } from './grading.js';

test('degree-only answers score correct and incorrect values', () => {
  const expression = {
    id: 'poly-basic-1',
    resultMode: 'degreeOnly',
    correctAnswers: { degreeX: 4, degreeY: 3, totalDegree: 7 },
    scoreCorrect: 1,
    scoreIncorrect: -0.5
  };

  const score = computeStudentScore(
    { answers: { degreeX: '4', degreeY: '3', totalDegree: '7' } },
    expression
  );

  assert.equal(score, 1);
  assert.deepEqual(
    getAnswerFieldDefinitions(expression),
    ['degreeX', 'degreeY', 'totalDegree']
  );
});

test('polynomial answers award per-term scores', () => {
  const expression = {
    id: 'poly-op-1',
    resultMode: 'polynomial',
    correctAnswers: [
      { coefficient: 5, degreeX: 2, degreeY: 1 },
      { coefficient: 2, degreeX: 1, degreeY: 2 }
    ],
    scoreCorrect: 1,
    scoreIncorrect: -0.5
  };

  const score = computeStudentScore(
    {
      answers: {
        'part-0-coefficient': '5',
        'part-0-degreeX': '2',
        'part-0-degreeY': '1',
        'part-1-coefficient': '3',
        'part-1-degreeX': '1',
        'part-1-degreeY': '2'
      }
    },
    expression
  );

  assert.equal(score, 0.5);
});

test('grouping answers award per-item scores', () => {
  const expression = {
    id: 'grouping-1',
    resultMode: 'grouping',
    correctAnswers: {
      'item-a1': 'g1',
      'item-a2': 'g1',
      'item-b1': 'g2'
    },
    scoreCorrect: 1,
    scoreIncorrect: -0.5
  };

  const score = computeStudentScore(
    {
      answers: {
        'item-a1': 'g1',
        'item-a2': 'g2',
        'item-b1': 'g2'
      }
    },
    expression
  );

  assert.equal(score, 1.5);
  assert.deepEqual(
    getAnswerFieldDefinitions(expression),
    ['item-a1', 'item-a2', 'item-b1']
  );
});
