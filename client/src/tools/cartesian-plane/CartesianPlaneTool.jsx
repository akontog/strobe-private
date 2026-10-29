import React, { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Accordion, ActivitySettingsAccordion, CartesianPlane } from '../../shared/components';

const DEFAULT_CONFIG = { minX: -10, maxX: 10, minY: -10, maxY: 10, maxPoints: null, targets: [] };

function parseTargets(value) {
  return String(value || '').split(';').map((entry) => {
    const [x, y] = entry.split(',').map(Number);
    return { x, y };
  }).filter((point) => Number.isFinite(point.x) && Number.isFinite(point.y));
}

/** Provides a collaborative Cartesian plane and a JSON activity builder. */
export default function CartesianPlaneTool({ role = 'student' }) {
  const { t } = useTranslation('interface');
  const [searchParams] = useSearchParams();
  const roomId = searchParams.get('room') || 'cartesian-plane-default';
  const isTeacher = ['teacher', 'admin'].includes(String(role).toLowerCase());
  const [config, setConfig] = useState(DEFAULT_CONFIG);
  const [targetText, setTargetText] = useState('');
  const [score, setScore] = useState(null);
  const targets = useMemo(() => parseTargets(targetText), [targetText]);
  const activityConfig = useMemo(() => ({ ...config, targets }), [config, targets]);

  function updateBound(name, value) {
    setConfig((current) => ({ ...current, [name]: Number(value) }));
  }

  function updateMaxPoints(value) {
    const parsed = value === '' ? null : Number(value);
    setConfig((current) => ({
      ...current,
      maxPoints: Number.isInteger(parsed) && parsed >= 0 ? parsed : null
    }));
  }

  return (
    <section className="dashboard-page">
      <div className="dashboard-shell">
        <ActivitySettingsAccordion resource="cartesian-plane-collab" roomId={roomId} role={role} defaultTitle={t('cartesianPlane.title')} config={activityConfig}>
          <CartesianPlane
            roomId={roomId}
            sessionApp="cartesian-plane-collab"
            {...config}
            targets={targets}
            onScoreChange={setScore}
          />
        </ActivitySettingsAccordion>
        {isTeacher ? <Accordion title={t('activityResourceSettings', { ns: 'common' })} icon="📐">
          <div className="cartesian-plane-settings">
            {[
              ['minX', t('cartesianPlane.minX')], ['maxX', t('cartesianPlane.maxX')],
              ['minY', t('cartesianPlane.minY')], ['maxY', t('cartesianPlane.maxY')]
            ].map(([name, label]) => <label key={name}>
              <span>{label}</span>
              <input type="number" value={config[name]} onChange={(event) => updateBound(name, event.target.value)} />
            </label>)}
            <label>
              <span>{t('cartesianPlane.maxPoints')}</span>
              <input
                type="number"
                min="0"
                step="1"
                value={config.maxPoints ?? ''}
                onChange={(event) => updateMaxPoints(event.target.value)}
              />
            </label>
            <label>
              <span>{t('cartesianPlane.targets')}</span>
              <input value={targetText} onChange={(event) => setTargetText(event.target.value)} placeholder="2,3; -1,4" />
            </label>
            <p>{t('cartesianPlane.targetsHelp')}</p>
            {score?.meanDistance !== null && score?.meanDistance !== undefined ? <output>{t('cartesianPlane.meanDistance', { distance: score.meanDistance.toFixed(2) })}</output> : null}
          </div>
        </Accordion> : null}
      </div>
    </section>
  );
}
