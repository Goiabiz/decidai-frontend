import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * `getUserIdFromRequest` (supabaseAdmin.ts) só decodifica o payload do JWT, sem checar
 * assinatura -- serve pra trilha de auditoria não-crítica, não pra controlar acesso a dado
 * sensível (segredo de conector). Isto aqui chama de verdade o Supabase Auth pra validar o
 * token, mesmo padrão de `readAuthUser` em knowledge-admin (universo-conectasus-agent).
 */
export async function readVerifiedAuthUser(request: Request) {
  const url = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const authorization = request.headers.get("Authorization");

  if (!url || !anonKey || !authorization) return null;

  const client = createClient(url, anonKey, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await client.auth.getUser();
  if (error) return null;

  return data.user;
}
