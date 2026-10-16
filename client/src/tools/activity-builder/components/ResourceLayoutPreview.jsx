import React from 'react';
import { WidgetRenderer } from '../../../shared/components';
import { ACTIVITY_WIDGETS } from '../../../shared/components/widgets/registry';
import WidgetSettings from './WidgetSettings';
import './ResourceLayoutPreview.css';

function ResourceMock({ resource, props, t }) {
  if (resource === 'input-grid') {
    const fields = (props.fields || []).slice(0, 6);
    return (
      <div className="activity-resource-mock-grid" style={{ gridTemplateColumns: `repeat(${Math.min(3, Math.max(1, Number(props.columns) || 1))}, minmax(0, 1fr))` }}>
        {fields.map((field, index) => (
          <div key={field.id || index}>
            <span>{field.label || t('activityBuilder.fieldLabel')}</span>
            <i />
          </div>
        ))}
      </div>
    );
  }
  if (resource === 'grouping-drag-drop') {
    return (
      <div className="activity-resource-mock-groups">
        {(props.groups || []).slice(0, 3).map((group, index) => <span key={group.id || index}>{group.title || t('activityBuilder.groupLabel')}</span>)}
      </div>
    );
  }
  if (resource === 'algebra-tiles') {
    return <div className="activity-resource-mock-tiles" aria-hidden="true"><i /><i /><i /><i /></div>;
  }
  return <div className="activity-resource-mock-board">{t('activityBuilder.geoGebraPreview')}</div>;
}

function PositionSlot({
  position, widgets, pendingPosition, canAdd, onBeginAdd, onCancelAdd,
  onAddWidget, onUpdateWidget, onRemoveWidget, t
}) {
  const positionWidgets = widgets.filter((widget) => (widget.position || 'left') === position);
  const isPending = pendingPosition === position;

  return (
    <div className={`activity-resource-preview__slot activity-resource-preview__slot--${position}`}>
      <small className="activity-resource-preview__position-label">
        {t(position === 'left' ? 'activityBuilder.widgetLeft' : 'activityBuilder.widgetRight')}
      </small>
      {positionWidgets.map((widget) => {
        const definition = ACTIVITY_WIDGETS.find((item) => item.type === widget.type);
        return (
          <article className="activity-resource-preview__widget" key={widget.id}>
            <header>
              <strong>{t(definition?.titleKey || 'activityBuilder.unknownWidget')}</strong>
              <div>
                <button
                  type="button"
                  className="activity-resource-preview__icon-button"
                  title={t(position === 'left' ? 'activityBuilder.moveToRight' : 'activityBuilder.moveToLeft')}
                  aria-label={t(position === 'left' ? 'activityBuilder.moveToRight' : 'activityBuilder.moveToLeft')}
                  onClick={() => onUpdateWidget({ ...widget, position: position === 'left' ? 'right' : 'left' })}
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                    <path d="M7 7 3 11l4 4M3 11h13M17 17l4-4-4-4m4 4H8" />
                  </svg>
                  <span className="activity-resource-preview__tooltip" role="tooltip">
                    {t(position === 'left' ? 'activityBuilder.moveToRight' : 'activityBuilder.moveToLeft')}
                  </span>
                </button>
                <button
                  type="button"
                  className="activity-resource-preview__icon-button"
                  title={t('activityBuilder.remove')}
                  aria-label={t('activityBuilder.remove')}
                  onClick={() => onRemoveWidget(widget.id)}
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                    <path d="M4 7h16M10 11v6m4-6v6M6 7l1 14h10l1-14M9 7V4h6v3" />
                  </svg>
                  <span className="activity-resource-preview__tooltip" role="tooltip">
                    {t('activityBuilder.remove')}
                  </span>
                </button>
              </div>
            </header>
            {widget.type === 'plot-widget' || widget.type === 'simple-coordinate-system' ? (
              <WidgetRenderer widgets={[widget]} position={position} />
            ) : null}
            <WidgetSettings widget={widget} onChange={onUpdateWidget} t={t} />
          </article>
        );
      })}
      {isPending ? (
        <label className="activity-resource-preview__choose-widget">
          {t('activityBuilder.widgetType')}
          <select defaultValue="" onChange={(event) => event.target.value && onAddWidget(position, event.target.value)}>
            <option value="" disabled>{t('activityBuilder.chooseWidget')}</option>
            {ACTIVITY_WIDGETS.map((widget) => <option key={widget.type} value={widget.type}>{t(widget.titleKey)}</option>)}
          </select>
          <button type="button" onClick={onCancelAdd}>{t('activityBuilder.cancel')}</button>
        </label>
      ) : null}
      {!positionWidgets.length && !isPending ? <span className="activity-resource-preview__empty">{t('activityBuilder.emptyWidgetSlot')}</span> : null}
      <button type="button" className="activity-resource-preview__add" onClick={() => onBeginAdd(position)} disabled={!canAdd || Boolean(pendingPosition)}>
        {t('activityBuilder.addWidget')}
      </button>
    </div>
  );
}

export default function ResourceLayoutPreview({
  resource, props, widgets, onChangeWidgets, t
}) {
  const [pendingPosition, setPendingPosition] = React.useState('');
  const canAdd = widgets.length < 2;

  function addWidget(position, type) {
    const definition = ACTIVITY_WIDGETS.find((item) => item.type === type);
    if (!definition || widgets.length >= 2) return;
    onChangeWidgets([...widgets, {
      id: `widget-${Date.now()}`,
      type,
      position,
      settings: { ...definition.defaults }
    }]);
    setPendingPosition('');
  }

  function updateWidget(nextWidget) {
    onChangeWidgets(widgets.map((widget) => widget.id === nextWidget.id ? nextWidget : widget));
  }

  function removeWidget(widgetId) {
    onChangeWidgets(widgets.filter((widget) => widget.id !== widgetId));
  }

  return (
    <section className="activity-resource-preview" aria-label={t('activityBuilder.layoutPreview')}>
      <header className="activity-resource-preview__toolbar">
        <h4>{t('activityBuilder.layoutPreview')}</h4>
        <span>{t('activityBuilder.widgetCount', { count: widgets.length })}</span>
      </header>
      <div className="activity-resource-preview__stage">
        <PositionSlot
          position="left" widgets={widgets} pendingPosition={pendingPosition} canAdd={canAdd}
          onBeginAdd={setPendingPosition} onCancelAdd={() => setPendingPosition('')}
          onAddWidget={addWidget} onUpdateWidget={updateWidget} onRemoveWidget={removeWidget} t={t}
        />
        <div className="activity-resource-preview__resource">
          <strong>{t(`activityBuilder.resourceNames.${resource}`, { defaultValue: resource })}</strong>
          <ResourceMock resource={resource} props={props} t={t} />
        </div>
        <PositionSlot
          position="right" widgets={widgets} pendingPosition={pendingPosition} canAdd={canAdd}
          onBeginAdd={setPendingPosition} onCancelAdd={() => setPendingPosition('')}
          onAddWidget={addWidget} onUpdateWidget={updateWidget} onRemoveWidget={removeWidget} t={t}
        />
      </div>
      {widgets.length >= 2 ? <p className="activity-resource-preview__limit">{t('activityBuilder.widgetLimit')}</p> : null}
    </section>
  );
}
