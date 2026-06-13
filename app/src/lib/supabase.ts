import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const supabaseUrl = 'https://gbxemgfdegzaglsrhawa.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdieGVtZ2ZkZWd6YWdsc3JoYXdhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg5Mzc4NDksImV4cCI6MjA5NDUxMzg0OX0.KNloSpl1TfxcRoMgtFIHKGs--K0SgQ4ONoLC7NHDlBc';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
