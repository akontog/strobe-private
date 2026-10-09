import React, { useMemo, useState } from 'react';
import CommonZoneFullscreenButton from '../../shared/components/identity/CommonZoneFullscreenButton';
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
    title: 'Ξ¤ΞµΟ„ΟΞ¬Ξ³Ο‰Ξ½ΞΏ Ξ±ΞΈΟΞΏΞ―ΟƒΞΌΞ±Ο„ΞΏΟ‚',
    objective: 'Ξ£Ο…ΞΌΟ€Ξ»Ξ®ΟΟ‰ΟƒΞµ Ο„Ξ± ΞΌΞ­Ξ»Ξ· Ο„Ξ·Ο‚ Ο„Ξ±Ο…Ο„ΟΟ„Ξ·Ο„Ξ±Ο‚ (a+b)^2 = a^2 + 2ab + b^2.',
    expression: '(a+b)^2',
    expected: ['a^2', '2ab', 'b^2'],
    geometric: 'Ξ¤ΞµΟ„ΟΞ¬Ξ³Ο‰Ξ½ΞΏ Ο€Ξ»ΞµΟ…ΟΞ¬Ο‚ a+b Ο€ΞΏΟ… Ο‡Ο‰ΟΞ―Ξ¶ΞµΟ„Ξ±ΞΉ ΟƒΞµ a^2, b^2 ΞΊΞ±ΞΉ Ξ΄ΟΞΏ Ξ―ΟƒΞ± ΞΏΟΞΈΞΏΞ³ΟΞ½ΞΉΞ± ab.'
  },
  {
    id: '2',
    code: '2.',
    title: 'Ξ¤ΞµΟ„ΟΞ¬Ξ³Ο‰Ξ½ΞΏ Ξ΄ΞΉΞ±Ο†ΞΏΟΞ¬Ο‚',
    objective: 'Ξ£Ο…ΞΌΟ€Ξ»Ξ®ΟΟ‰ΟƒΞµ Ο„Ξ± ΞΌΞ­Ξ»Ξ· Ο„Ξ·Ο‚ Ο„Ξ±Ο…Ο„ΟΟ„Ξ·Ο„Ξ±Ο‚ (a-b)^2 = a^2 - 2ab + b^2.',
    expression: '(a-b)^2',
    expected: ['a^2', '-2ab', 'b^2'],
    geometric: 'ΞΞµΞΊΞΉΞ½Ξ¬ΞΌΞµ Ξ±Ο€Ο a^2 ΞΊΞ±ΞΉ Ξ±Ο†Ξ±ΞΉΟΞΏΟΞΌΞµ Ξ΄ΟΞΏ ΞΏΟΞΈΞΏΞ³ΟΞ½ΞΉΞ± ab, ΞµΞ½Ο Ο€ΟΞΏΟƒΞΈΞ­Ο„ΞΏΟ…ΞΌΞµ Ο€Ξ―ΟƒΟ‰ Ο„ΞΏ b^2 Ξ³ΞΉΞ± Ξ΄ΞΉΟΟΞΈΟ‰ΟƒΞ· Ξ΄ΞΉΟ€Ξ»Ξ®Ο‚ Ξ±Ο†Ξ±Ξ―ΟΞµΟƒΞ·Ο‚.'
  },
  {
    id: '3',
    code: '3.',
    title: 'Ξ”ΞΉΞ±Ο†ΞΏΟΞ¬ Ο„ΞµΟ„ΟΞ±Ξ³ΟΞ½Ο‰Ξ½',
    objective: 'Ξ£Ο…ΞΌΟ€Ξ»Ξ®ΟΟ‰ΟƒΞµ Ο„Ξ± ΞΌΞ­Ξ»Ξ· Ο„Ξ·Ο‚ Ο„Ξ±Ο…Ο„ΟΟ„Ξ·Ο„Ξ±Ο‚ (a+b)(a-b) = a^2 - b^2.',
    expression: '(a+b)(a-b)',
    expected: ['a^2', '-b^2', ''],
    geometric: 'Ξ¤ΞΏ ΞµΞΌΞ²Ξ±Ξ΄Ο ΞµΞ½ΟΟ‚ ΞΏΟΞΈΞΏΞ³Ο‰Ξ½Ξ―ΞΏΟ… (a+b)(a-b) ΞΉΟƒΞΏΟΟ„Ξ±ΞΉ ΞΌΞµ Ο„Ξ· Ξ΄ΞΉΞ±Ο†ΞΏΟΞ¬ Ξ΄ΟΞΏ Ο„ΞµΟ„ΟΞ±Ξ³ΟΞ½Ο‰Ξ½ a^2 ΞΊΞ±ΞΉ b^2.'
  },
  {
    id: '4',
    code: '4.',
    title: 'Ξ“ΞµΟ‰ΞΌΞµΟ„ΟΞΉΞΊΞ® Ξ±Ο€ΟΞ΄ΞµΞΉΞΎΞ·',
    objective: 'Ξ•Ο€Ξ­Ξ»ΞµΞΎΞµ Ο„ΞΉΞΌΞ­Ο‚ Ξ³ΞΉΞ± a, b ΞΊΞ±ΞΉ Ξ΄ΞµΟ‚ Ξ±ΟΞΉΞΈΞΌΞ·Ο„ΞΉΞΊΞ® ΞµΟ€ΞΉΞ²ΞµΞ²Ξ±Ξ―Ο‰ΟƒΞ· Ο„Ο‰Ξ½ Ξ³ΞµΟ‰ΞΌΞµΟ„ΟΞΉΞΊΟΞ½ Ξ±Ο€ΞΏΞ΄ΞµΞ―ΞΎΞµΟ‰Ξ½.',
    expression: 'Geometric Proof',
    expected: [],
    geometric: 'Ξ‘ΟΞΉΞΈΞΌΞ·Ο„ΞΉΞΊΟΟ‚ Ξ­Ξ»ΞµΞ³Ο‡ΞΏΟ‚ Ο„Ο‰Ξ½ Ο„Ξ±Ο…Ο„ΞΏΟ„Ξ®Ο„Ο‰Ξ½ ΞΌΞ­ΟƒΟ‰ ΞµΞΌΞ²Ξ±Ξ΄ΟΞ½ Ξ³ΞΉΞ± ΟƒΟ…Ξ³ΞΊΞµΞΊΟΞΉΞΌΞ­Ξ½ΞµΟ‚ Ο„ΞΉΞΌΞ­Ο‚ a ΞΊΞ±ΞΉ b.'
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
    <div className="lab-card lab-card--highlight poly-expression-card identities-expression-card" aria-label="Ο„Ξ±Ο…Ο„ΟΟ„Ξ·Ο„Ξ±">
      <p className="lab-mini-label poly-mini-label">Ξ¤Ξ±Ο…Ο„ΟΟ„Ξ·Ο„Ξ±</p>
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
    { label: '1ΞΏΟ‚ ΟΟΞΏΟ‚', value: activeAnswers.term1, key: 'term1' },
    { label: '2ΞΏΟ‚ ΟΟΞΏΟ‚', value: activeAnswers.term2, key: 'term2' },
    { label: '3ΞΏΟ‚ ΟΟΞΏΟ‚', value: activeAnswers.term3, key: 'term3' }
  ];

  const checkIdentityAnswers = () => {
    if (isProofMode) {
      return;
    }

    const expected = activeActivity.expected;
    const allCorrect = isEquivalent(activeAnswers.term1, expected[0])
      && isEquivalent(activeAnswers.term2, expected[1])
      && isEquivalent(activeAnswers.term3, expected[2]);

    setFeedback(allCorrect ? 'Ξ£Ο‰ΟƒΟ„Ξ¬! Ξ— Ο„Ξ±Ο…Ο„ΟΟ„Ξ·Ο„Ξ± ΞµΞ―Ξ½Ξ±ΞΉ Ο€Ξ»Ξ®ΟΞ·Ο‚.' : 'ΞΞ»ΞµΞ³ΞΎΞµ ΞΎΞ±Ξ½Ξ¬ Ο„ΞΏΟ…Ο‚ ΟΟΞΏΟ…Ο‚ Ο„Ξ·Ο‚ Ξ±Ξ½Ξ¬Ο€Ο„Ο…ΞΎΞ·Ο‚.');
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
          <p className="identities-note">Ξ£Ο…ΞΌΟ€Ξ»Ξ®ΟΟ‰ΟƒΞµ Ο„ΞΏ Ξ΄ΞµΞΎΞ― ΞΌΞ­Ξ»ΞΏΟ‚ Ο„Ξ·Ο‚ Ο„Ξ±Ο…Ο„ΟΟ„Ξ·Ο„Ξ±Ο‚.</p>
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
            <button type="button" className="linear-btn" onClick={checkIdentityAnswers}>ΞΞ»ΞµΞ³Ο‡ΞΏΟ‚</button>
          </div>
          {feedback ? <p className="linear-feedback">{feedback}</p> : null}
        </div>
      ) : (
        <div className="poly-template-answer-panel">
          <p className="identities-note">Ξ’Ξ¬Ξ»Ξµ Ο„ΞΉΞΌΞ­Ο‚ ΞΊΞ±ΞΉ Ξ­Ξ»ΞµΞ³ΞΎΞµ ΞΉΟƒΟΟ„Ξ·Ο„Ξ± Ξ±ΟΞΉΟƒΟ„ΞµΟΞΏΟ ΞΊΞ±ΞΉ Ξ΄ΞµΞΎΞΉΞΏΟ ΞΌΞ­Ξ»ΞΏΟ…Ο‚.</p>
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
            <p className="lab-mini-label poly-mini-label">Ξ‘ΟΞΉΞΈΞΌΞ·Ο„ΞΉΞΊΞ® ΞµΟ€Ξ±Ξ»Ξ®ΞΈΞµΟ…ΟƒΞ·</p>
            {numericProof ? (
              <div className="identities-proof-results">
                <p>(a+b)^2 = {numericProof.sumSquareLeft} | a^2+2ab+b^2 = {numericProof.sumSquareRight}</p>
                <p>(a-b)^2 = {numericProof.diffSquareLeft} | a^2-2ab+b^2 = {numericProof.diffSquareRight}</p>
                <p>(a+b)(a-b) = {numericProof.squaresDiffLeft} | a^2-b^2 = {numericProof.squaresDiffRight}</p>
              </div>
            ) : (
              <p className="identities-note">Ξ£Ο…ΞΌΟ€Ξ»Ξ®ΟΟ‰ΟƒΞµ ΞΊΞ±ΞΉ Ο„Ξ± Ξ΄ΟΞΏ Ο€ΞµΞ΄Ξ―Ξ± ΞΌΞµ Ξ±ΟΞΉΞΈΞΌΞΏΟΟ‚.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );

  const rightPanel = (
    <aside className="lab-card lab-card--panel poly-team-card identities-geometry-card">
      <p className="lab-mini-label poly-mini-label">Ξ“ΞµΟ‰ΞΌΞµΟ„ΟΞΉΞΊΞ® Ξ±Ο€ΟΞ΄ΞµΞΉΞΎΞ·</p>
      <div className="identities-geometry-figure" aria-label="geometric proof blocks">
        <div className="identities-square identities-square--a2">aΒ²</div>
        <div className="identities-rect identities-rect--ab-1">ab</div>
        <div className="identities-rect identities-rect--ab-2">ab</div>
        <div className="identities-square identities-square--b2">bΒ²</div>
      </div>
      <p className="identities-note">Ξ¤ΞΏ ΟƒΟ‡Ξ®ΞΌΞ± Ξ΄ΞµΞ―Ο‡Ξ½ΞµΞΉ Ο€ΟΟ‚ Ο„ΞΏ (a+b)^2 Ξ΄ΞΉΞ±ΟƒΟ€Ξ¬Ο„Ξ±ΞΉ ΟƒΞµ a^2 + 2ab + b^2.</p>
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
            title="Ξ”ΟΞ±ΟƒΟ„Ξ·ΟΞΉΟΟ„Ξ·Ο„Ξ±"
            icon="π―"
            label="Ξ•Ο€ΞΉΞ»ΞΏΞ³Ξ® Ξ΄ΟΞ±ΟƒΟ„Ξ·ΟΞΉΟΟ„Ξ·Ο„Ξ±Ο‚"
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

          <Accordion title="Ξ”ΞΉΞ΄Ξ±ΞΊΟ„ΞΉΞΊΟΟ‚ ΞΏΞ΄Ξ·Ξ³ΟΟ‚" icon="π§­" open>
            <div className="lab-data-section data-section poly-data-menu">
              <p className="identities-note">1. Ξ ΟΟΟ„Ξ± ΞΏΞΉ ΞΌΞ±ΞΈΞ·Ο„Ξ­Ο‚ ΟƒΟ…ΞΌΟ€Ξ»Ξ·ΟΟΞ½ΞΏΟ…Ξ½ Ξ±Ξ»Ξ³ΞµΞ²ΟΞΉΞΊΞ¬ Ο„Ξ·Ξ½ Ξ±Ξ½Ξ¬Ο€Ο„Ο…ΞΎΞ·.</p>
              <p className="identities-note">2. ΞΟ€ΞµΞΉΟ„Ξ± ΟƒΟ…Ξ½Ξ΄Ξ­ΞΏΟ…Ξ½ ΞΊΞ¬ΞΈΞµ ΟΟΞΏ ΞΌΞµ ΞµΞΌΞ²Ξ±Ξ΄Ξ¬ Ο„ΞµΟ„ΟΞ±Ξ³ΟΞ½Ο‰Ξ½/ΞΏΟΞΈΞΏΞ³Ο‰Ξ½Ξ―Ο‰Ξ½.</p>
              <p className="identities-note">3. Ξ¤Ξ­Ξ»ΞΏΟ‚ Ο‡ΟΞ·ΟƒΞΉΞΌΞΏΟ€ΞΏΞΉΞΏΟΞ½ Ξ±ΟΞΉΞΈΞΌΞ·Ο„ΞΉΞΊΞ­Ο‚ Ο„ΞΉΞΌΞ­Ο‚ Ξ³ΞΉΞ± ΞµΟ€ΞΉΞ²ΞµΞ²Ξ±Ξ―Ο‰ΟƒΞ· Ο„Ξ·Ο‚ Ξ³ΞµΟ‰ΞΌΞµΟ„ΟΞΉΞΊΞ®Ο‚ Ξ±Ο€ΟΞ΄ΞµΞΉΞΎΞ·Ο‚.</p>
            </div>
          </Accordion>
        </>
      ) : null}
    </div>
  );
}

