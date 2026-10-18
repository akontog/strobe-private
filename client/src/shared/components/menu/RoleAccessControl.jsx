import React, { useState } from 'react';

export default function RoleAccessControl({ role, roles = [], username = '', connected, onLogin, onRoleChange, labels }) {
  const [isOpen, setIsOpen] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [draftUsername, setDraftUsername] = useState('');
  const [draftPassword, setDraftPassword] = useState('');
  const [requestedRole, setRequestedRole] = useState('staff');
  const [error, setError] = useState('');

  async function submit(event) {
    event.preventDefault();
    setError('');
    const result = await onLogin(draftUsername, draftPassword, requestedRole);
    if (result?.error) {
      setError(result.error);
      return;
    }
    setDraftPassword('');
    setShowLogin(false);
    setIsOpen(false);
  }

  async function selectRole(nextRole) {
    await onRoleChange(nextRole);
    setShowLogin(false);
    setIsOpen(false);
  }

  function requestRole(nextRole) {
    if (roles.includes(nextRole)) {
      selectRole(nextRole);
      return;
    }
    setRequestedRole(nextRole);
    setError('');
    setShowLogin(true);
  }

  const roleLabel = role === 'student'
    ? labels.student
    : roles
      .filter((availableRole) => availableRole === 'teacher' || availableRole === 'admin')
      .map((availableRole) => labels[availableRole])
      .join(' | ');

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
        {roleLabel}
        <span className="role-access-control__chevron" aria-hidden="true">▾</span>
      </button>
      {isOpen ? (
        <div className="role-access-control__menu">
          <button type="button" onClick={() => selectRole('student')}>{labels.student}</button>
          {roles.length === 0 ? (
            <button type="button" onClick={() => requestRole('staff')}>{labels.teacher} | {labels.admin}</button>
          ) : (
            <>
              {role !== 'teacher' && roles.includes('teacher') ? (
                <button type="button" onClick={() => requestRole('teacher')}>{labels.teacher}</button>
              ) : null}
              {role !== 'admin' && roles.includes('admin') ? (
                <button type="button" onClick={() => requestRole('admin')}>{labels.admin}</button>
              ) : null}
            </>
          )}
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
