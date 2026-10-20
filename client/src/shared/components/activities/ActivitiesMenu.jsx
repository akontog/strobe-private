import React from 'react';
import { Accordion } from '../layouts/Accordion';
import { useEffect } from 'react';
import { useSessionInputLogger } from './SessionLogContext';

const DEFAULT_OPTIONS = [
  { value: '1', label: '1. Βρίσκω την είσοδο' },
  { value: '2', label: '2. Υπολογίζω την έξοδο' },
  { value: '3', label: '3. Προσαρμόζω τα βάρη' },
  { value: '4', label: '4. Συγκρίνω' }
];

export const ActivitiesMenu = ({
  title = 'Δραστηριότητες', // Accordion heading.
  icon = '🔬', // Icon shown beside the heading.
  label = 'Επιλογή δραστηριότητας', // Label for the activity selector.
  value = '1', // Currently selected option value.
  options = DEFAULT_OPTIONS, // Options available in the selector.
  onChange, // Receives the selected option value.
  open = false, // Opens the accordion initially when true.
  className = '', // Additional CSS classes for the menu.
  preserveSession = false // Keeps the current session open when changing options.
}) => {
  const session = useSessionInputLogger();
  const selectedActivityName = (Array.isArray(options) ? options : [])
    .find((option) => String(option.value) === String(value))?.label || String(value || '');

  useEffect(() => {
    if (session?.role !== 'teacher' || !session.activeSessionId || !selectedActivityName) return;
    session.updateActivity(selectedActivityName).catch((error) => {
      console.error('Unable to update session activity:', error);
    });
  }, [selectedActivityName, session?.activeSessionId, session?.role, session?.updateActivity]);

  const handleChange = async (nextValue) => {
    if (nextValue === value || typeof onChange !== 'function') return;
    try {
      if (session?.role === 'teacher' && !preserveSession) await session.endSession();
      onChange(nextValue);
    } catch (error) {
      window.alert(error.message || 'Could not end the current session.');
    }
  };

  return (
    <Accordion title={title} icon={icon} open={open}>
      <div className={`data-section activities-menu ${className}`.trim()}>
        <div className="select-group">
          <label className="shared-activity-label">{label}</label>
          <select
            className="shared-activity-select"
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
              <option value="">Δεν υπάρχουν διαθέσιμες δραστηριότητες</option>
            )}
          </select>
        </div>
      </div>
    </Accordion>
  );
};

export const DEFAULT_ACTIVITY_OPTIONS = DEFAULT_OPTIONS;
