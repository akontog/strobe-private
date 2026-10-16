import React from 'react';
import './IconWidget.css';

export function decodeUnicodeCode(code = '') {
  const normalized = String(code).trim();
  const match = normalized.match(/^(?:U\+|0x|&#x)?([\da-f]{1,6});?$/i);
  if (!match) return '';
  const point = Number.parseInt(match[1], 16);
  if (point > 0x10ffff || (point >= 0xd800 && point <= 0xdfff)) return '';
  try {
    return String.fromCodePoint(point);
  } catch {
    return '';
  }
}

export default function IconWidget({ code = '' }) {
  const icon = decodeUnicodeCode(code);
  if (!icon) return null;
  return <span className="activity-icon-widget" aria-label={`Unicode ${code}`}>{icon}</span>;
}
