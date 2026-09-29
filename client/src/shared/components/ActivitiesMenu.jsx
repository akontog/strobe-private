import React from 'react';
import { Accordion } from './Accordion';

const DEFAULT_OPTIONS = [
  { value: '1', label: '1. Βρίσκω την είσοδο' },
  { value: '2', label: '2. Υπολογίζω την έξοδο' },
  { value: '3', label: '3. Προσαρμόζω τα βάρη' },
  { value: '4', label: '4. Συγκρίνω' }
];

export const ActivitiesMenu = ({
  title = 'Δραστηριότητες',
  icon = '🔬',
  label = 'Επιλογή δραστηριότητας',
  value = '1',
  options = DEFAULT_OPTIONS,
  onChange,
  open = false,
  className = ''
}) => (
  <Accordion title={title} icon={icon} open={open}>
    <div className={`data-section activities-menu ${className}`.trim()}>
      <div className="select-group">
        <label className="shared-activity-label">{label}</label>
        <select
          className="shared-activity-select"
          value={value}
          onChange={(event) => {
            if (typeof onChange === 'function') {
              onChange(event.target.value);
            }
          }}
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

export const DEFAULT_ACTIVITY_OPTIONS = DEFAULT_OPTIONS;
