import React from 'react';
import MathFormula from './MathFormula';

export const TeacherCard = ({ children, title }) => (
  <div className="teacher-card">
    {title && (
      <div className="hero-title">
        <div className="main-equation">
          <MathFormula formula={title} />
        </div>
      </div>
    )}
    {children}
  </div>
);
