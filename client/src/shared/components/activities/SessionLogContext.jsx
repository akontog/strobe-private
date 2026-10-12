import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { readIdentityName } from '../identity/identityStorage';

const SessionLogContext = createContext(null);

export function SessionLogProvider({ app, role = 'student', sessionId: suppliedSessionId = null, children }) {
  const [activeSessionId, setActiveSessionId] = useState(suppliedSessionId);
  const [chatEnabled, setChatEnabled] = useState(false);
  const [scoreVisible, setScoreVisible] = useState(true);
  const [feedbackEnabled, setFeedbackEnabled] = useState(false);

  useEffect(() => {
    setActiveSessionId(suppliedSessionId || null);
    if (!app) return undefined;
    let cancelled = false;
    let requestInFlight = false;
    let timer;
    async function findActiveSession() {
      if (requestInFlight) return;
      requestInFlight = true;
      try {
        const response = await fetch(`/api/session-logs/active/${encodeURIComponent(app)}`);
        const payload = response.ok ? await response.json() : null;
        if (!cancelled) {
          setActiveSessionId(suppliedSessionId || payload?.sessionId || null);
          setChatEnabled(Boolean(payload?.chatEnabled));
          setScoreVisible(payload?.scoreVisible !== false);
          setFeedbackEnabled(Boolean(payload?.feedbackEnabled));
        }
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

  const updateChatEnabled = useCallback(async (enabled) => {
    if (!app || role !== 'teacher') return;
    const previous = chatEnabled;
    setChatEnabled(Boolean(enabled));
    try {
      const response = await fetch(`/api/session-logs/active/${encodeURIComponent(app)}/chat/settings`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ enabled })
      });
      if (!response.ok) throw new Error('Could not update chat setting.');
      const payload = await response.json();
      setChatEnabled(Boolean(payload.enabled));
    } catch (error) {
      setChatEnabled(previous);
      throw error;
    }
  }, [app, chatEnabled, role]);

  const updateScoreVisible = useCallback(async (visible) => {
    if (!app || role !== 'teacher') return;
    const previous = scoreVisible;
    setScoreVisible(Boolean(visible));
    try {
      const response = await fetch(`/api/session-logs/active/${encodeURIComponent(app)}/score/settings`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ visible })
      });
      if (!response.ok) throw new Error('Could not update score visibility.');
      const payload = await response.json();
      setScoreVisible(Boolean(payload.visible));
    } catch (error) {
      setScoreVisible(previous);
      throw error;
    }
  }, [app, role, scoreVisible]);

  const updateFeedbackEnabled = useCallback(async (enabled) => {
    if (!app || role !== 'teacher') return;
    const previous = feedbackEnabled;
    setFeedbackEnabled(Boolean(enabled));
    try {
      const response = await fetch(`/api/session-logs/active/${encodeURIComponent(app)}/feedback/settings`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ enabled })
      });
      if (!response.ok) throw new Error('Could not update feedback setting.');
      const payload = await response.json();
      setFeedbackEnabled(Boolean(payload.enabled));
    } catch (error) {
      setFeedbackEnabled(previous);
      throw error;
    }
  }, [app, feedbackEnabled, role]);

  return (
    <SessionLogContext.Provider value={{ logEvent, canEdit, app, role, activeSessionId, chatEnabled, scoreVisible, feedbackEnabled, updateChatEnabled, updateScoreVisible, updateFeedbackEnabled }}>
      {children}
    </SessionLogContext.Provider>
  );
}

export function useSessionInputLogger() {
  return useContext(SessionLogContext);
}
