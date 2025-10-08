import { useLocalSearchParams, router } from 'expo-router';
import { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import { supabase } from '../../lib/supabase';

export default function QuestionsByTopic() {
  const { topicId } = useLocalSearchParams(); // slug (ex: "crypto")
  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState([]);

  useEffect(() => {
    (async () => {
      setLoading(true);

      // 1️⃣ Chercher l’UUID du topic via son slug
      const { data: topic, error: tErr } = await supabase
        .from('topics')
        .select('id')
        .eq('slug', topicId)
        .single();

      if (tErr || !topic) {
        console.error('Topic introuvable:', tErr);
        setQuestions([]);
        setLoading(false);
        return;
      }

      // 2️⃣ Charger les questions reliées à ce topic_id
      const { data: qs, error: qErr } = await supabase
        .from('questions')
        .select('id, stem')
        .eq('topic_id', topic.id);

      if (qErr) console.error(qErr);
      setQuestions(qs || []);
      setLoading(false);
    })();
  }, [topicId]);

  if (loading) {
    return (
      <View style={{ flex:1, justifyContent:'center', alignItems:'center' }}>
        <ActivityIndicator />
        <Text>Chargement des questions…</Text>
      </View>
    );
  }

  return (
    <ScrollView style={{ flex:1, padding:24 }}>
      <Text style={{ fontSize:20, fontWeight:'bold', marginBottom:16 }}>
        Questions du thème {topicId}
      </Text>

      {questions.length === 0 && (
        <Text>Aucune question pour ce thème pour le moment.</Text>
      )}

      {questions.map(q => (
        <TouchableOpacity
          key={q.id}
          style={{
            padding:16,
            backgroundColor:'#EFE9FF',
            marginBottom:12,
            borderRadius:12
          }}
          onPress={() => router.push({ pathname: '/quiz', params: { id: q.id } })}
        >
          <Text style={{ fontSize:16 }}>{q.stem}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}
