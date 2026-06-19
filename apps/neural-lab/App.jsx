import React, { useState, useEffect } from 'react';
import { TeacherCard } from './components/TeacherCard';
import { VerticalProducts } from './components/VerticalProducts';
import { StudentTable } from './components/StudentTable';
import './App.css';

const DATASETS = {
  vehicles: {
    label: 'Οχήματα',
    emoji: '🚗',
    examples: [
      { name: 'Αυτοκίνητο', i1: 4, i2: 1, icon: '🚗' },
      { name: 'Μοτοσυκλέτα', i1: 2, i2: 1, icon: '🏍️' },
      { name: 'Φορτηγό', i1: 6, i2: 2, icon: '🚛' },
      { name: 'Ποδήλατο', i1: 2, i2: 0, icon: '🚲' }
    ]
  },
  animals: {
    label: 'Ζώα',
    emoji: '🐾',
    examples: [
      { name: 'Σκύλος', i1: 4, i2: 0, icon: '🐕' },
      { name: 'Γάτα', i1: 4, i2: 0, icon: '🐈' },
      { name: 'Ελέφαντας', i1: 4, i2: 0, icon: '🐘' },
      { name: 'Πουλί', i1: 2, i2: 0, icon: '🐦' }
    ]
  },
  foods: {
    label: 'Φαγητά',
    emoji: '🍕',
    examples: [
      { name: 'Πίτσα', i1: 8, i2: 1, icon: '🍕' },
      { name: 'Σαλάτα', i1: 2, i2: 0, icon: '🥗' },
      { name: 'Παστίτσιο', i1: 6, i2: 1, icon: '🍝' },
      { name: 'Μπέργκερ', i1: 4, i2: 1, icon: '🍔' }
    ]
  },
  fruits: {
    label: 'Φρούτα',
    emoji: '🍎',
    examples: [
      { name: 'Μήλο', i1: 1, i2: 0, icon: '🍎' },
      { name: 'Μπανάνα', i1: 1, i2: 0, icon: '🍌' },
      { name: 'Πορτοκάλι', i1: 1, i2: 0, icon: '🍊' },
      { name: 'Σταφύλι', i1: 1, i2: 0, icon: '🍇' }
    ]
  },
  digits: {
    label: 'Ψηφία',
    emoji: '🔢',
    examples: [
      { name: 'Μηδέν', i1: 0, i2: 0, icon: '0️⃣' },
      { name: 'Ένα', i1: 1, i2: 1, icon: '1️⃣' },
      { name: 'Πέντε', i1: 5, i2: 5, icon: '5️⃣' },
      { name: 'Εννέα', i1: 9, i2: 9, icon: '9️⃣' }
    ]
  }
};

