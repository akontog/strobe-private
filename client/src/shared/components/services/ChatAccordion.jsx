import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { readIdentityName } from '../menu/identityStorage';
import { Accordion } from '../layouts/Accordion';
import { useSessionInputLogger } from '../activities/SessionLogContext';
import './ChatAccordion.css';

export default function ChatAccordion({ title = '', icon = '' }) {
  const { t } = useTranslation('common');
  const session = useSessionInputLogger();
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [settingsBusy, setSettingsBusy] = useState(false);
  const isTeacher = session?.role === 'teacher';
  const refresh = useCallback(async () => {
    if (!session?.app || !session.chatEnabled) { setMessages([]); return; }
    try {
      const response = await fetch(`/api/session-logs/active/${encodeURIComponent(session.app)}/chat`, { cache: 'no-store' });
      if (response.ok) {
        const payload = await response.json();
        setMessages(payload.messages || []);
      }
    } catch { /* Retry on the next poll. */ }
  }, [session?.app, session?.chatEnabled]);

  useEffect(() => {
    refresh();
    const timer = window.setInterval(refresh, 1000);
    return () => window.clearInterval(timer);
  }, [refresh]);

  async function sendMessage(event) {
    event.preventDefault();
    const message = draft.trim();
    if (!message || busy || !session?.app) return;
    setBusy(true);
    try {
      const response = await fetch(`/api/session-logs/active/${encodeURIComponent(session.app)}/chat`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, sender: readIdentityName('Student') })
      });
      if (response.ok) {
        setDraft('');
        await refresh();
      }
    } finally { setBusy(false); }
  }

  const resolvedTitle = title || t('chat');
  const resolvedIcon = icon || '💬';

  return (
    <Accordion title={resolvedTitle} icon={resolvedIcon}>
      <section className="chat-accordion">
        {isTeacher ? (
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.75rem' }}>
            <input
              type="checkbox"
              checked={Boolean(session.chatEnabled)}
              disabled={settingsBusy}
              onChange={async (event) => {
                setSettingsBusy(true);
                try { await session.updateChatEnabled(event.currentTarget.checked); }
                catch { /* The session context restores the previous value. */ }
                finally { setSettingsBusy(false); }
              }}
            />
            <span>{t('enableChat')}</span>
          </label>
        ) : null}
        {session?.chatEnabled && session?.activeSessionId ? (
          <>
            <div className="chat-accordion__messages" aria-live="polite">
              {messages.map((item) => (
                <article className="chat-accordion__message" key={item.seq}>
                  <strong>{item.sender}</strong>: <em>{item.message}</em>
                  <time>{new Date(item.t).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</time>
                </article>
              ))}
            </div>
            <form className="chat-accordion__composer" onSubmit={sendMessage}>
              <input value={draft} onChange={(event) => setDraft(event.target.value)} maxLength={1000} aria-label={t('chatMessage')} placeholder={t('chatMessage')} />
              <button type="submit" disabled={busy || !draft.trim()}>{t('chatSend')}</button>
            </form>
          </>
        ) : (
          <p>{session?.chatEnabled ? t('chatNeedsSession') : t('chatDisabled')}</p>
        )}
      </section>
    </Accordion>
  );
}
