import { decryptSecret } from "./crypto.ts";

type CredentialRow = { credential_type: string; secret_ciphertext: string | null };
type ConnectionRow = { id: string; base_url: string | null; auth_type: string; config: Record<string, unknown> };

export function normalizeBaseUrl(url: string | null): string {
  if (!url) throw new Error("URL base não informada.");
  const clean = url.trim().replace(/\/+$/, "");
  if (!/^https?:\/\//i.test(clean)) throw new Error("URL base precisa começar com http:// ou https://.");
  return clean;
}

export function joinUrl(baseUrl: string, pathTemplate = ""): string {
  const path = String(pathTemplate || "").trim();
  return !path || path === "/" ? baseUrl : `${baseUrl}/${path.replace(/^\/+/, "")}`;
}

export function applyPathParams(path: string, params: Record<string, unknown> = {}): string {
  return path.replace(/\{([^}]+)\}/g, (_m, key) => encodeURIComponent(String(params[key] ?? "")));
}

export function appendQuery(url: string, query: Record<string, unknown> = {}): string {
  const u = new URL(url);
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") u.searchParams.set(key, String(value));
  });
  return u.toString();
}

export async function buildAuthHeaders(connection: ConnectionRow, credentials: CredentialRow[]): Promise<Record<string, string>> {
  const headers: Record<string, string> = {};
  const authType = connection.auth_type || "none";
  const firstSecret = await decryptSecret(credentials[0]?.secret_ciphertext);
  if ((authType === "bearer" || authType === "oauth2") && firstSecret) headers.Authorization = `Bearer ${firstSecret}`;
  if (authType === "api_key_header" && firstSecret) headers[String(connection.config?.credential_header_name || "x-api-key")] = firstSecret;
  if (authType === "basic" && firstSecret) headers.Authorization = `Basic ${btoa(firstSecret)}`;
  return headers;
}

export async function fetchWithTimeout(url: string, init: RequestInit = {}, timeoutMs = 15000): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try { return await fetch(url, { ...init, signal: controller.signal }); }
  finally { clearTimeout(timer); }
}

export function safeBodyPreview(text: string, max = 6000): string {
  return !text ? "" : text.length > max ? `${text.slice(0, max)}...` : text;
}

export function flattenJsonFields(value: unknown, prefix = "", max = 80): Array<{ path: string; key: string; dataType: string; sampleValue: string }> {
  const out: Array<{ path: string; key: string; dataType: string; sampleValue: string }> = [];
  const walk = (node: unknown, path: string) => {
    if (out.length >= max) return;
    if (Array.isArray(node)) { if (node.length > 0) walk(node[0], path ? `${path}[]` : "[]"); return; }
    if (node && typeof node === "object") {
      for (const [k, v] of Object.entries(node as Record<string, unknown>)) {
        const next = path ? `${path}.${k}` : k;
        if (v && typeof v === "object") walk(v, next);
        else out.push({ path: next, key: k, dataType: typeof v === "number" ? "number" : typeof v === "boolean" ? "boolean" : "text", sampleValue: v == null ? "" : String(v).slice(0, 240) });
      }
    }
  };
  walk(value, prefix);
  return out;
}
