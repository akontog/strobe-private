import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import '../../shared/i18n';
import CommonZoneFullscreenButton from '../../shared/components/identity/CommonZoneFullscreenButton';
import {
  Accordion,
  ActivitiesMenu,
  SettingsAccordion,
  CommonSessionSettings,
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
    titleKey: 'activity1Title',
    objectiveKey: 'activity1Objective',
    geometricKey: 'activity1Geometric',
    expression: '(a+b)^2',
    expected: ['a^2', '2ab', 'b^2'],
  },
  {
    id: '2',
    code: '2.',
    titleKey: 'activity2Title',
    objectiveKey: 'activity2Objective',
    geometricKey: 'activity2Geometric',
    expression: '(a-b)^2',
    expected: ['a^2', '-2ab', 'b^2'],
  },
  {
    id: '3',
    code: '3.',
    titleKey: 'activity3Title',
    objectiveKey: 'activity3Objective',
    geometricKey: 'activity3Geometric',
    expression: '(a+b)(a-b)',
    expected: ['a^2', '-b^2', ''],
  },
  {
    id: '4',
    code: '4.',
    titleKey: 'activity4Title',
    objectiveKey: 'activity4Objective',
    geometricKey: 'activity4Geometric',
    expected: [],
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
  const { t } = useTranslation('identities');
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
    <div className="lab-card lab-card--highlight poly-expression-card identities-expression-card" aria-label={t('identityAriaLabel')}>
      <p className="lab-mini-label poly-mini-label">{t('identityLabel')}</p>
      <div className="lab-math-box poly-expression-math">
        <MathFormula
          formula={
            isProofMode
              ? '\\((a+b)^2,\\ (a-b)^2,\\ (a+b)(a-b)\\)'
              : `\\(${activeActivity.expression}\\)`
          }
        />
      </div>
      <p className="identities-note">{t(activeActivity.geometricKey)}</p>
    </div>
  );

  const resultRows = [
    { label: t('term1'), value: activeAnswers.term1, key: 'term1' },
    { label: t('term2'), value: activeAnswers.term2, key: 'term2' },
    { label: t('term3'), value: activeAnswers.term3, key: 'term3' }
  ];

  const checkIdentityAnswers = () => {
    if (isProofMode) {
      return;
    }

    const expected = activeActivity.expected;
    const allCorrect = isEquivalent(activeAnswers.term1, expected[0])
      && isEquivalent(activeAnswers.term2, expected[1])
      && isEquivalent(activeAnswers.term3, expected[2]);

    setFeedback(allCorrect ? t('correctFeedback') : t('incorrectFeedback'));
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
          <p className="identities-note">{t('completeRightSide')}</p>
          <div className="poly-team-grid poly-team-grid--full">
            <div className="poly-term-block poly-term-block--result">
              <div className="poly-term-inputs poly-term-inputs--result">
                <SharedInputRow
                  activity={`identities:${selectedActivityId}`}
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
          <button type="button" className="linear-btn" onClick={checkIdentityAnswers}>{t('check')}</button>
          </div>
          {feedback ? <p className="linear-feedback">{feedback}</p> : null}
        </div>
      ) : (
        <div className="poly-template-answer-panel">
          <p className="identities-note">{t('checkEquality')}</p>
          <div className="identities-proof-inputs">
            <SharedInputBox
              activity={`identities:${selectedActivityId}`}
              label="a"
              value={numericInputs.a}
              onChange={(event) => setNumericInputs((prev) => ({ ...prev, a: event.target.value }))}
              placeholder=""
            />
            <SharedInputBox
              activity={`identities:${selectedActivityId}`}
              label="b"
              value={numericInputs.b}
              onChange={(event) => setNumericInputs((prev) => ({ ...prev, b: event.target.value }))}
              placeholder=""
            />
          </div>

          <div className="lab-preview poly-preview-panel">
            <p className="lab-mini-label poly-mini-label">{t('numericVerification')}</p>
            {numericProof ? (
              <div className="identities-proof-results">
                <p>(a+b)^2 = {numericProof.sumSquareLeft} | a^2+2ab+b^2 = {numericProof.sumSquareRight}</p>
                <p>(a-b)^2 = {numericProof.diffSquareLeft} | a^2-2ab+b^2 = {numericProof.diffSquareRight}</p>
                <p>(a+b)(a-b) = {numericProof.squaresDiffLeft} | a^2-b^2 = {numericProof.squaresDiffRight}</p>
              </div>
            ) : (
              <p className="identities-note">{t('enterBothNumbers')}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );

  const rightPanel = (
    <aside className="lab-card lab-card--panel poly-team-card identities-geometry-card">
      <p className="lab-mini-label poly-mini-label">{t('geometricProof')}</p>
      <div className="identities-geometry-figure" aria-label={t('geometricProofAriaLabel')}>
        <div className="identities-square identities-square--a2">a²</div>
        <div className="identities-rect identities-rect--ab-1">ab</div>
        <div className="identities-rect identities-rect--ab-2">ab</div>
        <div className="identities-square identities-square--b2">b²</div>
      </div>
      <p className="identities-note">{t('geometricExplanation')}</p>
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
          title={`${activeActivity.code} ${t(activeActivity.titleKey)}`}
          subtitle={t(activeActivity.objectiveKey)}
        />
      </header>

      <section className="common-zone lab-zone linear-common-zone">
        <CommonZoneFullscreenButton />
        <div className="linear-topbar">
          <span className="poly-status-pill">{isTeacher ? t('teacherMode') : t('studentMode')}</span>
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
            title={t('activities')}
            icon="🎯"
            label={t('chooseActivity')}
            options={ACTIVITY_LIBRARY.map((activity) => ({
              value: activity.id,
              label: `${activity.code} ${t(activity.titleKey)}`
            }))}
            value={selectedActivityId}
            onChange={(nextId) => {
              setSelectedActivityId(nextId);
              setFeedback('');
            }}
          />

          <SettingsAccordion open>
            <CommonSessionSettings />
          </SettingsAccordion>

          <Accordion title={t('teacherGuide')} icon="🧭" open>
            <div className="lab-data-section data-section poly-data-menu">
              <p className="identities-note">{t('guideStep1')}</p>
              <p className="identities-note">{t('guideStep2')}</p>
              <p className="identities-note">{t('guideStep3')}</p>
            </div>
          </Accordion>
        </>
      ) : null}
    </div>
  );
}

