import React from 'react';
import MathFormula from '../primitives/MathFormula';
import './MathPreviewWidget.css';

function getNumericValue(value) {
  const normalizedValue = String(value ?? '').trim().replace(',', '.');
  const numericValue = normalizedValue === '' ? 0 : Number(normalizedValue);
  return Number.isFinite(numericValue) ? numericValue : 0;
}

function formatAnswerParts(parts = []) {
  const terms = (Array.isArray(parts) ? parts : []).map((part) => {
    const coefficient = getNumericValue(part?.coefficient);
    const degreeX = getNumericValue(part?.degreeX);
    const degreeY = getNumericValue(part?.degreeY);
    if (coefficient === 0) return '';

    const variables = [
      ['x', degreeX],
      ['y', degreeY]
    ].map(([variable, degree]) => {
      if (degree === 0) return '';
      return degree === 1 ? variable : `${variable}^{${degree}}`;
    }).join('');
    const absoluteCoefficient = Math.abs(coefficient);
    const coefficientText = absoluteCoefficient === 1 && variables
      ? ''
      : String(absoluteCoefficient);
    return {
      sign: coefficient < 0 ? '-' : '+',
      value: `${coefficientText}${variables}` || '1'
    };
  }).filter(Boolean);

  return terms.reduce((formula, term, index) => {
    if (index === 0) return term.sign === '-' ? `-${term.value}` : term.value;
    return `${formula} ${term.sign} ${term.value}`;
  }, '');
}

/** Renders an activity answer or expression preview with its configured label. */
export default function MathPreviewWidget({ label = '', formula = '', answerMode = '', answerParts }) {
  const answerFormula = ['monomial', 'polynomial'].includes(answerMode)
    ? formatAnswerParts(answerParts)
    : formula;
  const normalizedFormula = String(answerFormula || '').startsWith('\\(')
    ? answerFormula
    : `\\(${answerFormula || ''}\\)`;

  return (
    <div className="activity-math-preview-widget">
      {answerFormula ? <MathFormula formula={normalizedFormula} /> : null}
    </div>
  );
}
