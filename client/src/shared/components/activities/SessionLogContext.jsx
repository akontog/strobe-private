import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { readIdentityName } from '../identity/identityStorage';

const SessionLogContext = createContext(null);

export function SessionLogProvider({ app, role = 'student', sessionId: suppliedSessionId = null, children }) {
  const [activeSessionId, setActiveSessionId] = useState(suppliedSessionId);

  useEffect(() => {
    setActiveSessionId(suppliedSessionId || null);
    if (!app || suppliedSessionId) return undefined;
    let cancelled = false;
    let requestInFlight = false;
    let timer;
    async function findActiveSession() {
      if (requestInFlight) return;
      requestInFlight = true;
      try {
        const response = await fetch(`/api/session-logs/active/${encodeURIComponent(app)}`);
        const payload = response.ok ? await response.json() : null;
        if (!cancelled) setActiveSessionId(payload?.sessionId || null);
      } catch {
        // Keep checking while the student page is open.
      } finally {
        requestInFlight = false;
      }
    }
    findActiveSession();
    timer = window.setInterval(findActiveSession, 1000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [app, suppliedSessionId]);

  const logEvent = useCallback((event, activity, data) => {
    if (!activeSessionId) return;
    const student = readIdentityName('Student');
    fetch(`/api/session-logs/${encodeURIComponent(activeSessionId)}/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event,
        student,
        activity: activity || app || 'unknown',
        data
      })
    }).catch(() => {});
  }, [activeSessionId, app]);

  const canEdit = role === 'teacher' || Boolean(activeSessionId);

  return (
    <SessionLogContext.Provider value={{ logEvent, canEdit }}>
      {children}
    </SessionLogContext.Provider>
  );
}

export function useSessionInputLogger() {
  return useContext(SessionLogContext);
}
