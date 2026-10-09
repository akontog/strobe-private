import React from 'react';
import { ActivityInputGrid } from '../../../shared/components';

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
}) => (
  <div className="product-row">
    <div className="product-left">
      <div className="feature-label">
        <span className="icon-small">{icon}</span>
        <span className="feature-text">{label}</span>
      </div>
      <ActivityInputGrid
        customLayout
        className="math-group"
        fields={[
          {
            id: 'input',
            className: 'math-input-slot',
            value: input1,
            editable: inputEditable,
            onChange: onInputChange,
            ariaLabel: `${label} input`,
            inputClassName: 'input-box-style',
            displayClassName: 'blue-number-box'
          },
          { id: 'multiply', kind: 'token', className: 'multiply-symbol', value: '×' },
          {
            id: 'weight',
            className: 'math-weight-slot',
            value: weight,
            editable: weightEditable,
            onChange: onWeightChange,
            ariaLabel: `${label} weight`,
            inputClassName: 'input-box-style',
            displayClassName: 'red-number-box'
          },
          { id: 'equal', kind: 'token', className: 'equal-symbol', value: '=' },
          {
            id: 'product',
            className: 'product-output',
            value: product,
            editable: productEditable,
            onChange: onProductChange,
            ariaLabel: `${label} product`,
            inputClassName: 'input-box-style',
            displayClassName: 'product-result'
          }
        ]}
      />
    </div>
  </div>
);
