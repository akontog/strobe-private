import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { CollaborativeAlgebraTiles, FullScreenButton, HeroTitle } from '../../shared/components';

/** Opens the single AlgebraTiles board selected for the current class. */
export default function AlgebraTilesCollabTool({ role = 'student' }) {
  const { t } = useTranslation('interface');
  const [searchParams] = useSearchParams();
  const roomId = searchParams.get('room') || 'algebra-tiles-default';

  return (
    <section className="dashboard-page">
      <div className="dashboard-shell">
        <HeroTitle title={t('algebraTilesCollaborative')} />
        <section className="common-zone lab-zone">
          <FullScreenButton />
          <div className="lab-workspace">
            <div className="lab-card lab-card--panel">
              <CollaborativeAlgebraTiles roomId={roomId} sessionApp="geogebra-collab" role={role} />
            </div>
          </div>
        </section>
      </div>
    </section>
  );
}
