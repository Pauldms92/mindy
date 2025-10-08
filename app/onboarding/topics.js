// app/onboarding/topics.js
import { useContext, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import { OnboardingContext } from '../../lib/OnboardingContext';
import { ProgressBar } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';

export default function Topics() {
  const { currentStep, setCurrentStep, totalSteps } = useContext(OnboardingContext);
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [topics, setTopics] = useState([]);

  useEffect(() => {
    setCurrentStep(3); // écran 3
    (async () => {
      const { data, error } = await supabase
        .from('topics')
        .select('id, title, slug')
        .order('title');

      if (error) {
        console.error('topics error:', error);
      } else {
        setTopics(data || []);
      }
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
      {/* ProgressBar */}
      <View style={{ marginBottom:16 }}>
        <ProgressBar 
          progress={currentStep / totalSteps}
          color="#7C4DFF"
          style={{ height:6, borderRadius:4 }}
        />
      </View>

      <Text style={{ fontSize:22, fontWeight:'700', marginBottom:16 }}>
        Choisis ton thème
      </Text>

      {topics.map((t) => (
        <TouchableOpacity
          key={t.id}
          onPress={() => router.push({ pathname: '/quiz', params: { topicId: t.id } })}
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
