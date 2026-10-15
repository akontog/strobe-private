import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { CollaborativeGeoGebra, CommonZoneFullscreenButton } from '../../shared/components';
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
        <header className="geo-tool-page__header">
          <h1>{t('geoGebraCollaborative')}</h1>
          <p className="geo-tool-page__helper">
            {t('geoGebraCollaborativeDescriptionShort')}
          </p>
        </header>

        {canSelectRoom ? <div className="geo-tool-page__room">
          <input
            type="text"
            value={roomInput}
            onChange={(event) => setRoomInput(event.target.value)}
            placeholder={t('roomId')}
          />
          <button type="button" onClick={applyRoom}>{t('joinRoom')}</button>
        </div> : null}

        <section className="common-zone lab-zone geo-common-zone">
          <CommonZoneFullscreenButton />
          <div className="lab-workspace">
            <div className="lab-card lab-card--panel">
              <CollaborativeGeoGebra roomId={activeRoomId} sessionApp="geogebra-collab" />
            </div>
          </div>
        </section>
      </div>
    </section>
  );
}
