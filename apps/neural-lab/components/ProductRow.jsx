import React from 'react';

export const ProductRow = ({
  icon,
  label,
  input1,
  weight,
  product,
  isSecondRow = false,
  inputEditable = false,
  weightEditable = false,
  productEditable = false,
  onInputChange,
  onWeightChange,
  onProductChange,
  inputPlaceholder = '',
  weightPlaceholder = '',
  productPlaceholder = ''
}) => {
  const renderInputBox = (value, editable, onChange, className, placeholder) => {
    if (!editable) {
      return <div className={className}>{value ?? '-'}</div>;
    }

    return (
      <input
        className="input-box-style"
        type="number"
        value={value ?? ''}
        placeholder={placeholder}
        onChange={(event) => {
          if (typeof onChange === 'function') {
            onChange(event.target.value);
          }
        }}
      />
    );
  };

  return (
    <div className="product-row">
      <div className="product-left">
        <span className="icon-small">{icon}</span>
        <span className="feature-text">{label}</span>
        <div className="math-group">
          {renderInputBox(input1, inputEditable, onInputChange, 'blue-number-box', inputPlaceholder)}
          <div className="multiply-symbol">×</div>
          {renderInputBox(weight, weightEditable, onWeightChange, 'red-number-box', weightPlaceholder)}
        </div>
      </div>
      {isSecondRow ? (
        <div className="second-row-left">
          <div className="plus-symbol">+</div>
          {productEditable ? (
            <input
              className="input-box-style"
              type="number"
              value={product ?? ''}
              placeholder={productPlaceholder}
              onChange={(event) => {
                if (typeof onProductChange === 'function') {
                  onProductChange(event.target.value);
                }
              }}
            />
          ) : (
            <div className="product-result">{product ?? '-'}</div>
          )}
        </div>
      ) : productEditable ? (
        <input
          className="input-box-style"
          type="number"
          value={product ?? ''}
          placeholder={productPlaceholder}
          onChange={(event) => {
            if (typeof onProductChange === 'function') {
              onProductChange(event.target.value);
            }
          }}
        />
      ) : (
        <div className="product-result">{product ?? '-'}</div>
      )}
    </div>
  );
};
