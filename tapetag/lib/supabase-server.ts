import { createClient } from "@supabase/supabase-js";

export const supabaseServer = () =>
  createClient(
    process.env.SUPABASE_URL!,                 // ⚠️ pas NEXT_PUBLIC
    process.env.SUPABASE_SERVICE_ROLE_KEY!,    // ⚠️ service role (serveur uniquement)
    {
      auth: { persistSession: false },
    }
  );

