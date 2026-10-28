import React from 'react';
import { Accordion } from '../layouts/Accordion';
import { useSessionInputLogger } from '../activities/SessionLogContext';
import './DataAccordion.css';

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

export default function DataAccordion({
  title,
  label,
  icon = '🔢',
  value = '',
  options = [],
  onChange,
  selectId = 'data-selector',
  emptyLabel = '',
  wrapperClassName = '',
  groupClassName = '',
  labelClassName = '',
  selectClassName = '',
  getOptionLabel,
  children
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
      <div className={`data-accordion__wrapper ${wrapperClassName}`.trim()}>
        <div className={`data-accordion__select-group ${groupClassName}`.trim()}>
          <label className={`data-accordion__label ${labelClassName}`.trim()} htmlFor={selectId}>{label}</label>
          <select
            id={selectId}
            className={`data-accordion__select ${selectClassName}`.trim()}
            value={value}
            onChange={(event) => handleChange(event.target.value)}
          >
            {normalizedOptions.length === 0 && emptyLabel ? <option value="">{emptyLabel}</option> : null}
            {normalizedOptions.map((option) => (
              <option key={option.key} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>
        {children}
      </div>
    </Accordion>
  );
}
