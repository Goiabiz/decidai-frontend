import { universoSupabase } from '../lib/supabase';

export type V35IntegrationCatalogItem = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  category_code: string | null;
  category_name: string | null;
  provider_type: string | null;
  auth_type: string | null;
  status: string | null;
  min_plan_code: string | null;
  logo_hint: string | null;
  supports_oauth: boolean;
  supports_api_key: boolean;
  supports_webhook: boolean;
  can_feed_knowledge: boolean;
  can_create_tasks: boolean;
  can_open_attendance: boolean;
  can_be_channel_provider: boolean;
  can_sync_files: boolean;
  can_sync_messages: boolean;
  can_use_webhook_in: boolean;
  can_use_webhook_out: boolean;
  display_order: number | null;
};

export type V35ProviderAction = {
  id: string;
  provider_id: string;
  action_code: string;
  action_name: string;
  description: string | null;
  direction: string;
  http_method: string | null;
  endpoint_template: string | null;
  risk_level: string;
  requires_confirmation: boolean;
  is_active: boolean;
};

export type V35ApiDictionaryField = {
  connection_id: string | null;
  connection_name: string | null;
  connection_status: string | null;
  endpoint_id: string | null;
  endpoint_name: string | null;
  endpoint_key: string | null;
  http_method: string | null;
  path_template: string | null;
  endpoint_status: string | null;
  response_field_id: string | null;
  field_path: string | null;
  field_key: string | null;
  field_label: string | null;
  data_type: string | null;
  sample_value: string | null;
  is_identifier: boolean;
  is_filterable: boolean;
  is_sensitive: boolean;
  can_use_in_screen: boolean;
  can_use_in_alert: boolean;
  can_use_in_report: boolean;
  can_use_by_agent: boolean;
};

export type V35ResourceUsage = {
  plan_code: string | null;
  max_users: number | null;
  users_used: number | null;
  max_agents: number | null;
  agents_used: number | null;
  max_channels: number | null;
  channels_used: number | null;
  max_integrations: number | null;
  integrations_used: number | null;
  monthly_token_limit: number | null;
  tokens_used: number | null;
  monthly_message_limit: number | null;
  messages_used: number | null;
  source: string | null;
};

export type V35LoadState = 'supabase' | 'fallback' | 'empty';

function getClient() {
  return universoSupabase;
}

export function providerDomain(item: Pick<V35IntegrationCatalogItem, 'code' | 'logo_hint' | 'name'>) {
  const key = (item.logo_hint || item.code || item.name || '').toLowerCase();
  const map: Record<string, string> = {
    google_drive: 'drive.google.com',
    google_docs: 'docs.google.com',
    google_sheets: 'sheets.google.com',
    google_slides: 'slides.google.com',
    'google-forms': 'forms.google.com',
    google_forms: 'forms.google.com',
    'google-workspace': 'workspace.google.com',
    google_workspace: 'workspace.google.com',
    gmail: 'gmail.com',
    outlook: 'outlook.com',
    microsoft_teams: 'teams.microsoft.com',
    teams: 'teams.microsoft.com',
    onedrive: 'onedrive.live.com',
    sharepoint: 'sharepoint.com',
    'microsoft-entra': 'azure.microsoft.com',
    azure_ad: 'azure.microsoft.com',
    slack: 'slack.com',
    discord: 'discord.com',
    telegram: 'telegram.org',
    whatsapp_business: 'whatsapp.com',
    whatsapp: 'whatsapp.com',
    meta_whatsapp: 'developers.facebook.com',
    blip: 'blip.ai',
    zenvia: 'zenvia.com',
    twilio: 'twilio.com',
    jira: 'atlassian.com',
    confluence: 'atlassian.com',
    trello: 'trello.com',
    monday: 'monday.com',
    asana: 'asana.com',
    notion: 'notion.so',
    typeform: 'typeform.com',
    github: 'github.com',
    gitlab: 'gitlab.com',
    bitbucket: 'bitbucket.org',
    salesforce: 'salesforce.com',
    hubspot: 'hubspot.com',
    pipedrive: 'pipedrive.com',
    'rd-station': 'rdstation.com',
    rd_station: 'rdstation.com',
    bling: 'bling.com.br',
    tiny: 'tiny.com.br',
    omie: 'omie.com.br',
    totvs: 'totvs.com',
    asaas: 'asaas.com',
    'mercado-pago': 'mercadopago.com.br',
    mercado_pago: 'mercadopago.com.br',
    pagarme: 'pagar.me',
    stripe: 'stripe.com',
    okta: 'okta.com',
    freshdesk: 'freshdesk.com',
    intercom: 'intercom.com',
    zendesk: 'zendesk.com',
    bigquery: 'cloud.google.com',
    metabase: 'metabase.com',
    mysql: 'mysql.com',
    postgresql: 'postgresql.org',
    'power-bi': 'powerbi.microsoft.com',
    power_bi: 'powerbi.microsoft.com',
    supabase: 'supabase.com',
    supabase_external: 'supabase.com',
    api: '',
    api_personalizada: '',
    webhook: '',
    webhook_entrada: '',
    webhook_saida: '',
  };

  return map[key] || map[(item.code || '').toLowerCase()] || '';
}

