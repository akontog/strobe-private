import { ActivitiesMenu as SharedActivitiesMenu } from '../../../shared/components';

export const NEURAL_ACTIVITY_OPTIONS = [
  { value: '1', label: '1. Βρίσκω την είσοδο' },
  { value: '2', label: '2. Υπολογίζω την έξοδο' },
  { value: '3', label: '3. Προσαρμόζω τα βάρη' },
  { value: '4', label: '4. Συγκρίνω' }
];

export const getNeuralActivityTitle = (activityId, fallback = NEURAL_ACTIVITY_OPTIONS[0].label) => {
  const normalizedId = String(activityId ?? '').trim();
  const match = NEURAL_ACTIVITY_OPTIONS.find((option) => option.value === normalizedId);
  return match ? match.label : fallback;
};

export const ActivitiesMenu = ({ value = '1', onChange, title = 'Δραστηριότητες', icon = '🔬', label = 'Επιλογή δραστηριότητας' }) => (
  <SharedActivitiesMenu
    title={title}
    icon={icon}
    label={label}
    value={value}
    options={NEURAL_ACTIVITY_OPTIONS}
    onChange={onChange}
  />
);
