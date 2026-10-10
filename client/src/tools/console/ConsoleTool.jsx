import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import './ConsoleTool.css';

const POLL_INTERVAL = 2000;

function MultiSelectFilter({ label, values, selected, onChange }) {
  const { t } = useTranslation('interface');
  return (
    <label className="comm-console__filter">
      <span>{label}</span>
      <select multiple value={selected} onChange={(event) => onChange(Array.from(event.target.selectedOptions, (option) => option.value))}>
        {values.map((value) => <option key={value} value={value}>{value}</option>)}
      </select>
      <small>{t('multiSelectHint')}</small>
    </label>
  );
}

export default function ConsoleTool() {
  const { t, i18n } = useTranslation('interface');
  const [messages, setMessages] = useState([]);
  const [error, setError] = useState('');
  const [users, setUsers] = useState([]);
  const [labs, setLabs] = useState([]);
  const [types, setTypes] = useState([]);

  const refresh = useCallback(async () => {
    try {
      const response = await fetch('/admin/messages?limit=2000');
      if (!response.ok) throw new Error(t('consoleFetchFailed', { status: response.status }));
      const result = await response.json();
      setMessages(Array.isArray(result.messages) ? result.messages : []);
      setError('');
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : t('consoleUnavailable'));
    }
  }, [t]);

  useEffect(() => {
    refresh();
    const timer = window.setInterval(refresh, POLL_INTERVAL);
    return () => window.clearInterval(timer);
  }, [refresh]);

  const filterOptions = useMemo(() => {
    const userValues = new Set();
    const labValues = new Set();
    const typeValues = new Set();
    messages.forEach((message) => {
      [message.from, message.to].filter((name) => name && name !== '-').forEach((name) => userValues.add(name));
      if (message.app) labValues.add(message.app);
      if (message.event) typeValues.add(message.event);
    });
    return { users: [...userValues].sort(), labs: [...labValues].sort(), types: [...typeValues].sort() };
  }, [messages]);

  const visibleMessages = messages.filter((message) =>
    (!users.length || users.includes(message.from) || users.includes(message.to)) &&
    (!labs.length || labs.includes(message.app)) &&
    (!types.length || types.includes(message.event))
  );

  return (
    <section className="dashboard-page">
      <div className="dashboard-shell comm-console">
        <header className="comm-console__header">
          <div><p className="comm-console__eyebrow">{t('realtimeServer')}</p><h1>{t('console')}</h1>
            <p>{t('consoleIntro')}</p>
          </div>
          <button type="button" className="comm-console__refresh" onClick={refresh}>{t('refresh')}</button>
        </header>
        <div className="comm-console__filters">
          <MultiSelectFilter label={t('users')} values={filterOptions.users} selected={users} onChange={setUsers} />
          <MultiSelectFilter label={t('labs')} values={filterOptions.labs} selected={labs} onChange={setLabs} />
          <MultiSelectFilter label={t('messageTypes')} values={filterOptions.types} selected={types} onChange={setTypes} />
          <button type="button" className="comm-console__clear" onClick={() => { setUsers([]); setLabs([]); setTypes([]); }}>{t('clearFilters')}</button>
          <span className="comm-console__count">{t('messageCount', { count: visibleMessages.length })}</span>
        </div>
        {error ? <p className="comm-console__error">{error}</p> : null}
        <div className="comm-console__table-wrap">
          <table className="comm-console__table">
            <thead><tr><th>{t('time')}</th><th>{t('labs')}</th><th>{t('direction')}</th><th>{t('from')}</th><th>{t('to')}</th><th>{t('message')}</th></tr></thead>
            <tbody>{visibleMessages.map((message) => (
              <tr key={message.id}>
                <td>{new Date(message.ts).toLocaleTimeString(i18n.resolvedLanguage)}</td>
                <td><span className="comm-console__lab">{message.app}</span></td>
                <td><span className={`comm-console__direction comm-console__direction--${message.direction}`}>{message.direction === 'in' ? t('incomingServer') : t('serverOutgoing')}</span></td>
                <td>{message.from}</td><td>{message.to}</td>
                <td><details><summary>{message.event}{message.note ? ` · ${message.note}` : ''}</summary><pre>{JSON.stringify(message, null, 2)}</pre></details></td>
              </tr>
            ))}</tbody>
          </table>
          {!visibleMessages.length ? <p className="comm-console__empty">{t('noMessages')}</p> : null}
        </div>
      </div>
    </section>
  );
}
