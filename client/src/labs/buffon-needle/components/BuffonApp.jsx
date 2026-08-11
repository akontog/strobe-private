import React, { useEffect, useRef } from 'react';
import { studentTemplate } from '../data/student-template';
import { teacherTemplate } from '../data/teacher-template';
import { mountBuffonStudent } from './student-logic';
import { mountBuffonTeacher } from './teacher-logic';

function BuffonApp({ role = 'teacher' }) {
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

  return <div ref={rootRef} />;
}

export default BuffonApp;
