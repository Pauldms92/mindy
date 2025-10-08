import { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { supabase } from '../lib/supabase.js';
import { router } from 'expo-router';

export default function Plan() {
  const [lessons, setLessons] = useState([]);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('lessons')
        .select('id, title, duration_min')
        .order('order_index', { ascending: true })
        .limit(3);
      setLessons(data || []);
    })();
  }, []);

  return (
    <View style={{ flex:1, padding:24 }}>
      <Text style={{ fontSize:22, fontWeight:'700', marginBottom:12 }}>Ton plan pour la semaine 1</Text>
      {lessons.map(l=>(
        <TouchableOpacity key={l.id} onPress={()=>router.push({ pathname:'/lesson', params:{ id:l.id }})}
          style={{ padding:16, borderRadius:12, borderWidth:1, borderColor:'#E6E0FF', marginVertical:6 }}>
          <Text style={{ fontSize:16, fontWeight:'600' }}>{l.title}</Text>
          <Text style={{ color:'#64748B' }}>{l.duration_min} min</Text>
        </TouchableOpacity>
      ))}
      <TouchableOpacity onPress={()=>router.push({ pathname:'/lesson', params:{ id: lessons[0]?.id }})}
        style={{ marginTop:16, backgroundColor:'#6C4CF7', paddingVertical:16, borderRadius:12, alignItems:'center' }}>
        <Text style={{ color:'#fff', fontWeight:'600' }}>Démarrer la 1ʳᵉ leçon</Text>
      </TouchableOpacity>
    </View>
  );
}
