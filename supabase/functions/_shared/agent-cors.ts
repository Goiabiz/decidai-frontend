export function buildCorsHeaders(): Record<string, string> {
  const allowedOrigin = Deno.env.get('AGENT_ALLOWED_ORIGIN') || '*';

  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-request-id',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  };
}

export function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...buildCorsHeaders(),
      'Content-Type': 'application/json',
    },
  });
}

export function handleOptions(request: Request): Response | undefined {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: buildCorsHeaders() });
  }

  return undefined;
}
