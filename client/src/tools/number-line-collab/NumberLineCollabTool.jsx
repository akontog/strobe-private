import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FullScreenButton, HeroTitle, NumberLine } from '../../shared/components';

/** Opens the shared number line selected for the current class. */
export default function NumberLineCollabTool() {
  const { t } = useTranslation('interface');
  const [searchParams] = useSearchParams();
  const roomId = searchParams.get('room') || 'number-line-default';

  return (
    <section className="dashboard-page">
      <div className="dashboard-shell">
        <HeroTitle title={t('numberLine.title')} />
        <section className="common-zone lab-zone">
          <FullScreenButton />
          <div className="lab-workspace">
            <div className="lab-card lab-card--panel">
              <NumberLine roomId={roomId} sessionApp="geogebra-collab" />
            </div>
          </div>
        </section>
      </div>
    </section>
  );
}
