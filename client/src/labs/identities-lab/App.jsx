import React, { useMemo, useState } from 'react';
import CommonZoneFullscreenButton from '../../shared/components/CommonZoneFullscreenButton';
import {
  Accordion,
  ActivitiesMenu,
  HeroTitle,
  MathFormula,
  SharedCommonZoneLayout,
  SharedInputBox,
  SharedInputRow
} from '../../shared/components';
import './App.css';

const ACTIVITY_LIBRARY = [
  {
    id: '1',
    code: '1.',
    title: 'Τετράγωνο αθροίσματος',
    objective: 'Συμπλήρωσε τα μέλη της ταυτότητας (a+b)^2 = a^2 + 2ab + b^2.',
    expression: '(a+b)^2',
    expected: ['a^2', '2ab', 'b^2'],
    geometric: 'Τετράγωνο πλευράς a+b που χωρίζεται σε a^2, b^2 και δύο ίσα ορθογώνια ab.'
  },
  {
    id: '2',
    code: '2.',
    title: 'Τετράγωνο διαφοράς',
    objective: 'Συμπλήρωσε τα μέλη της ταυτότητας (a-b)^2 = a^2 - 2ab + b^2.',
    expression: '(a-b)^2',
    expected: ['a^2', '-2ab', 'b^2'],
    geometric: 'Ξεκινάμε από a^2 και αφαιρούμε δύο ορθογώνια ab, ενώ προσθέτουμε πίσω το b^2 για διόρθωση διπλής αφαίρεσης.'
  },
  {
    id: '3',
    code: '3.',
    title: 'Διαφορά τετραγώνων',
    objective: 'Συμπλήρωσε τα μέλη της ταυτότητας (a+b)(a-b) = a^2 - b^2.',
    expression: '(a+b)(a-b)',
    expected: ['a^2', '-b^2', ''],
    geometric: 'Το εμβαδό ενός ορθογωνίου (a+b)(a-b) ισούται με τη διαφορά δύο τετραγώνων a^2 και b^2.'
  },
  {
    id: '4',
    code: '4.',
    title: 'Γεωμετρική απόδειξη',
    objective: 'Επέλεξε τιμές για a, b και δες αριθμητική επιβεβαίωση των γεωμετρικών αποδείξεων.',
    expression: 'Geometric Proof',
    expected: [],
    geometric: 'Αριθμητικός έλεγχος των ταυτοτήτων μέσω εμβαδών για συγκεκριμένες τιμές a και b.'
  }
];

function normalize(value) {
  return String(value || '').trim().replace(/\s+/g, '');
}

function isEquivalent(actual, expected) {
  if (!expected) {
    return normalize(actual) === '';
  }
  return normalize(actual) === normalize(expected);
}

