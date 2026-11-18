import React from 'react';
import { useTranslation } from 'react-i18next';
import { Accordion } from '../layouts/Accordion';
import { useEffect, useRef } from 'react';
import { useSessionInputLogger } from '../activities/SessionLogContext';
import './ActivitiesAccordion.css';

const DEFAULT_OPTIONS = [
  { value: '1', label: '1. Βρίσκω την είσοδο' },
  { value: '2', label: '2. Υπολογίζω την έξοδο' },
  { value: '3', label: '3. Προσαρμόζω τα βάρη' },
  { value: '4', label: '4. Συγκρίνω' }
];

export const ActivitiesAccordion = ({
  title = '', // Accordion heading.
  icon = '', // Icon shown beside the heading.
  label = '', // Label for the activity selector.
  value = '1', // Currently selected option value.
  options = DEFAULT_OPTIONS, // Options available in the selector.
  onChange, // Receives the selected option value.
  open = false, // Opens the accordion initially when true.
  className = '' // Additional CSS classes for the menu.
}) => {
  const { t } = useTranslation('interface');
  const session = useSessionInputLogger();
  const previousValue = useRef(String(value || ''));
  const selectedActivityName = (Array.isArray(options) ? options : [])
    .find((option) => String(option.value) === String(value))?.label || String(value || '');

  useEffect(() => {
    if (previousValue.current === String(value || '')) return;
    previousValue.current = String(value || '');
    window.dispatchEvent(new CustomEvent('strobe:activity-changed', { detail: { activityId: String(value || '') } }));
  }, [value]);

  useEffect(() => {
    if (session?.role !== 'teacher' || !session.app || !value) return;
    fetch('/teacher/classroom/selection', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ app: session.app, activityId: String(value) })
    }).catch(() => {});
  }, [session?.app, session?.role, value]);

  useEffect(() => {
    if (session?.role !== 'teacher' || !session.activeSessionId || !selectedActivityName) return;
    session.updateActivity(selectedActivityName, value).catch((error) => {
      console.error('Unable to update session activity:', error);
    });
  }, [selectedActivityName, session?.activeSessionId, session?.role, session?.updateActivity]);

  const handleChange = async (nextValue) => {
    if (nextValue === value || typeof onChange !== 'function') return;
    try {
      if (session?.role === 'teacher') await session.endSession();
      onChange(nextValue);
    } catch (error) {
      window.alert(error.message || 'Could not end the current session.');
    }
  };

  const resolvedTitle = title || t('activities');
  const resolvedIcon = icon || '🎯';
  const resolvedLabel = label || t('chooseActivity');

  return (
    <Accordion title={resolvedTitle} icon={resolvedIcon} open={open}>
      <div className={`activities-accordion ${className}`.trim()}>
        <div className="select-group">
          <label>{resolvedLabel}</label>
          <select
            value={value}
            onChange={(event) => handleChange(event.target.value)}
          >
            {Array.isArray(options) && options.length > 0 ? (
              options.map((option) => (
                <option key={option.value ?? option.label} value={option.value}>
                  {option.label}
                </option>
              ))
            ) : (
              <option value="">{t('noAvailableActivities')}</option>
            )}
          </select>
        </div>
      </div>
    </Accordion>
  );
};

export const DEFAULT_ACTIVITY_OPTIONS = DEFAULT_OPTIONS;
export default ActivitiesAccordion;
