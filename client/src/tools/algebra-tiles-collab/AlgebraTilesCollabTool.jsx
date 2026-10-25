import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AlgebraTiles, FullScreenButton, HeroTitle } from '../../shared/components';

/** Opens the single AlgebraTiles board selected for the current class. */
export default function AlgebraTilesCollabTool({ role = 'student' }) {
  const { t } = useTranslation('interface');
  const [searchParams] = useSearchParams();
  const [settingsPortalTarget, setSettingsPortalTarget] = useState(null);
  const roomId = searchParams.get('room') || 'algebra-tiles-default';

  return (
    <section className="dashboard-page">
      <div className="dashboard-shell">
        <HeroTitle title={t('algebraTilesCollaborative')} />
        <section className="common-zone lab-zone">
          <FullScreenButton />
          <div className="lab-workspace">
            <div className="lab-card lab-card--panel">
              <AlgebraTiles
                roomId={roomId}
                sessionApp="geogebra-collab"
                role={role}
                shared
                promptMode="expression"
                settingsInPortal
                settingsPortalTarget={settingsPortalTarget}
              />
            </div>
          </div>
        </section>
        <div className="algebra-tiles-settings-host" ref={setSettingsPortalTarget} />
      </div>
    </section>
  );
}
