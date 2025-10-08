// app/onboarding/topics.js
import { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { supabase } from '../../lib/supabase';

export default function Topics() {
  const [loading, setLoading] = useState(true);
  const [topics, setTopics] = useState([]);

  useEffect(() => {
    (async () => {
      // charge depuis la DB pour éviter les UUID hardcodés
      const { data, error } = await supabase
        .from('topics')
        .select('id,title,slug')
        .order('title');
      if (error) console.log('topics error:', error);
      setTopics(data || []);
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return (
      <View style={{ flex:1, justifyContent:'center', alignItems:'center' }}>
        <ActivityIndicator />
        <Text>Chargement des thèmes…</Text>
      </View>
    );
  }

  return (
    <ScrollView style={{ flex:1, padding:24 }}>
      <Text style={{ fontSize:22, fontWeight:'700', marginBottom:16 }}>
        Choisis ton thème
      </Text>

      {topics.map(t => (
        <TouchableOpacity
          key={t.id}
          onPress={() => {
            // 👇 on ROUTE vers le quiz avec le topicId (UUID)
            router.push({ pathname: '/quiz', params: { topicId: t.id } });
          }}
          style={{
            padding:16,
            backgroundColor:'#EFE9FF',
            borderRadius:12,
            marginBottom:12,
            borderWidth:1,
            borderColor:'#DAD4FF'
          }}
        >
          <Text style={{ fontSize:16, fontWeight:'600' }}>{t.title}</Text>
          <Text style={{ fontSize:12, color:'#666' }}>{t.slug}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}
