import React from 'react';
import { Accordion } from '../../shared/components/Accordion';

const ACTIVITY_OPTIONS = [
  { value: '1a', label: '1α. Εισαγωγή εισόδων (εποπτικό μέσο)' },
  { value: '1b', label: '1β. Εισαγωγή εισόδων (μαθητές)' },
  { value: '2a', label: '2α. Υπολογισμός εξόδων (εποπτικό μέσο)' },
  { value: '2b', label: '2β. Υπολογισμός εξόδων (μαθητές)' },
  { value: '3a', label: '3α. Προσαρμογή βαρών (εποπτικό μέσο)' },
  { value: '3b', label: '3β. Προσαρμογή βαρών (μαθητές)' }
];

export const ActivitiesMenu = ({ value = '1a', onChange }) => (
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
