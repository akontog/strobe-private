import React from 'react';
import { Accordion } from '../../../client/src/framework/components/Accordion';

const ACTIVITY_OPTIONS = [
  { value: '1', label: '1. Βρίσκω την είσοδο' },
  { value: '2', label: '2. Υπολογίζω την έξοδο' },
  { value: '3', label: '3. Προσαρμόζω τα βάρη' },
  { value: '4', label: '4. Συγκρίνω' }
];

export const getNeuralActivityTitle = (activityId, fallback = ACTIVITY_OPTIONS[0].label) => {
  const normalizedId = String(activityId ?? '').trim();
  const match = ACTIVITY_OPTIONS.find((option) => option.value === normalizedId);
  return match ? match.label : fallback;
};

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
