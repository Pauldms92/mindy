import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { View, Text, Image, ScrollView, TouchableOpacity } from 'react-native';
import { supabase } from '../lib/supabase.js';
import { router } from 'expo-router';

export default function Lesson() {
  const { id } = useLocalSearchParams();
  const [blocks, setBlocks] = useState([]);

  useEffect(() => {
    (async () => {
      // pour MVP, s'il n'y a pas de blocks seedés, on en crée côté SQL plus tard
      const { data } = await supabase.from('lesson_blocks').select('type, payload').eq('lesson_id', id).order('order_index');
      setBlocks(data || []);
    })();
  }, [id]);

  return (
    <ScrollView style={{ flex:1, padding:24 }}>
      {blocks.map((b,idx)=>(
        <View key={idx} style={{ marginBottom:16 }}>
          {b.type==='text' && <Text style={{ fontSize:16, lineHeight:24 }}>{b.payload.md}</Text>}
          {b.type==='image' && <Image source={{ uri:b.payload.url }} style={{ width:'100%', height:180, borderRadius:12 }} />}
          {b.type==='quiz' && (
            <TouchableOpacity
              onPress={() => router.push(`/quiz?id=${String(b.payload.question_id)}`)}
              style={{ backgroundColor:'#E6E0FF', padding:16, borderRadius:12 }}
            >
              <Text>Question rapide →</Text>
            </TouchableOpacity>

          )}
        </View>
      ))}
    </ScrollView>
  );
}
