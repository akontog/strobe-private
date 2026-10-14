import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const rootNode = typeof document !== 'undefined' ? document.getElementById('geometryLabRoot') : null;

if (rootNode) {
  const mode = String(rootNode.dataset.mode || 'teacher').trim() || 'teacher';
  ReactDOM.createRoot(rootNode).render(
    <React.StrictMode>
      <App mode={mode} />
    </React.StrictMode>
  );
}
