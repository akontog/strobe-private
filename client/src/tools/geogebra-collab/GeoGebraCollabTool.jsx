import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Accordion, ActivitySettingsAccordion, GeoGebra } from '../../shared/components';
import GeogebraMonitorAccordion from './GeogebraMonitorAccordion';
import './GeoGebraCollabTool.css';

export default function GeoGebraCollabTool({ canSelectRoom = false }) {
  const { t } = useTranslation('interface');
  const [searchParams, setSearchParams] = useSearchParams();
  const activeRoomId = searchParams.get('room') || 'geogebra-default';
  const [roomInput, setRoomInput] = useState(activeRoomId);

  useEffect(() => {
    setRoomInput(activeRoomId);
  }, [activeRoomId]);

  function applyRoom() {
    const next = String(roomInput || '').trim();
    if (!next) {
      return;
    }
    setSearchParams({ room: next }, { replace: true });
  }

  return (
    <section className="dashboard-page">
      <div className="dashboard-shell geo-tool-page">
        <ActivitySettingsAccordion resource="collaborative-geogebra" roomId={activeRoomId} role={canSelectRoom ? 'teacher' : 'student'} defaultTitle={t('geoGebraCollaborative')} config={{ roomId: activeRoomId }}>
          <GeoGebra roomId={activeRoomId} sessionApp="geogebra-collab" />
        </ActivitySettingsAccordion>

        {canSelectRoom ? (
          <Accordion title={t('geoGebraMonitor')} icon="📊">
            <div className="geo-tool-page__controls">
              <div className="geo-tool-page__room">
                <input
                  type="text"
                  value={roomInput}
                  onChange={(event) => setRoomInput(event.target.value)}
                  placeholder={t('roomId')}
                />
                <button type="button" onClick={applyRoom}>{t('joinRoom')}</button>
              </div>
              <p className="geo-monitor-intro">{t('geoGebraMonitorIntro')}</p>
              <GeogebraMonitorAccordion />
            </div>
          </Accordion>
        ) : null}
      </div>
    </section>
  );
}
