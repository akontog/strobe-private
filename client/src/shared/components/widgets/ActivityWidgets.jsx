import React from 'react';
import IconWidget from './IconWidget';
import EquationWidget from './EquationWidget';
import SimpleCoordinateSystem from './SimpleCoordinateSystem';

const WIDGET_COMPONENTS = {
  icon: IconWidget,
  equation: EquationWidget,
  'simple-coordinate-system': SimpleCoordinateSystem
};

export default function ActivityWidgets({ widgets = [], position }) {
  return (widgets || [])
    .filter((widget) => !position || widget.position === position)
    .map((widget, index) => {
      const Widget = WIDGET_COMPONENTS[widget.type];
      if (!Widget) return null;
      return <Widget key={widget.id || `${widget.type}-${index}`} {...(widget.settings || {})} />;
    });
}
