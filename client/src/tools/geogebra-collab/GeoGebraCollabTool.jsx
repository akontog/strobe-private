import React, { useState } from 'react';
import { CollaborativeGeoGebra } from '../../shared/components';
import './GeoGebraCollabTool.css';

export default function GeoGebraCollabTool() {
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
          <h1>GeoGebra Collaborative Component</h1>
          <p className="geo-tool-page__helper">
            Shared board over the existing realtime transport. Server controls permissions and broadcasts object state.
          </p>
        </header>

        <div className="geo-tool-page__room">
          <input
            type="text"
            value={roomInput}
            onChange={(event) => setRoomInput(event.target.value)}
            placeholder="Room id"
          />
          <button type="button" onClick={applyRoom}>Join room</button>
        </div>

        <CollaborativeGeoGebra roomId={activeRoomId} />
      </div>
    </section>
  );
}
