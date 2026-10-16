import React from 'react';
import { ACTIVITY_WIDGETS } from '../../../shared/components/widgets/registry';
import { decodeUnicodeCode } from '../../../shared/components/widgets/IconWidget';
import MathFormula from '../../../shared/components/primitives/MathFormula';
import { formatEquation } from '../../../shared/components/widgets/EquationWidget';

function TextField({ label, value, type = 'text', onChange, placeholder = '', hint = '', info = '' }) {
  return (
    <label>
      <span className="activity-widget-field-label">
        {label}
        {info ? <span className="activity-widget-field-info" title={info} aria-label={info} tabIndex={0}>ⓘ</span> : null}
      </span>
      <input type={type} value={value ?? ''} placeholder={placeholder} onChange={(event) => onChange(type === 'number' ? Number(event.target.value) : event.target.value)} />
      {hint ? <small className="tool-muted">{hint}</small> : null}
    </label>
  );
}

function GraphItemFields({ items, onChange, t }) {
  function updateItem(index, changes) {
    onChange(items.map((item, itemIndex) => itemIndex === index ? { ...item, ...changes } : item));
  }

  function addItem() {
    onChange([...items, { id: `graph-item-${Date.now()}`, type: 'point', x: 0, y: 0, color: '#dc2626', showCoordinates: true }]);
  }

  return (
    <div className="activity-graph-items">
      {items.map((item, index) => (
        <div className="activity-graph-item" key={item.id || index}>
          <label>
            <span className="activity-widget-field-label">
              {t('activityBuilder.graphElement')}
              <span className="activity-widget-field-info" title={t('activityBuilder.graphElementHint')} aria-label={t('activityBuilder.graphElementHint')} tabIndex={0}>ⓘ</span>
            </span>
            <select value={item.type || 'equation'} onChange={(event) => updateItem(index, event.target.value === 'point' ? { type: 'point', x: 0, y: 0, color: '#dc2626', showCoordinates: true } : { type: 'equation', expression: 'y=x', color: '#2563eb' })}>
              <option value="point">{t('activityBuilder.graphPoint')}</option>
              <option value="equation">{t('activityBuilder.graphEquation')}</option>
            </select>
          </label>
          {item.type === 'point' ? (
            <label className="activity-graph-point-coordinates">
              <input type="checkbox" checked={item.showCoordinates !== false} onChange={(event) => updateItem(index, { showCoordinates: event.target.checked })} />
              {t('activityBuilder.showCoordinates')}
            </label>
          ) : null}
          {item.type === 'point' ? (
            <div className="activity-graph-point-fields">
              <TextField label="x" type="number" value={item.x} onChange={(value) => updateItem(index, { x: value })} />
              <TextField label="y" type="number" value={item.y} onChange={(value) => updateItem(index, { y: value })} />
            </div>
          ) : (
            <TextField label={t('activityBuilder.graphEquation')} value={item.expression} placeholder="y = 2x + 1" info={t('activityBuilder.graphEquationHint')} onChange={(value) => updateItem(index, { expression: value })} />
          )}
          <TextField label={t('activityBuilder.graphColor')} type="color" value={item.color || (item.type === 'point' ? '#dc2626' : '#2563eb')} onChange={(value) => updateItem(index, { color: value })} />
          {items.length > 1 ? (
            <button type="button" className="activity-graph-item__remove" title={t('activityBuilder.remove')} aria-label={t('activityBuilder.remove')} onClick={() => onChange(items.filter((_, itemIndex) => itemIndex !== index))}>×</button>
          ) : null}
        </div>
      ))}
      <button type="button" className="activity-graph-items__add" title={t('activityBuilder.addGraphElement')} onClick={addItem}>+ {t('activityBuilder.addGraphElement')}</button>
    </div>
  );
}

export default function WidgetSettings({ widget, onChange, t }) {
  const definition = ACTIVITY_WIDGETS.find((item) => item.type === widget.type);
  const settings = widget.settings || {};
  const update = (key, value) => onChange({ ...widget, settings: { ...settings, [key]: value } });

  if (!definition) return null;

  return (
    <div className="activity-widget-fields">
      {widget.type === 'icon' ? (
        <div className="activity-icon-code-field">
          <TextField
            label={t('activityBuilder.widgetNames.icon')}
            value={settings.code}
            onChange={(value) => update('code', value)}
            placeholder="U+1F600"
            info={t('activityBuilder.iconCode')}
          />
          <div className="activity-icon-code-preview" aria-live="polite">
            {decodeUnicodeCode(settings.code) || '😀'}
          </div>
        </div>
      ) : null}

      {widget.type === 'equation' ? (
        <div className="activity-equation-code-field">
          <TextField label={t('activityBuilder.expression')} value={settings.expression} onChange={(value) => update('expression', value)} placeholder="x^2" />
          <div className="activity-equation-code-preview" aria-live="polite">
            {settings.expression?.trim()
              ? <MathFormula formula={formatEquation(settings.expression)} />
              : null}
          </div>
        </div>
      ) : null}

      {widget.type === 'plot-widget' || widget.type === 'simple-coordinate-system' ? (
        <>
          <TextField label={t('activityBuilder.graphTitle')} value={settings.title} onChange={(value) => update('title', value)} />
          {[
            { axis: 'x', keys: ['xMin', 'xMax'] },
            { axis: 'y', keys: ['yMin', 'yMax'] }
          ].map(({ axis, keys }) => (
            <div className="activity-graph-range" key={axis}>
              <strong>{axis}</strong>
              {keys.map((key) => (
                <TextField key={key} label={t(`activityBuilder.${key}`)} type="number" value={settings[key]} onChange={(value) => update(key, value)} />
              ))}
            </div>
          ))}
          <GraphItemFields items={Array.isArray(settings.graphItems) ? settings.graphItems : [{ id: 'graph-item-initial', type: 'equation', expression: 'y=x' }]} onChange={(value) => update('graphItems', value)} t={t} />
          <label className="activity-builder-check">
            <input type="checkbox" checked={settings.showGrid !== false} onChange={(event) => update('showGrid', event.target.checked)} />
            {t('activityBuilder.showGrid')}
          </label>
        </>
      ) : null}
    </div>
  );
}
