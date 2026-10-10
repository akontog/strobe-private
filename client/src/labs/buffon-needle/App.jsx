import React, { useEffect, useRef } from 'react';
import { HeroTitle } from '../../shared/components';
import { studentTemplate } from './data/student-template';
import { teacherTemplate } from './data/teacher-template';
import { mountBuffonStudent } from './logic/student-logic';
import { mountBuffonTeacher } from './logic/teacher-logic';
import './App.css';

function App({ role = 'teacher' }) {
  const rootRef = useRef(null);

  useEffect(() => {
    const rootElement = rootRef.current;
    if (!rootElement) return undefined;

    if (role === 'student') {
      rootElement.innerHTML = studentTemplate;
    } else {
      rootElement.innerHTML = teacherTemplate;
    }

    const cleanup = role === 'student'
      ? mountBuffonStudent(rootElement)
      : mountBuffonTeacher(rootElement);

    if (window.MathJax && typeof window.MathJax.typesetPromise === 'function') {
      window.MathJax.typesetPromise([rootElement]).catch(() => {});
    }

    return () => {
      if (typeof cleanup === 'function') cleanup();
      rootElement.innerHTML = '';
    };
  }, [role]);

  return (
    <div className={`buffon-app ${role}`}>
      <HeroTitle
        title={role === 'student'
          ? '\u03a0\u03c1\u03bf\u03c3\u03ad\u03b3\u03b3\u03b9\u03c3\u03b7 \u03c4\u03bf\u03c5 \u03c0'
          : '\u0397 \u03b2\u03b5\u03bb\u03cc\u03bd\u03b1 \u03c4\u03bf\u03c5 Buffon'}
        subtitle={role === 'student' ? '\u0397 \u03b2\u03b5\u03bb\u03cc\u03bd\u03b1 \u03c4\u03bf\u03c5 Buffon' : ''}
      />
      <div ref={rootRef} className={`buffon-content ${role}`} />
    </div>
  );
}

export default App;
