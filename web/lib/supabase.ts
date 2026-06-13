import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://gbxemgfdegzaglsrhawa.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdieGVtZ2ZkZWd6YWdsc3JoYXdhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg5Mzc4NDksImV4cCI6MjA5NDUxMzg0OX0.KNloSpl1TfxcRoMgtFIHKGs--K0SgQ4ONoLC7NHDlBc';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
