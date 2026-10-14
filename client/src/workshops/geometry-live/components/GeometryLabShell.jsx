import React, { useEffect } from 'react';

export function GeometryLabShell({ mode, config }) {
  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    window.geometryLabMeta = {
      mode,
      ...config
    };
  }, [mode, config]);

  return null;
}
