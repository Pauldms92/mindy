import 'react-native-get-random-values';      
import 'react-native-url-polyfill/auto';     

import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Compat Expo SDKs récents & anciens
const extra = Constants.expoConfig?.extra ?? Constants.manifest?.extra;

export const supabase = createClient(
  extra.supabaseUrl, 
  extra.supabaseAnonKey,
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      // Activer la détection d'URL sur toutes les plateformes
      // pour que Supabase gère automatiquement les deep links OAuth
      detectSessionInUrl: true,
    },
  }
);
