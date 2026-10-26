import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ActivitySettingsAccordion, AlgebraTiles } from '../../shared/components';

/** Opens the single AlgebraTiles board selected for the current class. */
export default function AlgebraTilesCollabTool({ role = 'student' }) {
  const { t } = useTranslation('interface');
  const [searchParams] = useSearchParams();
  const [settingsPortalTarget, setSettingsPortalTarget] = useState(null);
  const roomId = searchParams.get('room') || 'algebra-tiles-default';

  return (
    <section className="dashboard-page">
      <div className="dashboard-shell">
        <ActivitySettingsAccordion resource="algebra-tiles-collab" roomId={roomId} role={role} defaultTitle={t('algebraTilesCollaborative')} config={{ roomId, shared: true }}>
              <AlgebraTiles
                roomId={roomId}
                sessionApp="geogebra-collab"
                role={role}
                shared
                promptMode="expression"
                settingsInPortal
                settingsPortalTarget={settingsPortalTarget}
              />
        </ActivitySettingsAccordion>
        <div className="algebra-tiles-settings-host" ref={setSettingsPortalTarget} />
      </div>
    </section>
  );
}
