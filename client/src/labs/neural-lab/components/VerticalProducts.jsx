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
  showInput1 = true,
  showInput2 = true,
  showTotal = true,
  useQuestionMarks,
  editWeights,
  onWeightChange,
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
  demoIcon,
  demoLabel,
  showThreshold,
  thresholdValue,
  showThresholdUnderIcon
}) => {
  const hasDemoIcon = Boolean(demoIcon);

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

  const renderTotalControl = () => {
    if (studentAnswerMode) {
      return (
        <input
          className="student-answer-input"
          type="text"
          value={studentAnswer}
          onChange={(e) => {
            if (typeof onStudentAnswerChange === 'function') {
              onStudentAnswerChange(e.target.value);
            }
          }}
        />
      );
    }

    if (totalEditable) {
      return (
        <div className={`input-wrapper ${showThreshold && threshold ? (threshold.satisfied ? 'threshold-true' : 'threshold-false') : ''}`}>
          <input
            className="student-answer-input"
            type="text"
            value={totalValue ?? ''}
            onChange={(event) => {
              if (typeof onTotalChange === 'function') {
                onTotalChange(event.target.value);
              }
            }}
          />
        </div>
      );
    }

    return (
      <>  
      <div className="equal-symbol">=</div>
      <div className={`total-result ${showThreshold && threshold ? (threshold.satisfied ? 'threshold-true' : 'threshold-false') : ''}`}>
        {total}
      </div>
      </>
    );
  };

  return (
    <div className="vertical-products">
      <div className="big-icon">
        <span>{icon}</span>
      </div>
      <div className="products-stack">
        {showInput1 && (
          <ProductRow
            icon={features.i1.icon}
            label={features.i1.label}
            input1={i1}
            weight={w1}
            product={prod1}
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
          />
        )}
        {showInput2 && (
          <ProductRow
            icon={features.i2.icon}
            label={features.i2.label}
            input1={i2}
            weight={w2}
            product={prod2}
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
          />
        )}
        {showTotal && (
          <div className="product-row total-product-row">
            <div className="product-left total-row-ghost" aria-hidden="true">
              <span className="icon-small total-row-ghost-item">+</span>
              <span className="feature-text total-row-ghost-item">placeholder</span>
              <div className="math-group total-row-ghost-item">
                <div className="blue-number-box">0</div>
                <div className="multiply-symbol">×</div>
                <div className="red-number-box">0</div>
              </div>
            </div>
            <div className="total-line total-row-output">
              {renderTotalControl()}
            </div>
          </div>
        )}
      </div>
      <div className={`demo-icon ${hasDemoIcon ? 'has-icon' : 'no-frame'}`} title={demoLabel || 'Αντικείμενο-στόχος'}>
        <span>{demoIcon || ''}</span>
        {showThresholdUnderIcon && (
          <div className="demo-icon-threshold">{thresholdValue}</div>
        )}
      </div>
    </div>
  );
};
