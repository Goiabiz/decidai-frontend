import { createClient } from '@supabase/supabase-js';

const universoUrl = import.meta.env.VITE_SUPABASE_UNIVERSO_URL;
const universoAnonKey = import.meta.env.VITE_SUPABASE_UNIVERSO_ANON_KEY;

export const universoSupabase =
  universoUrl && universoAnonKey ? createClient(universoUrl, universoAnonKey) : null;

// O projeto Supabase "POC" (VITE_SUPABASE_POC_URL) não existe mais -- o host não resolve em DNS
// desde 28/08/2026. Antes este arquivo criava o cliente dele mesmo assim: `createClient` liga o
// auth (autoRefreshToken/persistSession) na hora do import, então o app disparava uma chamada a
// `/auth/v1/user` daquele projeto morto e o console de TODA página abria com
// `ERR_NAME_NOT_RESOLVED` -- ruído que fazia quem estivesse caçando um erro real tropeçar nele
// primeiro (relatado 2x pela frente E, 30/08). Nenhum uso real se perde ao não criar o cliente:
// os 3 chamadores em `services/operationalSupabase.ts` retornam antes de tocá-lo
// (ENABLE_SUPABASE_WRITES = false), e em `v36SecureApiFunctions.ts` ele era só um fallback que
// nunca poderia funcionar. Mantido como `null` exportado, em vez de removido, pra não forçar
// mudança nos call sites enquanto a decisão de schema desses 3 registros segue em aberto.
export const pocSupabase = null;

export const isUniversoConfigured = Boolean(universoUrl && universoAnonKey);
export const isPocConfigured = false;
