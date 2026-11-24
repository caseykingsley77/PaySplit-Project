import { createClient, type SupabaseClient } from '@supabase/supabase-js';
let publicClient: SupabaseClient | null = null;
export function supabaseBrowser() { const url=process.env.NEXT_PUBLIC_SUPABASE_URL, key=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY; if(!url||!key) throw new Error('Account service is not configured'); if (!publicClient) publicClient=createClient(url,key,{auth:{persistSession:true,autoRefreshToken:true}}); return publicClient; }
export function supabaseAdmin() { const url=process.env.NEXT_PUBLIC_SUPABASE_URL, key=process.env.SUPABASE_SERVICE_ROLE_KEY; if(!url||!key) throw new Error('Server database credentials not configured'); return createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}}); }