function toNumber(value) {
  const normalized = String(value || '').trim().replace(',', '.');
  if (!normalized) {
    return null;
  }
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

export default function App({ role = 'student' }) {
  const isTeacher = role === 'teacher';
  const [selectedActivityId, setSelectedActivityId] = useState(ACTIVITY_LIBRARY[0].id);
  const [answersByActivity, setAnswersByActivity] = useState({});
  const [numericInputs, setNumericInputs] = useState({ a: '', b: '' });
  const [feedback, setFeedback] = useState('');

  const activeActivity = useMemo(
    () => ACTIVITY_LIBRARY.find((activity) => activity.id === selectedActivityId) || ACTIVITY_LIBRARY[0],
    [selectedActivityId]
  );

  const activeAnswers = answersByActivity[selectedActivityId] || { term1: '', term2: '', term3: '' };
  const isProofMode = selectedActivityId === '4';

  const leftPanel = (
    <div className="lab-card lab-card--highlight poly-expression-card identities-expression-card" aria-label="ταυτότητα">
      <p className="lab-mini-label poly-mini-label">Ταυτότητα</p>
      <div className="lab-math-box poly-expression-math">
        <MathFormula
          formula={
            isProofMode
              ? '\\((a+b)^2,\\ (a-b)^2,\\ (a+b)(a-b)\\)'
              : `\\(${activeActivity.expression}\\)`
          }
        />
      </div>
      <p className="identities-note">{activeActivity.geometric}</p>
    </div>
  );

  const resultRows = [
    { label: '1ος όρος', value: activeAnswers.term1, key: 'term1' },
    { label: '2ος όρος', value: activeAnswers.term2, key: 'term2' },
    { label: '3ος όρος', value: activeAnswers.term3, key: 'term3' }
  ];

  const checkIdentityAnswers = () => {
    if (isProofMode) {
      return;
    }

    const expected = activeActivity.expected;
    const allCorrect = isEquivalent(activeAnswers.term1, expected[0])
      && isEquivalent(activeAnswers.term2, expected[1])
      && isEquivalent(activeAnswers.term3, expected[2]);

    setFeedback(allCorrect ? 'Σωστά! Η ταυτότητα είναι πλήρης.' : 'Έλεγξε ξανά τους όρους της ανάπτυξης.');
  };

  const aValue = toNumber(numericInputs.a);
  const bValue = toNumber(numericInputs.b);

  const numericProof = useMemo(() => {
    if (aValue === null || bValue === null) {
      return null;
    }

    const sumSquareLeft = (aValue + bValue) ** 2;
    const sumSquareRight = (aValue ** 2) + (2 * aValue * bValue) + (bValue ** 2);

    const diffSquareLeft = (aValue - bValue) ** 2;
    const diffSquareRight = (aValue ** 2) - (2 * aValue * bValue) + (bValue ** 2);

    const squaresDiffLeft = (aValue + bValue) * (aValue - bValue);
    const squaresDiffRight = (aValue ** 2) - (bValue ** 2);

    return {
      sumSquareLeft,
      sumSquareRight,
      diffSquareLeft,
      diffSquareRight,
      squaresDiffLeft,
      squaresDiffRight
    };
  }, [aValue, bValue]);

  const centerPanel = (
    <div className="lab-card lab-card--panel poly-team-card identities-team-card">
      {!isProofMode ? (
        <div className="poly-template-answer-panel">
          <p className="identities-note">Συμπλήρωσε το δεξί μέλος της ταυτότητας.</p>
          <div className="poly-team-grid poly-team-grid--full">
            <div className="poly-term-block poly-term-block--result">
              <div className="poly-term-inputs poly-term-inputs--result">
                <SharedInputRow
                  rowLabel="R"
                  tokens={['+', '+', '']}
                  defaultPlaceholder=""
                  boxes={resultRows.map((row) => ({
                    key: row.key,
                    label: row.label,
                    value: row.value,
                    onChange: (event) => {
                      const nextValue = event.target.value;
                      setAnswersByActivity((current) => ({
                        ...current,
                        [selectedActivityId]: {
                          ...(current[selectedActivityId] || { term1: '', term2: '', term3: '' }),
                          [row.key]: nextValue
                        }
                      }));
                    }
                  }))}
                />
              </div>
            </div>
          </div>
          <div className="identities-actions">
            <button type="button" className="linear-btn" onClick={checkIdentityAnswers}>Έλεγχος</button>
          </div>
          {feedback ? <p className="linear-feedback">{feedback}</p> : null}
        </div>
      ) : (
        <div className="poly-template-answer-panel">
          <p className="identities-note">Βάλε τιμές και έλεγξε ισότητα αριστερού και δεξιού μέλους.</p>
          <div className="identities-proof-inputs">
            <SharedInputBox
              label="a"
              value={numericInputs.a}
              onChange={(event) => setNumericInputs((prev) => ({ ...prev, a: event.target.value }))}
              placeholder=""
            />
            <SharedInputBox
              label="b"
              value={numericInputs.b}
              onChange={(event) => setNumericInputs((prev) => ({ ...prev, b: event.target.value }))}
              placeholder=""
            />
          </div>

          <div className="lab-preview poly-preview-panel">
            <p className="lab-mini-label poly-mini-label">Αριθμητική επαλήθευση</p>
            {numericProof ? (
              <div className="identities-proof-results">
                <p>(a+b)^2 = {numericProof.sumSquareLeft} | a^2+2ab+b^2 = {numericProof.sumSquareRight}</p>
                <p>(a-b)^2 = {numericProof.diffSquareLeft} | a^2-2ab+b^2 = {numericProof.diffSquareRight}</p>
                <p>(a+b)(a-b) = {numericProof.squaresDiffLeft} | a^2-b^2 = {numericProof.squaresDiffRight}</p>
              </div>
            ) : (
              <p className="identities-note">Συμπλήρωσε και τα δύο πεδία με αριθμούς.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );

  const rightPanel = (
    <aside className="lab-card lab-card--panel poly-team-card identities-geometry-card">
      <p className="lab-mini-label poly-mini-label">Γεωμετρική απόδειξη</p>
      <div className="identities-geometry-figure" aria-label="geometric proof blocks">
        <div className="identities-square identities-square--a2">a²</div>
        <div className="identities-rect identities-rect--ab-1">ab</div>
        <div className="identities-rect identities-rect--ab-2">ab</div>
        <div className="identities-square identities-square--b2">b²</div>
      </div>
      <p className="identities-note">Το σχήμα δείχνει πώς το (a+b)^2 διασπάται σε a^2 + 2ab + b^2.</p>
      <div className="lab-math-box lab-math-box--compact poly-expression-math poly-expression-math--small">
        <MathFormula formula="\\((a+b)^2=a^2+2ab+b^2\\)" />
      </div>
      <div className="lab-math-box lab-math-box--compact poly-expression-math poly-expression-math--small">
        <MathFormula formula="\\((a-b)^2=a^2-2ab+b^2\\)" />
      </div>
      <div className="lab-math-box lab-math-box--compact poly-expression-math poly-expression-math--small">
        <MathFormula formula="\\((a+b)(a-b)=a^2-b^2\\)" />
      </div>
    </aside>
  );

  return (
    <div className="linear-lab-shell identities-lab-shell">
      <header className="linear-lab-header">
        <HeroTitle
          title={`${activeActivity.code} ${activeActivity.title}`}
          subtitle={activeActivity.objective}
        />
      </header>

      <section className="common-zone lab-zone linear-common-zone">
        <CommonZoneFullscreenButton />
        <div className="linear-topbar">
          <span className="poly-status-pill">{isTeacher ? 'Teacher mode' : 'Student mode'}</span>
        </div>

        <SharedCommonZoneLayout
          className="linear-neural-zone identities-neural-zone"
          leftPanel={leftPanel}
          centerPanel={centerPanel}
          rightPanel={rightPanel}
        />
      </section>

      {isTeacher ? (
        <>
          <ActivitiesMenu
            title="Δραστηριότητα"
            icon="🎯"
            label="Επιλογή δραστηριότητας"
            options={ACTIVITY_LIBRARY.map((activity) => ({
              value: activity.id,
              label: `${activity.code} ${activity.title}`
            }))}
            value={selectedActivityId}
            onChange={(nextId) => {
              setSelectedActivityId(nextId);
              setFeedback('');
            }}
          />

          <Accordion title="Διδακτικός οδηγός" icon="🧭" open>
            <div className="lab-data-section data-section poly-data-menu">
              <p className="identities-note">1. Πρώτα οι μαθητές συμπληρώνουν αλγεβρικά την ανάπτυξη.</p>
              <p className="identities-note">2. Έπειτα συνδέουν κάθε όρο με εμβαδά τετραγώνων/ορθογωνίων.</p>
              <p className="identities-note">3. Τέλος χρησιμοποιούν αριθμητικές τιμές για επιβεβαίωση της γεωμετρικής απόδειξης.</p>
            </div>
          </Accordion>
        </>
      ) : null}
    </div>
  );
}
