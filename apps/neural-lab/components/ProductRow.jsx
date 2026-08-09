import React from 'react';

export const ProductRow = ({
  icon,
  label,
  input1,
  weight,
  product,
  inputEditable = false,
  weightEditable = false,
  productEditable = false,
  onInputChange,
  onWeightChange,
  onProductChange
}) => {
  const renderInputBox = (value, editable, onChange, className) => {
    if (!editable) {
      return <div className={className}>{value ?? '-'}</div>;
    }

    return (
      <input
        className="input-box-style"
        type="text"
        value={value === null || value === undefined ? '' : String(value)}
        onChange={(event) => {
          if (typeof onChange === 'function') {
            onChange(event.target.value);
          }
        }}
      />
    );
  };

  const renderProductControl = () => {
    if (productEditable) {
      return (
        <input
          className="input-box-style"
          type="text"
          value={product === null || product === undefined ? '' : String(product)}
          onChange={(event) => {
            if (typeof onProductChange === 'function') {
              onProductChange(event.target.value);
            }
          }}
        />
      );
    }

    return <div className="product-result">{product ?? '-'}</div>;
  };

  return (
    <div className="product-row">
      <div className="product-left">
        <div className="feature-label">
          <span className="icon-small">{icon}</span>
          <span className="feature-text">{label}</span>
        </div>
        <div className="math-group">
          <div className="math-input-slot">
            {renderInputBox(input1, inputEditable, onInputChange, 'blue-number-box')}
          </div>
          <div className="multiply-symbol">×</div>
          <div className="math-weight-slot">
            {renderInputBox(weight, weightEditable, onWeightChange, 'red-number-box')}
          </div>
          <div className="equal-symbol">=</div>
          <div className="product-output">{renderProductControl()}</div>
        </div>
      </div>
    </div>
  );
};
