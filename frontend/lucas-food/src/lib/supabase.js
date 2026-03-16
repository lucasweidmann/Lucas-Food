import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL;
const anon = process.env.SUPABASE_ANON_KEY;
const service = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !anon || !service) {
  throw new Error("Variáveis do Supabase não configuradas");
}

export const supabase = createClient(url, service, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

export const supabaseAuth = createClient(url, anon, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});
