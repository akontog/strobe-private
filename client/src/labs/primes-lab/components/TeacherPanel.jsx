import React from 'react';
import { useTranslation } from 'react-i18next';
import Accordion from './Accordion';

const TeacherPanel = ({
  currentPrime,
  primeNumbers,
  onSelectPrime,
  students,
  activeStudentId,
  onSelectActiveStudent
}) => {
  const { t } = useTranslation('primes');
  const activeStudent = students.find((student) => student.id === activeStudentId) || students[0];

  return (
    <div className="teacher-panel">
      <Accordion title={t('teacher.stepTitle')} subtitle={t('teacher.stepSubtitle')} defaultOpen>
        <div className="teacher-panel__buttons">
          {primeNumbers.map((prime) => (
            <button
              key={prime}
              type="button"
              className={prime === currentPrime ? 'teacher-chip is-active' : 'teacher-chip'}
              onClick={() => onSelectPrime(prime)}
            >
              {prime}
            </button>
          ))}
        </div>
      </Accordion>

      <Accordion title={t('teacher.activeTitle')} subtitle={t('teacher.activeSubtitle')} defaultOpen>
        <div className="teacher-panel__buttons teacher-panel__buttons--students">
          {students.map((student) => (
            <button
              key={student.id}
              type="button"
              className={student.id === activeStudentId ? 'teacher-chip is-active' : 'teacher-chip'}
              onClick={() => onSelectActiveStudent(student.id)}
            >
              {student.name}
            </button>
          ))}
        </div>
        <p className="teacher-panel__formula teacher-panel__formula--soft">
          {t('teacher.activeLabel')} <strong>{activeStudent?.name || '—'}</strong>
        </p>
      </Accordion>

      <Accordion title={t('teacher.ruleTitle')} subtitle={t('teacher.ruleSubtitle', { prime: currentPrime })} defaultOpen>
        <p className="teacher-panel__formula">
          {t('teacher.ruleText', { prime: currentPrime })}
        </p>
        <ul className="teacher-panel__goals teacher-panel__goals--compact">
          <li>{t('teacher.ruleTeacher')}</li>
          <li>{t('teacher.ruleStudents')}</li>
          <li>{t('teacher.ruleLocked')}</li>
        </ul>
      </Accordion>

      <Accordion title={t('teacher.goalTitle')} subtitle={t('teacher.goalSubtitle')} defaultOpen={false}>
        <ul className="teacher-panel__goals">
          <li>{t('teacher.goalCorrect')}</li>
          <li>{t('teacher.goalWrong')}</li>
          <li>{t('teacher.goalProgress')}</li>
        </ul>
      </Accordion>
    </div>
  );
};

export default TeacherPanel;
