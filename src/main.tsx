import './styles/v34_6_4_pending.css';
import './styles/v29_4_v34_6_final.css';
import './styles/v29_4_v34_5_global_product.css';
import './styles/v29_4_v34_4_dark_menu.css';
import './styles/v29_4_v34_3_plugin_catalog.css';
import './styles/v29_4_v34_2_marketplace.css';
import './styles/v29_4_v34.css';
import './lib/appConfirm';
import './lib/sidebarHoverDelay';
import './lib/appToast';
import './lib/branding';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import { SessionProvider } from './contexts/SessionContext';
import './styles/global.css';
import './styles/v36_supabase_bindings.css';
import './styles/v36_2_secure_api_actions.css';
import './styles/v36_3_cleanup.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <SessionProvider>
      <App />
    </SessionProvider>
  </React.StrictMode>
);
