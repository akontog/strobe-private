import React from 'react';

export const ProductRow = ({ 
  icon, 
  label, 
  input1, 
  weight, 
  product, 
  isSecondRow = false,
  isQuestion = false 
}) => (
  <div className="product-row">
    <div className="product-left">
      <span className="icon-small">{icon}</span>
      <span className="feature-text">{label}</span>
      <div className="math-group">
        <div className="blue-number-box">{input1}</div>
        <div className="multiply-symbol">×</div>
        <div className="red-number-box">{isQuestion ? '?' : weight}</div>
      </div>
    </div>
    {isSecondRow ? (
      <div className="second-row-left">
        <div className="plus-symbol">+</div>
        <div className={`product-result ${isQuestion ? 'result-question' : ''}`}>
          {isQuestion ? '?' : product}
        </div>
      </div>
    ) : (
      <div className={`product-result ${isQuestion ? 'result-question' : ''}`}>
        {isQuestion ? '?' : product}
      </div>
    )}
  </div>
);