export async function listV35IntegrationCatalog() {
  const client = getClient();
  if (!client) return { data: [] as V35IntegrationCatalogItem[], source: 'fallback' as V35LoadState, error: 'Supabase não configurado.' };

  const { data, error } = await client
    .from('vw_v35_integration_catalog_client')
    .select('*')
    .order('category_name', { ascending: true })
    .order('display_order', { ascending: true })
    .order('name', { ascending: true });

  if (error) return { data: [] as V35IntegrationCatalogItem[], source: 'fallback' as V35LoadState, error: error.message };
  return { data: (data || []) as V35IntegrationCatalogItem[], source: data && data.length ? 'supabase' as V35LoadState : 'empty' as V35LoadState, error: null };
}

export type V35AdminProviderRow = {
  id: string;
  code: string;
  name: string;
  category_name: string | null;
  min_plan_code: string | null;
  is_visible_to_client: boolean;
  is_native_product_service: boolean;
  status: string | null;
};

/** Catálogo completo (inclusive intranet-only) para telas administrativas. Ignora o filtro de visibilidade da view de cliente. */
export async function listV35AllProvidersForAdmin() {
  const client = getClient();
  if (!client) return { data: [] as V35AdminProviderRow[], error: 'Supabase não configurado.' };

  const { data, error } = await client
    .from('integration_providers')
    .select('id, code, name, category_code, min_plan_code, is_visible_to_client, is_native_product_service, status')
    .order('name', { ascending: true });

  if (error) return { data: [] as V35AdminProviderRow[], error: error.message };
  const mapped = (data || []).map((row) => ({
    id: row.id,
    code: row.code,
    name: row.name,
    category_name: row.category_code,
    min_plan_code: row.min_plan_code,
    is_visible_to_client: row.is_visible_to_client,
    is_native_product_service: row.is_native_product_service,
    status: row.status,
  }));
  return { data: mapped, error: null as string | null };
}

export async function updateV35IntegrationProvider(providerId: string, changes: {
  is_visible_to_client?: boolean;
  is_native_product_service?: boolean;
  min_plan_code?: string | null;
}) {
  const client = getClient();
  if (!client) throw new Error('Supabase não configurado.');
  const { error } = await client.from('integration_providers').update(changes).eq('id', providerId);
  if (error) throw error;
}

export async function listV35ProviderActions(providerId?: string) {
  const client = getClient();
  if (!client) return { data: [] as V35ProviderAction[], source: 'fallback' as V35LoadState, error: 'Supabase não configurado.' };

  let query = client
    .from('integration_provider_actions')
    .select('id, provider_id, action_code, action_name, description, direction, http_method, endpoint_template, risk_level, requires_confirmation, is_active')
    .eq('is_active', true)
    .order('action_name', { ascending: true });

  if (providerId) query = query.eq('provider_id', providerId);

  const { data, error } = await query;
  if (error) return { data: [] as V35ProviderAction[], source: 'fallback' as V35LoadState, error: error.message };
  return { data: (data || []) as V35ProviderAction[], source: data && data.length ? 'supabase' as V35LoadState : 'empty' as V35LoadState, error: null };
}

export async function listV35ApiDictionary() {
  const client = getClient();
  if (!client) return { data: [] as V35ApiDictionaryField[], source: 'fallback' as V35LoadState, error: 'Supabase não configurado.' };

  const { data, error } = await client
    .from('vw_v35_api_guided_dictionary')
    .select('*')
    .order('connection_name', { ascending: true })
    .order('endpoint_name', { ascending: true })
    .order('field_label', { ascending: true });

  if (error) return { data: [] as V35ApiDictionaryField[], source: 'fallback' as V35LoadState, error: error.message };
  return { data: (data || []) as V35ApiDictionaryField[], source: data && data.length ? 'supabase' as V35LoadState : 'empty' as V35LoadState, error: null };
}

export async function listV35ResourceUsage() {
  const client = getClient();
  if (!client) return { data: null as V35ResourceUsage | null, source: 'fallback' as V35LoadState, error: 'Supabase não configurado.' };

  const { data, error } = await client
    .from('vw_v35_resource_usage_snapshot')
    .select('*')
    .order('period_month', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) return { data: null as V35ResourceUsage | null, source: 'fallback' as V35LoadState, error: error.message };
  return { data: data as V35ResourceUsage | null, source: data ? 'supabase' as V35LoadState : 'empty' as V35LoadState, error: null };
}

export function groupCatalogByCategory(items: V35IntegrationCatalogItem[]) {
  const grouped = new Map<string, V35IntegrationCatalogItem[]>();

  items.forEach((item) => {
    const category = item.category_name || 'Outros conectores';
    const current = grouped.get(category) || [];
    current.push(item);
    grouped.set(category, current);
  });

  return Array.from(grouped.entries()).map(([category, providers]) => ({ category, providers }));
}

export function filterChannelProviders(items: V35IntegrationCatalogItem[]) {
  return items.filter((item) => item.can_be_channel_provider || item.can_sync_messages || item.can_open_attendance || ['comunicacao', 'suporte_atendimento'].includes(item.category_code || ''));
}

export function filterAgentEnabledProviders(items: V35IntegrationCatalogItem[]) {
  return items.filter((item) => item.can_feed_knowledge || item.can_create_tasks || item.can_open_attendance || item.can_sync_files || item.can_sync_messages || item.can_use_webhook_in || item.can_use_webhook_out);
}
