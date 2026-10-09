import React, { useEffect, useRef, useState } from 'react';

export default function CommonZoneFullscreenButton() {
  const buttonRef = useRef(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const syncState = () => {
      const zone = buttonRef.current?.closest('.common-zone');
      setIsFullscreen(Boolean(zone && document.fullscreenElement === zone));
    };
    document.addEventListener('fullscreenchange', syncState);
    return () => document.removeEventListener('fullscreenchange', syncState);
  }, []);

  async function toggleFullscreen() {
    const zone = buttonRef.current?.closest('.common-zone');
    if (!zone) return;
    try {
      if (document.fullscreenElement === zone) await document.exitFullscreen();
      else await zone.requestFullscreen();
    } catch (error) {
      console.error('Unable to change common-zone fullscreen state:', error);
    }
  }

  const label = isFullscreen ? 'Έξοδος από πλήρη οθόνη' : 'Μετάβαση σε πλήρη οθόνη';
  return (
    <button ref={buttonRef} type="button" className="common-zone-fullscreen-toggle"
      aria-label={label} aria-pressed={isFullscreen} title={label} onClick={toggleFullscreen}>
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        {isFullscreen
          ? <path d="M8 3v5H3M3 8l6-6m7 1v5h5m0 0-6-6M8 21v-5H3m0 0 6 6m7-1v-5h5m0 0-6 6" />
          : <path d="M3 9V3h6M3 3l7 7m5-7h6v6m0-6-7 7M3 15v6h6m-6 0 7-7m11 1v6h-6m6 0-7-7" />}
      </svg>
    </button>
  );
}
