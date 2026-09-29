import React from 'react';
import MathFormula from './MathFormula';
import { HeroTitle } from '../../../shared/components';

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
