import React, { useState } from 'react';

export default function RoleAccessControl({ role, username = '', connected, onLogin, onRoleChange, labels }) {
  const [isOpen, setIsOpen] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [draftUsername, setDraftUsername] = useState('');
  const [draftPassword, setDraftPassword] = useState('');
  const [error, setError] = useState('');

  async function submit(event) {
    event.preventDefault();
    setError('');
    const result = await onLogin(draftUsername, draftPassword);
    if (result?.error) {
      setError(result.error);
      return;
    }
    setDraftPassword('');
    setShowLogin(false);
    setIsOpen(false);
  }

  function selectStudent() {
    onRoleChange('student');
    setShowLogin(false);
    setIsOpen(false);
  }

  function selectTeacher() {
    if (role === 'teacher') {
      setShowLogin(false);
      setIsOpen(false);
      return;
    }
    setShowLogin(true);
  }

  return (
    <div className="role-access-control">
      <span
        className={`student-identity-control__badge ${connected ? 'is-connected' : 'is-disconnected'}`}
        role="img"
        title={connected ? labels.connected : labels.disconnected}
        aria-label={connected ? labels.connected : labels.disconnected}
      />
      <button
        type="button"
        className="role-access-control__button"
        onClick={() => {
          setShowLogin(false);
          setIsOpen((value) => !value);
        }}
        aria-expanded={isOpen}
      >
        {role === 'teacher' ? `${labels.teacher}: ${username}` : labels.student}
        <span className="role-access-control__chevron" aria-hidden="true">▾</span>
      </button>
      {isOpen ? (
        <div className="role-access-control__menu">
          <button type="button" onClick={selectStudent}>{labels.student}</button>
          <button type="button" onClick={selectTeacher}>{labels.teacher}</button>
          {showLogin ? (
            <form className="role-access-control__login" onSubmit={submit}>
              <input autoComplete="username" value={draftUsername} onChange={(event) => setDraftUsername(event.target.value)} placeholder={labels.username} aria-label={labels.username} required />
              <input autoComplete="current-password" type="password" value={draftPassword} onChange={(event) => setDraftPassword(event.target.value)} placeholder={labels.password} aria-label={labels.password} required />
              <button type="submit">{labels.login}</button>
              {error ? <span role="alert">{error}</span> : null}
            </form>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
