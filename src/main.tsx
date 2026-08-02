import './lib/appConfirm';
import './lib/sidebarHoverDelay';
import './lib/appToast';
import './lib/branding';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import './styles/global.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
