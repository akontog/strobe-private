import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CollaborativeGeoGebra } from '../../shared/components';
import './GeoGebraCollabTool.css';

export default function GeoGebraCollabTool() {
  const { t } = useTranslation('interface');
  const [roomInput, setRoomInput] = useState('geogebra-default');
  const [activeRoomId, setActiveRoomId] = useState('geogebra-default');

  function applyRoom() {
    const next = String(roomInput || '').trim();
    if (!next) {
      return;
    }
    setActiveRoomId(next);
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

        <div className="geo-tool-page__room">
          <input
            type="text"
            value={roomInput}
            onChange={(event) => setRoomInput(event.target.value)}
            placeholder={t('roomId')}
          />
          <button type="button" onClick={applyRoom}>{t('joinRoom')}</button>
        </div>

        <CollaborativeGeoGebra roomId={activeRoomId} />
      </div>
    </section>
  );
}
