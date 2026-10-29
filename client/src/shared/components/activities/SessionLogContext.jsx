import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { readIdentityName } from '../menu/identityStorage';

const SessionLogContext = createContext(null);

export function SessionLogProvider({
  app, // App identifier used to load the active session.
  role = 'student', // Current user role for session permissions.
  sessionId: suppliedSessionId = null, // Optional session ID supplied by the parent.
  children // Components that receive session context.
}) {
  const [activeSessionId, setActiveSessionId] = useState(suppliedSessionId);
  const [activeActivity, setActiveActivity] = useState('');
  const [chatEnabled, setChatEnabled] = useState(false);
  const [scoreVisible, setScoreVisible] = useState(true);
  const [feedbackEnabled, setFeedbackEnabled] = useState(false);
  const [studentName, setStudentName] = useState(() => readIdentityName(''));
  const joinedSessionRef = useRef('');
  const previousAppRef = useRef(app);

  useEffect(() => {
    const previousApp = previousAppRef.current;
    previousAppRef.current = app;
    if (role !== 'teacher' || !previousApp || previousApp === app) return;

    let cancelled = false;
    const closePreviousSession = async () => {
      try {
        const activeResponse = await fetch(`/api/session-logs/active/${encodeURIComponent(previousApp)}`, { cache: 'no-store' });
        const activePayload = activeResponse.ok ? await activeResponse.json() : null;
        const sessionId = activePayload?.sessionId;
        if (!sessionId || cancelled) return;

        const response = await fetch(`/teacher/sessions/${encodeURIComponent(sessionId)}/end`, { method: 'POST' });
        if (!response.ok && response.status !== 404) throw new Error('Could not end the previous session.');
        window.dispatchEvent(new CustomEvent('strobe:session-ended', { detail: { sessionId } }));
      } catch (error) {
        console.error('Unable to end the previous workshop session:', error);
      }
    };

    closePreviousSession();
    return () => { cancelled = true; };
  }, [app, role]);

  useEffect(() => {
    const refreshIdentity = (event) => setStudentName(String(event.detail?.name || readIdentityName('')).trim());
    window.addEventListener('strobe:identity-change', refreshIdentity);
    return () => window.removeEventListener('strobe:identity-change', refreshIdentity);
  }, []);

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
          setActiveSessionId(payload?.sessionId || null);
          setActiveActivity(String(payload?.activity || ''));
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

  useEffect(() => {
    if (typeof document === 'undefined') return undefined;
    const studentWaiting = role === 'student' && Boolean(app && !activeSessionId) && app !== 'cartesian-plane-collab';
    document.body.classList.toggle('session-not-started-student', studentWaiting);
    return () => document.body.classList.remove('session-not-started-student');
  }, [activeSessionId, app, role]);

  useEffect(() => {
    const handleSessionEnded = (event) => {
      const endedSessionId = event.detail?.sessionId;
      setActiveSessionId((current) => !endedSessionId || current === endedSessionId ? null : current);
    };
    window.addEventListener('strobe:session-ended', handleSessionEnded);
    return () => window.removeEventListener('strobe:session-ended', handleSessionEnded);
  }, []);

  useEffect(() => {
    if (role !== 'student' || !activeSessionId || !studentName) return;
    if (joinedSessionRef.current === activeSessionId) return;
    joinedSessionRef.current = activeSessionId;
    fetch(`/api/session-logs/${encodeURIComponent(activeSessionId)}/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event: 'student.joined', student: studentName })
    }).then((response) => {
      if (!response.ok) joinedSessionRef.current = '';
    }).catch(() => {
      joinedSessionRef.current = '';
    });
  }, [activeSessionId, role, studentName]);

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

  const endSession = useCallback(async () => {
    if (role !== 'teacher' || !app) return;
    const activeResponse = await fetch(`/api/session-logs/active/${encodeURIComponent(app)}`, { cache: 'no-store' });
    const activePayload = activeResponse.ok ? await activeResponse.json() : null;
    const sessionId = activePayload?.sessionId || activeSessionId;
    if (sessionId) {
      const response = await fetch(`/teacher/sessions/${encodeURIComponent(sessionId)}/end`, { method: 'POST' });
      if (!response.ok && response.status !== 404) throw new Error('Could not end the current session.');
    }
    setActiveSessionId(null);
    setActiveActivity('');
    window.dispatchEvent(new CustomEvent('strobe:session-ended', { detail: { sessionId } }));
  }, [activeSessionId, app, role]);

  const updateActivity = useCallback(async (activity) => {
    if (role !== 'teacher' || !activeSessionId || !activity) return;
    const response = await fetch(`/teacher/sessions/${encodeURIComponent(activeSessionId)}/activity`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ activity })
    });
    if (!response.ok) throw new Error('Could not update the session activity.');
  }, [activeSessionId, role]);

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
    <SessionLogContext.Provider value={{ logEvent, canEdit, app, role, activeSessionId, activeActivity, chatEnabled, scoreVisible, feedbackEnabled, endSession, updateActivity, updateChatEnabled, updateScoreVisible, updateFeedbackEnabled }}>
      {children}
    </SessionLogContext.Provider>
  );
}

export function useSessionInputLogger() {
  return useContext(SessionLogContext);
}
