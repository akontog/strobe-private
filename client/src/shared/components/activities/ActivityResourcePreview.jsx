import React from 'react';
import { useTranslation } from 'react-i18next';
import { decodeUnicodeCode } from '../widgets/IconWidget';
import { ACTIVITY_WIDGETS } from '../widgets/registry';

const RESOURCE_PREVIEW_TYPES = {
  'input-grid-collab': 'input-grid',
  'options-grid-collab': 'options-grid',
  'placement-board-collab': 'grouping-drag-drop',
  'venn-collab': 'venn-board',
  'number-line-collab': 'number-line',
  'cartesian-plane-collab': 'cartesian-plane',
  'algebra-tiles-collab': 'algebra-tiles',
  'collaborative-geogebra': 'collaborative-geogebra',
  'vision-collab': 'vision'
};

function ResourceMock({ resource }) {
  const type = RESOURCE_PREVIEW_TYPES[resource] || resource;
  if (type === 'input-grid') return <div className="activity-resource-preview__inputs"><i /><i /><i /><i /></div>;
  if (type === 'options-grid') return <div className="activity-resource-preview__options">{Array.from({ length: 9 }, (_, index) => <i key={index}>{index + 1}</i>)}</div>;
  if (type === 'placement-board' || type === 'grouping-drag-drop') return <div className="activity-resource-preview__placement"><i /><i /><i /><i /></div>;
  if (type === 'venn-board') return <div className="activity-resource-preview__venn"><i /><i /></div>;
  if (type === 'number-line') return <div className="activity-resource-preview__number-line"><i /><i /><i /><i /><i /></div>;
  if (type === 'cartesian-plane') return <div className="activity-resource-preview__cartesian-plane"><i /><i /><i /><i /><i /></div>;
  if (type === 'algebra-tiles') return <div className="activity-resource-preview__tiles"><i /><i /><i /></div>;
  if (type === 'collaborative-geogebra') return <div className="activity-resource-preview__graph"><i /></div>;
  return <div className="activity-resource-preview__camera">◉</div>;
}

function widgetName(t, type) {
  const definition = ACTIVITY_WIDGETS.find((item) => item.type === type);
  return definition ? t(definition.titleKey) : type;
}

/** Shows a resource mockup between the activity's left and right widget slots. */
export default function ActivityResourcePreview({ resource, widgets, onChange }) {
  const { t } = useTranslation('interface');

  function addWidget(position, type) {
    if (!type || widgets.length >= 2) return;
    const definition = ACTIVITY_WIDGETS.find((item) => item.type === type);
    onChange([...widgets, {
      id: `widget-${Date.now()}`,
      type,
      position,
      settings: JSON.parse(JSON.stringify(definition.defaults))
    }]);
  }

  function updateWidget(id, key, value) {
    onChange(widgets.map((widget) => widget.id === id
      ? { ...widget, settings: { ...widget.settings, [key]: value } }
      : widget));
  }

  function moveWidget(id, position) {
    onChange(widgets.map((widget) => widget.id === id ? { ...widget, position } : widget));
  }

  function removeWidget(id) {
    onChange(widgets.filter((widget) => widget.id !== id));
  }

  function renderSlot(position) {
    const slotWidgets = widgets.filter((widget) => widget.position === position);
    const otherPosition = position === 'left' ? 'right' : 'left';
    const moveLabel = t(position === 'left' ? 'activityBuilder.moveToRight' : 'activityBuilder.moveToLeft');
    return <section className="activity-resource-preview__slot">
      {slotWidgets.map((widget) => <article className="activity-resource-preview__widget" key={widget.id}>
        <div className="activity-resource-preview__widget-heading">
          <strong>{widgetName(t, widget.type)}</strong>
          {widget.type === 'icon' && decodeUnicodeCode(widget.settings.code) ? (
            <span className="activity-resource-preview__selected-icon">{decodeUnicodeCode(widget.settings.code)}</span>
          ) : null}
        </div>
        {widget.type === 'icon' ? <label>{t('activityBuilder.iconCode')}<input value={widget.settings.code || ''} onChange={(event) => updateWidget(widget.id, 'code', event.target.value)} /></label> : null}
        {widget.type === 'equation' ? <label>{t('activityBuilder.expression')}<input value={widget.settings.expression || ''} onChange={(event) => updateWidget(widget.id, 'expression', event.target.value)} /></label> : null}
        {widget.type === 'plot-widget' ? <>
          <label>{t('activityBuilder.graphTitle')}<input value={widget.settings.title || ''} onChange={(event) => updateWidget(widget.id, 'title', event.target.value)} /></label>
          <label>{t('activityBuilder.expression')}<input value={widget.settings.graphItems?.[0]?.expression || ''} onChange={(event) => {
            const graphItems = [...(widget.settings.graphItems || [])];
            graphItems[0] = { ...(graphItems[0] || { id: 'graph-item-1', type: 'equation' }), expression: event.target.value };
            updateWidget(widget.id, 'graphItems', graphItems);
          }} /></label>
        </> : null}
        <div className="activity-resource-preview__widget-actions">
          <button type="button" className="activity-resource-preview__icon-button" aria-label={moveLabel} title={moveLabel} onClick={() => moveWidget(widget.id, otherPosition)}>
            {position === 'left' ? '➡️' : '⬅️'}
          </button>
          <button type="button" className="activity-resource-preview__icon-button activity-resource-preview__icon-button--delete" aria-label={t('activityBuilder.remove')} title={t('activityBuilder.remove')} onClick={() => removeWidget(widget.id)}>🗑️</button>
        </div>
      </article>)}
      {widgets.length < 2 ? <div className="activity-resource-preview__add">
        <select aria-label={t('activityBuilder.widgetType')} defaultValue="" onChange={(event) => {
          addWidget(position, event.target.value);
          event.target.value = '';
        }}>
          <option value="" disabled>{t('activityBuilder.addWidget')}</option>
          {ACTIVITY_WIDGETS.map((widget) => <option key={widget.type} value={widget.type}>{t(widget.titleKey)}</option>)}
        </select>
      </div> : null}
      {!slotWidgets.length && widgets.length >= 2 ? <p>{t('activityBuilder.widgetLimit')}</p> : null}
    </section>;
  }

  return <section className="activity-resource-preview">
    {renderSlot('left')}
    <div className="activity-resource-preview__center">
      <strong>{t(`activityBuilder.resourceNames.${RESOURCE_PREVIEW_TYPES[resource] || resource}`, { defaultValue: resource })}</strong>
      <ResourceMock resource={resource} />
    </div>
    {renderSlot('right')}
  </section>;
}
