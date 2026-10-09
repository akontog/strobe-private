import React from 'react';
import { Accordion } from '../layouts/Accordion';

const DEFAULT_OPTIONS = [
  { value: '1', label: '1. Ξ’ΟΞ―ΟƒΞΊΟ‰ Ο„Ξ·Ξ½ ΞµΞ―ΟƒΞΏΞ΄ΞΏ' },
  { value: '2', label: '2. Ξ¥Ο€ΞΏΞ»ΞΏΞ³Ξ―Ξ¶Ο‰ Ο„Ξ·Ξ½ Ξ­ΞΎΞΏΞ΄ΞΏ' },
  { value: '3', label: '3. Ξ ΟΞΏΟƒΞ±ΟΞΌΟΞ¶Ο‰ Ο„Ξ± Ξ²Ξ¬ΟΞ·' },
  { value: '4', label: '4. Ξ£Ο…Ξ³ΞΊΟΞ―Ξ½Ο‰' }
];

export const ActivitiesMenu = ({
  title = 'Ξ”ΟΞ±ΟƒΟ„Ξ·ΟΞΉΟΟ„Ξ·Ο„ΞµΟ‚',
  icon = 'π”¬',
  label = 'Ξ•Ο€ΞΉΞ»ΞΏΞ³Ξ® Ξ΄ΟΞ±ΟƒΟ„Ξ·ΟΞΉΟΟ„Ξ·Ο„Ξ±Ο‚',
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
            <option value="">Ξ”ΞµΞ½ Ο…Ο€Ξ¬ΟΟ‡ΞΏΟ…Ξ½ Ξ΄ΞΉΞ±ΞΈΞ­ΟƒΞΉΞΌΞµΟ‚ Ξ΄ΟΞ±ΟƒΟ„Ξ·ΟΞΉΟΟ„Ξ·Ο„ΞµΟ‚</option>
          )}
        </select>
      </div>
    </div>
  </Accordion>
);

export const DEFAULT_ACTIVITY_OPTIONS = DEFAULT_OPTIONS;

