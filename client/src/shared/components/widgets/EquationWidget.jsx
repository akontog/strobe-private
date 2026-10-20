import React from 'react';
import MathFormula from '../primitives/MathFormula';
import './EquationWidget.css';

export function formatEquation(expression = '') {
  const value = String(expression).trim();
  if (!value) return '';
  const latex = value.startsWith('$$') && value.endsWith('$$')
    ? value.slice(2, -2)
    : value.startsWith('$') && value.endsWith('$')
      ? value.slice(1, -1)
      : value;
  return `\\(${latex}\\)`;
}

export default function EquationWidget({
  expression = '' // Equation string rendered as a math formula.
}) {
  const formula = formatEquation(expression);
  if (!formula) return null;
  return <div className="activity-equation-widget"><MathFormula formula={formula} /></div>;
}
