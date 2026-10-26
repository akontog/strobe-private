import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ActivitySettingsAccordion, NumberLine, SettingsAccordion } from '../../shared/components';

/** Opens the shared number line selected for the current class. */
export default function NumberLineCollabTool({ role = 'student' }) {
  const { t } = useTranslation('interface');
  const [searchParams] = useSearchParams();
  const roomId = searchParams.get('room') || 'number-line-default';
  const isTeacher = ['teacher', 'admin'].includes(String(role).toLowerCase());
  const [leftEnd, setLeftEnd] = useState(-10);
  const [rightEnd, setRightEnd] = useState(10);
  const [partitions, setPartitions] = useState(20);

  return (
    <section className="dashboard-page">
      <div className="dashboard-shell">
        <ActivitySettingsAccordion resource="number-line-collab" roomId={roomId} role={role} defaultTitle={t('numberLine.title')} config={{ leftEnd, rightEnd, partitions }}>
          <NumberLine roomId={roomId} sessionApp="geogebra-collab" min={leftEnd} max={rightEnd} partitions={partitions} />
        </ActivitySettingsAccordion>
        {isTeacher ? (
          <SettingsAccordion title="activityResourceSettings" icon="📏">
            <div className="number-line-settings">
              <label>
                <span>{t('numberLine.leftEnd')}</span>
                <input type="number" value={leftEnd} onChange={(event) => setLeftEnd(Number(event.target.value))} />
              </label>
              <label>
                <span>{t('numberLine.rightEnd')}</span>
                <input type="number" value={rightEnd} onChange={(event) => setRightEnd(Number(event.target.value))} />
              </label>
              <label>
                <span>{t('numberLine.partitions')}</span>
                <input type="number" min="1" max="100" step="1" value={partitions} onChange={(event) => setPartitions(Math.max(1, Math.min(100, Number(event.target.value) || 1)))} />
              </label>
            </div>
          </SettingsAccordion>
        ) : null}
      </div>
    </section>
  );
}
