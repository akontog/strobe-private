import React from 'react';
import { ProductRow } from './ProductRow';

export const VerticalProducts = ({
  icon = '🚗',
  features,
  prod1,
  prod2,
  w1,
  w2,
  i1,
  i2,
  total,
  useQuestionMarks,
  editWeights,
  onWeightChange,
  onRefresh,
  threshold,
  studentAnswerMode,
  studentAnswer,
  onStudentAnswerChange,
  inputEditable,
  productEditable,
  totalEditable,
  totalValue,
  onInputChange,
  onProductChange,
  onTotalChange,
  inputPlaceholder,
  weightPlaceholder,
  productPlaceholder,
  totalPlaceholder,
  demoIcon,
  demoLabel
}) => {
  const handleW1Change = (value) => {
    if (editWeights && onWeightChange) {
      onWeightChange('w1', value);
    }
  };

  const handleW2Change = (value) => {
    if (editWeights && onWeightChange) {
      onWeightChange('w2', value);
    }
  };

  return (
    <div className="vertical-products">
      <div className="big-icon">
        <span>{icon}</span>
      </div>
      <div className="products-stack">
        <ProductRow
          icon={features.i1.icon}   // π.χ. "🛞"
          label={features.i1.label} // π.χ. ρόδες
          input1={i1}
          weight={w1}
          product={prod1}
          isSecondRow={false}
          inputEditable={Boolean(inputEditable)}
          weightEditable={Boolean(editWeights)}
          productEditable={Boolean(productEditable)}
          onInputChange={(value) => {
            if (typeof onInputChange === 'function') {
              onInputChange('i1', value);
            }
          }}
          onWeightChange={handleW1Change}
          onProductChange={(value) => {
            if (typeof onProductChange === 'function') {
              onProductChange('p1', value);
            }
          }}
          inputPlaceholder={inputPlaceholder}
          weightPlaceholder={weightPlaceholder}
          productPlaceholder={productPlaceholder}
        />
        <ProductRow
          icon={features.i2.icon}   // π.χ. "🛞"
          label={features.i2.label} // π.χ. ρόδες
          input1={i2}
          weight={w2}
          product={prod2}
          isSecondRow={true}
          inputEditable={Boolean(inputEditable)}
          weightEditable={Boolean(editWeights)}
          productEditable={Boolean(productEditable)}
          onInputChange={(value) => {
            if (typeof onInputChange === 'function') {
              onInputChange('i2', value);
            }
          }}
          onWeightChange={handleW2Change}
          onProductChange={(value) => {
            if (typeof onProductChange === 'function') {
              onProductChange('p2', value);
            }
          }}
          inputPlaceholder={inputPlaceholder}
          weightPlaceholder={weightPlaceholder}
          productPlaceholder={productPlaceholder}
        />
        <div className="total-line">
          {studentAnswerMode ? (
            <input
              className="student-answer-input"
              type="text" inputMode="numeric"
              value={studentAnswer}
              placeholder="Δώσε o"
              onChange={(e) => {
                if (typeof onStudentAnswerChange === 'function') {
                  onStudentAnswerChange(e.target.value);
                }
              }}
            />
          ) : totalEditable ? (
            <input
              className="student-answer-input"
              type="text" inputMode="numeric"
              value={totalValue ?? ''}
              placeholder={totalPlaceholder || 'Δώσε o'}
              onChange={(event) => {
                if (typeof onTotalChange === 'function') {
                  onTotalChange(event.target.value);
                }
              }}
            />
          ) : (
             <div className={`total-result ${threshold ? (threshold.satisfied ? 'threshold-true' : 'threshold-false') : ''}`}>
              {total}
            </div>
          )}
          
        </div>
        {(editWeights || onRefresh) && (
          <button className="reveal-btn" onClick={onRefresh}>
            🔄 Ενημέρωση
          </button>
        )}
      </div>
      <div className="demo-icon" title={demoLabel || 'Αντικείμενο-στόχος'}>
        <span>{demoIcon || '❔'}</span>
      </div>
    </div>
  );
};
