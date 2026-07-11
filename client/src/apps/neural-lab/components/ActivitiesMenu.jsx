import React from 'react';
import { useTranslation } from 'react-i18next';
import i18n from '../../../shared/i18n';
import { Accordion } from '../../../shared/components/Accordion';

const ACTIVITY_OPTIONS = [
  { value: '1', labelKey: 'neural.activity1' },
  { value: '2', labelKey: 'neural.activity2' },
  { value: '3', labelKey: 'neural.activity3' },
  { value: '4', labelKey: 'neural.activity4' }
];

export const getNeuralActivityTitle = (activityId, fallback = i18n.t('neural.activity1')) => {
  const normalizedId = String(activityId ?? '').trim();
  const match = ACTIVITY_OPTIONS.find((option) => option.value === normalizedId);
  return match ? i18n.t(match.labelKey) : fallback;
};

export const ActivitiesMenu = ({ value = '1', onChange }) => {
  const { t } = useTranslation('neural');

  return (
    <Accordion title={`🔬 ${t('activitiesTitle')}`}>
      <div className="data-section activities-menu">
        <div className="select-group">
          <label>{t('chooseActivity')}</label>
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
                {t(option.labelKey)}
              </option>
            ))}
          </select>
        </div>
      </div>
    </Accordion>
  );
};

export const NEURAL_ACTIVITY_OPTIONS = ACTIVITY_OPTIONS;
