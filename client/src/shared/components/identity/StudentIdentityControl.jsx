import React, { useEffect, useRef, useState } from 'react';
import {
  randomIdentityColor,
  readIdentitySnapshot,
  writeIdentityColor,
  writeIdentityName
} from './identityStorage';
import './StudentIdentityControl.css';

function clampName(value) {
  return String(value || '').trim().replace(/\s+/g, ' ').slice(0, 80);
}

export default function StudentIdentityControl({ className = '', roleLabel = 'Student', roleControl = null }) {
  const [snapshot, setSnapshot] = useState(() => readIdentitySnapshot({
    nameFallback: roleLabel,
    colorFallback: randomIdentityColor()
  }));
  const [draftName, setDraftName] = useState(snapshot.name);
  const [isEditing, setIsEditing] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    function syncFromStorage() {
      const next = readIdentitySnapshot({
        nameFallback: roleLabel,
        colorFallback: randomIdentityColor()
      });
      setSnapshot(next);
      setDraftName((current) => (current === snapshot.name ? next.name : current));
    }

    function handleIdentityChange(event) {
      const detail = event && event.detail ? event.detail : {};
      const nextName = typeof detail.name === 'string' ? clampName(detail.name) : null;
      const nextColor = typeof detail.color === 'string' ? String(detail.color).trim() : null;

      setSnapshot((current) => ({
        name: nextName != null ? (nextName || current.name) : current.name,
        color: nextColor != null ? (nextColor || current.color) : current.color
      }));

      if (nextName != null) {
        setDraftName((current) => (current === snapshot.name ? (nextName || roleLabel) : current));
      }
    }

    window.addEventListener('strobe:identity-change', handleIdentityChange);
    window.addEventListener('storage', syncFromStorage);

    return () => {
      window.removeEventListener('strobe:identity-change', handleIdentityChange);
      window.removeEventListener('storage', syncFromStorage);
    };
  }, [snapshot.name, roleLabel]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  function commitName(nextValue) {
    const nextName = clampName(nextValue) || roleLabel;
    setDraftName(nextName);
    setSnapshot((current) => ({ ...current, name: nextName }));
    writeIdentityName(nextName);
    setIsEditing(false);
  }

  function commitColor(nextValue) {
    const nextColor = String(nextValue || '').trim() || randomIdentityColor();
    setSnapshot((current) => ({ ...current, color: nextColor }));
    writeIdentityColor(nextColor);
  }

  return (
    <div className={`student-identity-control ${className}`.trim()}>
      {roleControl}
      <div className="student-identity-control__fields">
        {isEditing ? (
          <input
            ref={inputRef}
            className="student-identity-control__input"
            type="text"
            value={draftName}
            onChange={(event) => setDraftName(event.target.value)}
            onBlur={() => commitName(draftName)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                commitName(draftName);
              }
              if (event.key === 'Escape') {
                setDraftName(snapshot.name);
                setIsEditing(false);
              }
            }}
            aria-label={`${roleLabel} name`}
            placeholder={`${roleLabel} name`}
          />
        ) : (
          <button
            type="button"
            className="student-identity-control__name"
            onClick={() => {
              setDraftName(snapshot.name);
              setIsEditing(true);
            }}
            aria-label={`Edit ${String(roleLabel).toLowerCase()} name`}
            title="Click to edit name"
          >
            {snapshot.name || roleLabel}
          </button>
        )}
        <input
          className="student-identity-control__color"
          type="color"
          value={snapshot.color || '#4ECDC4'}
          onChange={(event) => commitColor(event.target.value)}
          aria-label={`${roleLabel} color`}
          title={`${roleLabel} color`}
        />
      </div>
    </div>
  );
}
