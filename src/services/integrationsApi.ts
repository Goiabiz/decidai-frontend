import { universoSupabase } from '../lib/supabase';

export type IntegrationProvider = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  provider_type: string;
  auth_type: 'oauth2' | 'api_key' | 'webhook' | 'manual';
  status: 'ativo' | 'planejado' | 'desativado';
  supports_oauth: boolean;
  supports_api_key: boolean;
  supports_webhook: boolean;
  required_scopes: string[];
  optional_scopes: string[];
  config_schema: Record<string, unknown>;
};

export type IntegrationConnection = {
  id: string;
  provider_code: string;
  connection_name: string | null;
  status: 'nao_conectada' | 'conectada' | 'erro_autenticacao' | 'token_expirado' | 'sem_permissao' | 'desativada';
  auth_type: 'oauth2' | 'api_key' | 'webhook' | 'manual';
  scopes: string[];
  metadata: Record<string, unknown>;
  last_success_at: string | null;
  last_error_at: string | null;
  last_error_message: string | null;
  connected_at: string | null;
  disconnected_at: string | null;
  created_at: string;
};

export type IntegrationResource = {
  id: string;
  connection_id: string;
  provider_code: string;
  resource_type: string;
  external_id: string;
  name: string;
  parent_external_id: string | null;
  web_url: string | null;
  status: string;
  metadata: Record<string, unknown>;
  selected_for_agent: boolean;
  selected_for_monitoring: boolean;
  last_sync_at: string | null;
};

function getClient() {
  if (!universoSupabase) {
    throw new Error('Cliente Supabase universo não configurado no frontend.');
  }

  return universoSupabase;
}

export async function listIntegrationProviders(): Promise<IntegrationProvider[]> {
  const { data, error } = await getClient()
    .from('integration_providers')
    .select('*')
    .is('deleted_at', null)
    .order('name', { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data || []) as IntegrationProvider[];
}

export async function listIntegrationConnections(): Promise<IntegrationConnection[]> {
  const { data, error } = await getClient()
    .from('integration_connections')
    .select('id, provider_code, connection_name, status, auth_type, scopes, metadata, last_success_at, last_error_at, last_error_message, connected_at, disconnected_at, created_at')
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data || []) as IntegrationConnection[];
}

export async function listIntegrationResources(connectionId: string): Promise<IntegrationResource[]> {
  const { data, error } = await getClient()
    .from('integration_resources')
    .select('*')
    .eq('connection_id', connectionId)
    .is('deleted_at', null)
    .order('name', { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data || []) as IntegrationResource[];
}
