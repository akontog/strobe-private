import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { readIdentityName } from '../identity/identityStorage';
import { Accordion } from '../layouts/Accordion';
import { useSessionInputLogger } from './SessionLogContext';
import './chat-accordion.css';

export default function ChatAccordion() {
  const { t } = useTranslation('common');
  const session = useSessionInputLogger();
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
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

  if (!session?.chatEnabled || !session?.activeSessionId) return null;
  return (
    <Accordion title={t('chat')} icon="💬">
      <section className="chat-accordion">
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
      </section>
    </Accordion>
  );
}
