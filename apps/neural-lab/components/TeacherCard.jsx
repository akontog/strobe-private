import React from 'react';

export const TeacherCard = ({ children, title }) => (
  <div className="teacher-card">
    {title && (
      <div className="hero-title">
        <div className="main-equation">{title}</div>
      </div>
    )}
    {children}
  </div>
);
