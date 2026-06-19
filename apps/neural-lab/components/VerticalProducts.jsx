import React from 'react';
import { ProductRow } from './ProductRow';

export const VerticalProducts = ({
  icon = '🚗',
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
  threshold
}) => {
  const handleW1Change = (e) => {
    if (editWeights && onWeightChange) {
      onWeightChange('w1', parseInt(e.target.value) || 0);
    }
  };

  const handleW2Change = (e) => {
    if (editWeights && onWeightChange) {
      onWeightChange('w2', parseInt(e.target.value) || 0);
    }
  };

  return (
    <div className="vertical-products">
      <div className="big-icon">
        <span>{icon}</span>
      </div>
      <div className="products-stack">
        <ProductRow
          icon="🛞"
          label="ρόδες"
          input1={i1}
          weight={editWeights ? w1 : w1}
          product={prod1}
          isSecondRow={false}
          isQuestion={useQuestionMarks}
        />
        <ProductRow
          icon="⚙️"
          label="μηχανές"
          input1={i2}
          weight={editWeights ? w2 : w2}
          product={prod2}
          isSecondRow={true}
          isQuestion={useQuestionMarks}
        />
        <div className="total-line">
          <div className={`total-result ${useQuestionMarks ? 'result-question' : ''}`}>
            {useQuestionMarks ? '?' : total}
          </div>
          {threshold && (
            <div className={`threshold-indicator ${threshold.satisfied ? 'threshold-true' : 'threshold-false'}`}>
              {threshold.satisfied ? '✓ Ικανοποιείται' : '✗ Δεν ικανοποιείται'}
            </div>
          )}
        </div>
        {(editWeights || onRefresh) && (
          <button className="reveal-btn" onClick={onRefresh}>
            🔄 Ενημέρωση
          </button>
        )}
      </div>
    </div>
  );
};
