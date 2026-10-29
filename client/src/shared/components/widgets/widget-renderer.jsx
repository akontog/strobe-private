import React from 'react';
import IconWidget from './IconWidget';
import EquationWidget from './EquationWidget';
import PlotWidget from './PlotWidget';
import './WidgetRenderer.css';

const WIDGET_COMPONENTS = {
  icon: IconWidget,
  equation: EquationWidget,
  'plot-widget': PlotWidget,
  'simple-coordinate-system': PlotWidget
};

function normalizeWidgetClass(type = '') {
  return String(type || 'widget').toLowerCase().replace(/[^a-z0-9]+/g, '-');
}

function getWidgetTitle(widget = {}) {
  const directTitle = String(widget?.title || '').trim();
  if (directTitle) {
    return directTitle;
  }

  const settingsTitle = String(widget?.settings?.title || '').trim();
  if (settingsTitle) {
    return settingsTitle;
  }

  return '';
}

export default function WidgetRenderer({
  widgets = [], // Widget definitions rendered from the activity resource.
  position // Optional position used to filter the widgets.
}) {
  const visibleWidgets = (widgets || []).filter((widget) => !position || widget.position === position);
  if (!visibleWidgets.length) return null;

  return (
    <div className="widget-renderer">
      {visibleWidgets.map((widget, index) => {
        const Widget = WIDGET_COMPONENTS[widget.type];
        if (!Widget) return null;

        const widgetTitle = getWidgetTitle(widget);
        const widgetClassName = normalizeWidgetClass(widget.type);
        const settings = { ...(widget.settings || {}) };

        // Plot widgets already support an internal title; suppress it when rendered via the shared widget header.
        if (widgetTitle && (widget.type === 'plot-widget' || widget.type === 'simple-coordinate-system')) {
          if (!settings.accessibleLabel) {
            settings.accessibleLabel = widgetTitle;
          }
          settings.title = '';
        }

        return (
          <article key={widget.id || `${widget.type}-${index}`} className={`activity-widget activity-widget--${widgetClassName}`}>
            {widgetTitle ? (
              <header className="activity-widget__header">
                <h3 className="activity-widget__title">{widgetTitle}</h3>
              </header>
            ) : null}
            <div className="activity-widget__body">
              <Widget {...settings} />
            </div>
          </article>
        );
      })}
    </div>
  );
}
