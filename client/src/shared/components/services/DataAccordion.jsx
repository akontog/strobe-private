import React, { useEffect, useRef } from 'react';
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
  const selectedOption = normalizedOptions.find((option) => option.value === String(value));
  const previousValue = useRef(String(value || ''));

  useEffect(() => {
    if (previousValue.current === String(value || '')) return;
    previousValue.current = String(value || '');
    window.dispatchEvent(new CustomEvent('strobe:activity-changed', { detail: { activityId: String(value || '') } }));
  }, [value]);

  useEffect(() => {
    if (session?.role !== 'teacher' || !session.activeSessionId || !selectedOption?.label) return;
    session.updateActivity(selectedOption.label, value).catch(() => {});
  }, [selectedOption?.label, session?.activeSessionId, session?.role, session?.updateActivity, value]);

  useEffect(() => {
    if (session?.role !== 'teacher' || !session.app || !value) return;
    fetch('/teacher/classroom/selection', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ app: session.app, activityId: String(value) })
    }).catch(() => {});
  }, [session?.app, session?.role, value]);

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
