import { createClient } from "@supabase/supabase-js";
import { supabaseAnonKey, supabaseUrl } from "@/lib/nl/env-names";

const url = supabaseUrl(process.env);
const anonKey = supabaseAnonKey(process.env);

export const supabase = url && anonKey ? createClient(url, anonKey) : null;
