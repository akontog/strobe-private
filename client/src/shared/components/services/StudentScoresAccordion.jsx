import React, { useEffect } from 'react';
import { useSessionInputLogger } from '../activities/SessionLogContext';

export default function StudentScoresAccordion({ role = 'student', studentName = '', activity = '', currentScore = 0 }) {
  const isTeacher = role === 'teacher';
  const sessionLogging = useSessionInputLogger();

  useEffect(() => {
    if (isTeacher || !studentName || !activity || !Number.isFinite(Number(currentScore))) return undefined;
    const timer = window.setTimeout(() => {
      fetch('/api/scores/current', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: studentName,
          activity,
          currentScore: Number(currentScore),
          sessionId: sessionLogging?.activeSessionId || ''
        })
      }).catch(() => {});
    }, 250);
    return () => window.clearTimeout(timer);
  }, [activity, currentScore, isTeacher, sessionLogging?.activeSessionId, studentName]);

  return null;
}

