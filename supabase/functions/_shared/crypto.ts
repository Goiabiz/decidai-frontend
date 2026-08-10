const encoder = new TextEncoder();
const decoder = new TextDecoder();

function base64Encode(bytes: Uint8Array): string {
  let binary = "";
  bytes.forEach((b) => binary += String.fromCharCode(b));
  return btoa(binary);
}

function base64Decode(value: string): Uint8Array {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function getAesKey(): Promise<CryptoKey> {
  const raw = Deno.env.get("RADAR_SECRET_KEY");
  if (!raw) throw new Error("RADAR_SECRET_KEY não configurado.");
  const bytes = raw.length === 32 ? encoder.encode(raw) : base64Decode(raw);
  if (bytes.length !== 32) throw new Error("RADAR_SECRET_KEY precisa ter 32 bytes.");
  return await crypto.subtle.importKey("raw", bytes, { name: "AES-GCM" }, false, ["encrypt", "decrypt"]);
}

export async function encryptSecret(secret: string): Promise<string> {
  const key = await getAesKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, encoder.encode(secret)));
  return `aes-gcm:v1:${base64Encode(iv)}:${base64Encode(encrypted)}`;
}

export async function decryptSecret(ciphertext: string | null | undefined): Promise<string | null> {
  if (!ciphertext || !ciphertext.startsWith("aes-gcm:v1:")) return null;
  const [, , iv64, data64] = ciphertext.split(":");
  const key = await getAesKey();
  const decrypted = await crypto.subtle.decrypt({ name: "AES-GCM", iv: base64Decode(iv64) }, key, base64Decode(data64));
  return decoder.decode(decrypted);
}

export function secretHint(secret: string): string {
  if (!secret) return "";
  if (secret.length <= 8) return "••••";
  return `${secret.slice(0, 3)}••••${secret.slice(-4)}`;
}
