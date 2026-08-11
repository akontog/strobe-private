import React from 'react';
import { GeometryLabShell } from './components';
import { GEOMETRY_LAB_MODES } from './data/modes';

export default function App({ mode = 'teacher' }) {
  const safeMode = GEOMETRY_LAB_MODES[mode] ? mode : 'teacher';
  const config = GEOMETRY_LAB_MODES[safeMode];

  return <GeometryLabShell mode={safeMode} config={config} />;
}
