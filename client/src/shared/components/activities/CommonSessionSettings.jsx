import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSessionInputLogger } from './SessionLogContext';
import './common-session-settings.css';

export default function CommonSessionSettings({ feedbackEnabled, onFeedbackChange, feedbackDescription = '' }) {
  const { t } = useTranslation('common');
  const session = useSessionInputLogger();
  const [saving, setSaving] = useState(false);
  if (session?.role !== 'teacher') return null;

  async function update(event, action, previousValue) {
    const checkbox = event.currentTarget;
    setSaving(true);
    try { await action(checkbox.checked); }
    catch { checkbox.checked = previousValue; }
    finally { setSaving(false); }
  }

  async function updateFeedback(event) {
    const enabled = event.currentTarget.checked;
    const previousValue = typeof feedbackEnabled === 'boolean' ? feedbackEnabled : session.feedbackEnabled;
    setSaving(true);
    try {
      onFeedbackChange?.(enabled);
      await session.updateFeedbackEnabled(enabled);
    } catch {
      onFeedbackChange?.(previousValue);
    } finally {
      setSaving(false);
    }
  }

  const currentFeedbackEnabled = typeof feedbackEnabled === 'boolean' ? feedbackEnabled : session.feedbackEnabled;

  return (
    <div className="common-session-settings">
      <label className="common-session-setting-option" title={feedbackDescription || t('enableFeedback')}>
          <input type="checkbox" checked={currentFeedbackEnabled} disabled={saving} onChange={updateFeedback} />
          <span>Feedback</span>
      </label>
      <label className="common-session-setting-option">
        <input type="checkbox" checked={session.scoreVisible} disabled={saving} onChange={(event) => update(event, session.updateScoreVisible, session.scoreVisible)} />
        <span title={t('showScoreToStudents')}>Score</span>
      </label>
      <label className="common-session-setting-option">
        <input type="checkbox" checked={session.chatEnabled} disabled={saving} onChange={(event) => update(event, session.updateChatEnabled, session.chatEnabled)} />
        <span title={t('enableChat')}>Chat</span>
      </label>
    </div>
  );
}
