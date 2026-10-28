import React from 'react';
import { Accordion } from '../layouts/Accordion';
import { useSessionInputLogger } from '../activities/SessionLogContext';

const normalizeOptions = (options, getOptionLabel) => (Array.isArray(options) ? options : []).map((option, index) => {
  if (typeof option === 'string' || typeof option === 'number') {
    const value = String(option);
    return { key: `${value}-${index}`, value, label: value };
  }
  const value = option?.value ?? option?.id ?? String(index);
  const fallbackLabel = option?.label ?? String(value);
  return {
    key: option?.key || option?.id || `${value}-${index}`,
    value: String(value),
    label: typeof getOptionLabel === 'function' ? getOptionLabel(option, index) : fallbackLabel
  };
});

export default function ExpressionAccordion({
  title,
  label,
  icon = '🔢',
  value = '',
  options = [],
  onChange,
  selectId = 'expression-selector',
  emptyLabel = '',
  wrapperClassName = 'lab-data-section data-section',
  groupClassName = 'lab-select-group',
  labelClassName = 'shared-activity-label',
  selectClassName = 'shared-activity-select',
  getOptionLabel
}) {
  const session = useSessionInputLogger();
  const normalizedOptions = normalizeOptions(options, getOptionLabel);

  const handleChange = async (nextValue) => {
    if (nextValue === value || typeof onChange !== 'function') return;
    try {
      if (session?.role === 'teacher') await session.endSession();
      onChange(nextValue);
    } catch (error) {
      window.alert(error.message || 'Could not end the current session.');
    }
  };

  return (
    <Accordion title={title} icon={icon}>
      <div className={wrapperClassName}>
        <div className={groupClassName}>
          <label className={labelClassName} htmlFor={selectId}>{label}</label>
          <select
            id={selectId}
            className={selectClassName}
            value={value}
            onChange={(event) => handleChange(event.target.value)}
          >
            {normalizedOptions.length === 0 && emptyLabel ? <option value="">{emptyLabel}</option> : null}
            {normalizedOptions.map((option) => (
              <option key={option.key} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>
      </div>
    </Accordion>
  );
}
