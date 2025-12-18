import { createClient } from "@supabase/supabase-js";
import { toast } from "sonner";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  toast.error("Variáveis de ambiente não configuradas");
  throw new Error("Variáveis de ambiente não configuradas");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
