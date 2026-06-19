import React from 'react';

export const BlueNumberBox = ({ value, className = '' }) => (
  <div className={`blue-number-box ${className}`}>
    {value}
  </div>
);

export const RedNumberBox = ({ value, isQuestion = false, className = '' }) => (
  <div className={`red-number-box ${className}`}>
    {isQuestion ? '?' : value}
  </div>
);

export const InputBoxStyle = ({ value, onChange, placeholder = '', style = {} }) => (
  <input
    type="number"
    className="input-box-style"
    value={value}
    onChange={onChange}
    placeholder={placeholder}
    step="1"
    style={style}
  />
);

export const ProductResult = ({ value, isQuestion = false }) => (
  <div className={`product-result ${isQuestion ? 'result-question' : ''}`}>
    {isQuestion ? '?' : value}
  </div>
);
