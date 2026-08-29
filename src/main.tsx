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
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { App } from './App';
import { SessionProvider } from './contexts/SessionContext';
import './styles/global.css';
import './styles/v36_supabase_bindings.css';
import './styles/v36_2_secure_api_actions.css';
import './styles/v36_3_cleanup.css';

// Reforma de arquitetura 29/08: staleTime de 30s evita refetch a cada troca de tela pra dado
// que claramente não muda a cada segundo; retry:1 (não o default de 3) porque a maioria dos
// erros aqui é RLS/permissão, não instabilidade de rede -- repetir 3x não ajuda.
const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, retry: 1, refetchOnWindowFocus: false },
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <SessionProvider>
          <App />
        </SessionProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>
);
