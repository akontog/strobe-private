import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Accordion } from '../layouts/Accordion';

function formatScore(value) {
  const score = Number(value);
  return Number.isFinite(score) ? Number(score.toFixed(2)) : 0;
}

export default function StudentScoresAccordion({
  role = 'student',
  studentName = '',
  activity = '',
  currentScore = 0,
  manageUsers = false,
  open = false
}) {
  const { t } = useTranslation('scores');
  const [students, setStudents] = useState([]);
  const [ownScore, setOwnScore] = useState(null);
  const [error, setError] = useState('');
  const isTeacher = role === 'teacher';

  const loadScores = useCallback(async () => {
    const response = await fetch('/api/scores');
    if (!response.ok) throw new Error(t('loadFailed'));
    const payload = await response.json();
    setStudents(Array.isArray(payload.students) ? payload.students : []);
    setError('');
  }, [t]);

  useEffect(() => {
    if (!isTeacher) return undefined;
    let cancelled = false;
    const refresh = () => loadScores().catch((loadError) => {
      if (!cancelled) setError(loadError.message || t('loadFailed'));
    });
    refresh();
    const timer = window.setInterval(refresh, 5000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [isTeacher, loadScores, t]);

  useEffect(() => {
    if (isTeacher || !studentName || !activity || !Number.isFinite(Number(currentScore))) return undefined;
    const timer = window.setTimeout(async () => {
      try {
        const response = await fetch('/api/scores/current', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: studentName, activity, currentScore: Number(currentScore) })
        });
        if (!response.ok) throw new Error(t('saveFailed'));
        const payload = await response.json();
        setOwnScore(payload.student || null);
        setError('');
      } catch {
        setError(t('saveFailed'));
      }
    }, 250);
    return () => window.clearTimeout(timer);
  }, [activity, currentScore, isTeacher, studentName, t]);

  async function resetAll() {
    if (!window.confirm(t('confirmResetAll'))) return;
    try {
      const response = await fetch('/api/scores/reset', { method: 'POST' });
      if (!response.ok) throw new Error(t('actionFailed'));
      const payload = await response.json();
      setStudents(Array.isArray(payload.students) ? payload.students : []);
      setError('');
    } catch (actionError) {
      setError(actionError.message || t('actionFailed'));
    }
  }

  async function resetStudent(student) {
    if (!window.confirm(t('confirmResetStudent', { name: student.name }))) return;
    try {
      const response = await fetch(`/api/scores/students/${encodeURIComponent(student.id)}/reset`, { method: 'POST' });
      if (!response.ok) throw new Error(t('actionFailed'));
      const payload = await response.json();
      setStudents((current) => current.map((entry) => entry.id === student.id ? payload.student : entry));
      setError('');
    } catch (actionError) {
      setError(actionError.message || t('actionFailed'));
    }
  }

  async function deleteStudent(student) {
    if (!window.confirm(t('confirmDeleteStudent', { name: student.name }))) return;
    try {
      const response = await fetch(`/api/scores/students/${encodeURIComponent(student.id)}`, { method: 'DELETE' });
      if (!response.ok) throw new Error(t('actionFailed'));
      const payload = await response.json();
      setStudents(Array.isArray(payload.students) ? payload.students : []);
      setError('');
    } catch (actionError) {
      setError(actionError.message || t('actionFailed'));
    }
  }

  return (
    <Accordion title={t('title')} icon="📊" open={open}>
      {isTeacher ? (
        <div className="student-scores-panel">
          <div className="student-scores-toolbar">
            <button type="button" className="shared-action-button student-scores-refresh" onClick={() => loadScores().catch((loadError) => setError(loadError.message || t('loadFailed')))}>
              {t('refresh')}
            </button>
            <button type="button" className="shared-action-button student-scores-reset-all" onClick={resetAll}>
              {t('resetAll')}
            </button>
          </div>
          {error ? <p className="student-scores-error" role="alert">{error}</p> : null}
          <div className="data-section">
            <table className="data-table">
              <thead>
                <tr>
                  <th>{t('student')}</th>
                  <th>{t('totalScore')}</th>
                  <th>{t('currentScore')}</th>
                  <th>{t('actions')}</th>
                </tr>
              </thead>
              <tbody>
                {students.length === 0 ? (
                  <tr><td colSpan={4} className="student-scores-empty">{t('empty')}</td></tr>
                ) : students.map((student) => (
                  <tr key={student.id}>
                    <td>{student.name}</td>
                    <td>{formatScore(student.totalScore)}</td>
                    <td>{formatScore(student.currentScore)}</td>
                    <td className="student-scores-actions">
                      <button type="button" className="shared-action-button" onClick={() => resetStudent(student)}>{t('reset')}</button>
                      {manageUsers ? <button type="button" className="shared-action-button student-scores-delete" onClick={() => deleteStudent(student)}>{t('delete')}</button> : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="student-scores-own">
          <span>{t('currentScore')}: <strong>{formatScore(currentScore)}</strong></span>
          {ownScore ? <span>{t('totalScore')}: <strong>{formatScore(ownScore.totalScore)}</strong></span> : null}
          {error ? <p className="student-scores-error" role="status">{error}</p> : null}
        </div>
      )}
    </Accordion>
  );
}
