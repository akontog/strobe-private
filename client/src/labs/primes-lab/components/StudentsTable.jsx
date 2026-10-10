import React from 'react';
import { useTranslation } from 'react-i18next';

const formatNumbers = (numbers) => (numbers.length ? numbers.join(', ') : '—');

const StudentsTable = ({ students, activeStudentId, currentPrime, claimedNumbers, wrongSelectionsByNumber, studentColorById }) => {
  const { t } = useTranslation('primes');
  return (
    <section className="students-table-card">
      <div className="students-table-card__header">
        <div>
          <p>{t('table.eyebrow')}</p>
          <h2>{t('table.title')}</h2>
        </div>
        <div className="students-table-card__meta">
          <span>{t('table.base')}</span>
          <strong>{currentPrime}</strong>
        </div>
      </div>

      <div className="students-table-wrap">
        <table className="students-table">
          <thead>
            <tr>
              <th>{t('table.student')}</th>
              <th>{t('table.color')}</th>
              <th>{t('table.correct')}</th>
              <th>{t('table.wrong')}</th>
              <th>{t('table.status')}</th>
            </tr>
          </thead>
          <tbody>
            {students.map((student) => {
              const selectedCorrect = student.selectedCorrect.filter((number) => claimedNumbers.has(number));
              const selectedWrong = student.selectedWrong.filter((number) => (wrongSelectionsByNumber[number] || []).includes(student.id));
              const color = studentColorById?.[student.id] || '#3b82f6';

              return (
                <tr key={student.id} className={student.id === activeStudentId ? 'is-active-student' : ''}>
                  <td>{student.name}</td>
                  <td>
                    <span className="student-color-chip" style={{ backgroundColor: color }} title={color} />
                  </td>
                  <td>
                    <div className="number-chips number-chips--success">{formatNumbers(selectedCorrect)}</div>
                  </td>
                  <td>
                    <div className="number-chips number-chips--danger">{formatNumbers(selectedWrong)}</div>
                  </td>
                  <td>{student.id === activeStudentId ? t('table.activeNow') : t('table.viewing')}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
};

export default StudentsTable;