const App = ({ role = 'teacher' }) => {
  const [currentDataset, setCurrentDataset] = useState('vehicles');
  const [currentExample, setCurrentExample] = useState(0);
  const [useQuestionMarks, setUseQuestionMarks] = useState(false);
  const [editWeights, setEditWeights] = useState(false);
  const [thresholdEnabled, setThresholdEnabled] = useState(false);
  const [thresholdOp, setThresholdOp] = useState('gt');
  const [thresholdValue, setThresholdValue] = useState(10);
  const [dynamicW1, setDynamicW1] = useState(2);
  const [dynamicW2, setDynamicW2] = useState(3);

  const currentExampleData = DATASETS[currentDataset].examples[currentExample];
  const i1 = currentExampleData.i1;
  const i2 = currentExampleData.i2;
  const w1 = editWeights ? dynamicW1 : 2;
  const w2 = editWeights ? dynamicW2 : 3;
  const prod1 = w1 * i1;
  const prod2 = w2 * i2;
  const total = prod1 + prod2;
  const isTeacher = role === 'teacher';
  const isScreen = role === 'screen';
  const isStudent = role === 'student';

  const threshold = thresholdEnabled && !isStudent ? {
    satisfied: thresholdOp === 'gt' ? total > thresholdValue : total < thresholdValue,
    op: thresholdOp,
    value: thresholdValue,
    total: total
  } : null;

  const handleWeightChange = (which, value) => {
    if (which === 'w1') {
      setDynamicW1(value);
    } else {
      setDynamicW2(value);
    }
  };

  useEffect(() => {
    if (window.MathJax) {
      window.MathJax.typesetPromise().catch(() => {});
    }
  }, [role, currentDataset, currentExample, useQuestionMarks, editWeights, thresholdEnabled, thresholdOp, thresholdValue, dynamicW1, dynamicW2]);

  return (
    <TeacherCard title="\\[ w_1 \\times i_1 + w_2 \\times i_2 = o \\]">
      {isScreen && (
        <>
          <div className="screen-top-bar">
            <strong>Προβολή τάξης</strong>
            <span>{DATASETS[currentDataset].emoji} {DATASETS[currentDataset].label}</span>
            <span>{currentExampleData.icon} {currentExampleData.name}</span>
            <span>i1={i1}, i2={i2}</span>
            <span>w1={w1}, w2={w2}</span>
            <span>o={total}</span>
          </div>
          <div className="operation-tree" aria-label="Δέντρο πράξεων">
            <div className="tree-level">
              <div className="tree-node tree-root">o = {total}</div>
            </div>
            <div className="tree-connect"></div>
            <div className="tree-level tree-two">
              <div className="tree-node">w1 × i1 = {prod1}</div>
              <div className="tree-node">w2 × i2 = {prod2}</div>
            </div>
          </div>
        </>
      )}

      <div className="common-zone">
        <VerticalProducts
          icon={currentExampleData.icon}
          prod1={prod1}
          prod2={prod2}
          w1={w1}
          w2={w2}
          i1={i1}
          i2={i2}
          total={total}
          useQuestionMarks={useQuestionMarks}
          editWeights={isTeacher && editWeights}
          onWeightChange={handleWeightChange}
          onRefresh={() => {}}
          threshold={threshold}
        />
      </div>

      {isTeacher && (
        <>
          <div className="toolbar">
            <button
              className={`tool-icon ${useQuestionMarks ? 'active' : ''}`}
              onClick={() => setUseQuestionMarks(!useQuestionMarks)}
              data-tooltip="Εμφάνιση ερωτηματικών (?)"
            >
              ❓ ?
            </button>
            <button
              className={`tool-icon ${editWeights ? 'active' : ''}`}
              onClick={() => {
                setEditWeights(!editWeights);
                setDynamicW1(2);
                setDynamicW2(3);
              }}
              data-tooltip="Επεξεργασία βαρών (w₁, w₂)"
            >
              ⚙️ Βάρη
            </button>
            <button
              className={`tool-icon ${thresholdEnabled ? 'active' : ''}`}
              onClick={() => setThresholdEnabled(!thresholdEnabled)}
              data-tooltip="Ενεργοποίηση ορίου"
            >
              📏 Όριο
            </button>
            {thresholdEnabled && (
              <div className="threshold-controls">
                <select
                  value={thresholdOp}
                  onChange={(e) => setThresholdOp(e.target.value)}
                >
                  <option value="gt">&gt;</option>
                  <option value="lt">&lt;</option>
                </select>
                <input
                  type="number"
                  value={thresholdValue}
                  onChange={(e) => setThresholdValue(parseInt(e.target.value, 10) || 0)}
                  step="1"
                  style={{ width: '70px' }}
                />
              </div>
            )}
          </div>

          <div className="control-bar">
            <div className="select-group">
              <label>📂 Σύνολο δεδομένων</label>
              <select
                value={currentDataset}
                onChange={(e) => {
                  setCurrentDataset(e.target.value);
                  setCurrentExample(0);
                }}
              >
                {Object.entries(DATASETS).map(([key, val]) => (
                  <option key={key} value={key}>
                    {val.emoji} {val.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="select-group">
              <label>📌 Παράδειγμα</label>
              <select
                value={currentExample}
                onChange={(e) => setCurrentExample(parseInt(e.target.value, 10))}
              >
                {DATASETS[currentDataset].examples.map((ex, idx) => (
                  <option key={idx} value={idx}>
                    {ex.icon} {ex.name} (ρόδες={ex.i1}, μηχανές={ex.i2})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </>
      )}

      {isScreen && <div className="screen-table-title">Σταθερή αναφορά τάξης</div>}

      {isStudent ? (
        <div className="student-inline-note">Μαθητής: βλέπεις τις αλγεβρικές πράξεις για το τρέχον παράδειγμα.</div>
      ) : (
        <StudentTable i1={i1} i2={i2} w1={2} w2={3} />
      )}
    </TeacherCard>
  );
};

export default App;
