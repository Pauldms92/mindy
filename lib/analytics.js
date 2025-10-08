
import { supabase } from './supabase.js';

export async function logEvent(name, props = {}, userId = null) {
  try {
    const { error } = await supabase.from('app_events').insert({
      name,
      props,
      user_id: userId || 'guest'
    });
    if (error) throw error;
    // Optionnel: console.log('Event logged:', name, props);
  } catch (e) {
    console.warn('logEvent error', e.message);
  }
}
