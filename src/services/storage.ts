import { universoSupabase } from '../lib/supabase';

/** Envia a foto pro bucket real "avatars" (público, path prefixado por cliente) e devolve a URL pública. */
export async function uploadAvatar(clienteId: string, usuarioId: string, file: File): Promise<string> {
  if (!universoSupabase) throw new Error('Supabase (universo-conectasus) não configurado.');

  const extension = file.name.split('.').pop() || 'jpg';
  const path = `${clienteId}/${usuarioId}.${extension}`;

  const { error } = await universoSupabase.storage.from('avatars').upload(path, file, { upsert: true, cacheControl: '3600' });
  if (error) throw error;

  const { data } = universoSupabase.storage.from('avatars').getPublicUrl(path);
  return `${data.publicUrl}?v=${Date.now()}`;
}
