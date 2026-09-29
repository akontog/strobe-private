import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './shared/i18n';
import App from './App';
import './styles/globals.css';
import './styles/postit-cards.css';
import './styles/dashboard-pages.css';
import './framework/assets/css/classroom-shared.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
