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
        return <Widget key={widget.id || `${widget.type}-${index}`} {...(widget.settings || {})} />;
      })}
    </div>
  );
}
