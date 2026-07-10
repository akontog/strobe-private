import React from 'react';
import ReactDOM from 'react-dom/client';
import BuffonApp from './BuffonApp';
import './student-styles.css';

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <BuffonApp role="student" />
);
