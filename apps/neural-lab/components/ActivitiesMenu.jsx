import React from 'react';
import { Accordion } from '../../shared/components/Accordion';

const ACTIVITY_OPTIONS = [
  { value: '1', label: '1. Εισαγωγή εισόδων' },
  { value: '2', label: '2. Υπολογισμός εξόδων' },
  { value: '3', label: '3. Προσαρμογή βαρών' },
  { value: '4', label: '4. Κατώφλι' }
];

export const ActivitiesMenu = ({ value = '1', onChange }) => (
  <Accordion title="🔬 Δραστηριότητες">
    <div className="data-section activities-menu">
      <div className="select-group">
        <label>Επιλογή δραστηριότητας</label>
        <select
          value={value}
          onChange={(event) => {
            if (typeof onChange === 'function') {
              onChange(event.target.value);
            }
          }}
        >
          {ACTIVITY_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  </Accordion>
);

export const NEURAL_ACTIVITY_OPTIONS = ACTIVITY_OPTIONS;
