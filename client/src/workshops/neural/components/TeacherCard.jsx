import React from 'react';
import { HeroTitle, MathFormula } from '../../../shared/components';

export const TeacherCard = ({ children, title }) => (
  <div className="teacher-card">
    {title && (
      <HeroTitle>
        <MathFormula formula={title} />
      </HeroTitle>
    )}
    {children}
  </div>
);
