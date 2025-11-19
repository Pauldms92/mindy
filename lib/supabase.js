import 'react-native-get-random-values';      
import 'react-native-url-polyfill/auto';     

import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';

// Compat Expo SDKs récents & anciens
const extra = Constants.expoConfig?.extra ?? Constants.manifest?.extra;

export const supabase = createClient(extra.supabaseUrl, extra.supabaseAnonKey);
