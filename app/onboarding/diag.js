// app/onboarding/diag.js
import { useEffect, useState, useContext } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'expo-router';
import { ProgressBar } from 'react-native-paper';
import { OnboardingContext } from '../../lib/OnboardingContext';

export default function Diag() {
  const [questions, setQuestions] = useState([]);
  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [loading, setLoading] = useState(true);

  const router = useRouter();
  const { currentStep, setCurrentStep, totalSteps } = useContext(OnboardingContext);

  useEffect(() => {
    setCurrentStep(1); // étape 1 dans le flow

    (async () => {
      const { data: q, error: qErr } = await supabase
        .from('questions')
        .select('id, stem')
        .limit(3);

      if (qErr) {
        console.error('Erreur questions:', qErr);
        setLoading(false);
        return;
      }

      const qIds = q.map(x => x.id);
      const { data: all, error: aErr } = await supabase
        .from('answers')
        .select('id, question_id, label, is_correct');

      if (aErr) console.error('Erreur answers:', aErr);

      const merged = q.map(qq => ({
        ...qq,
        choices: (all || []).filter(a => a.question_id === qq.id)
      }));

      setQuestions(merged);
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return (
      <View style={{ flex:1, justifyContent:'center', alignItems:'center' }}>
        <ActivityIndicator />
        <Text style={{ marginTop:8 }}>Chargement du diagnostic…</Text>
      </View>
    );
  }

  if (!questions.length) {
    return (
      <View style={{ flex:1, justifyContent:'center', alignItems:'center', padding:24 }}>
        <Text>Aucune question disponible.</Text>
      </View>
    );
  }

  const q = questions[idx];

  const onValidate = () => {
    if (selected == null) return;
    const choice = q.choices[selected];
    setAnswers([...answers, { question_id: q.id, correct: !!choice?.is_correct }]);
    setSelected(null);

    if (idx < questions.length - 1) {
      setIdx(idx + 1);
    } else {
      router.replace('/onboarding/time'); // suite logique après diag
    }
  };

  return (
    <View style={{ flex:1, padding:24 }}>
      {/* ProgressBar */}
      <View style={{ marginBottom:16 }}>
        <ProgressBar
          progress={currentStep / totalSteps}
          color="#7C4DFF"
          style={{ height:6, borderRadius:4 }}
        />
      </View>

      <Text style={{ fontSize:14, color:'#64748B' }}>
        Question {idx + 1} / {questions.length}
      </Text>
      <Text style={{ fontSize:22, fontWeight:'700', marginVertical:12 }}>
        {q.stem}
      </Text>

      {q.choices.map((c, i) => (
        <TouchableOpacity
          key={c.id}
          onPress={() => setSelected(i)}
          style={{
            padding:16,
            borderRadius:12,
            marginVertical:6,
            borderWidth:2,
            borderColor: selected === i ? '#6C4CF7' : '#E6E0FF',
            backgroundColor:'#fff'
          }}
        >
          <Text style={{ fontSize:16 }}>{c.label}</Text>
        </TouchableOpacity>
      ))}

      <TouchableOpacity
        onPress={onValidate}
        style={{
          marginTop:16,
          backgroundColor: selected == null ? '#CCC' : '#6C4CF7',
          paddingVertical:16,
          borderRadius:12,
          alignItems:'center'
        }}
        disabled={selected == null}
      >
        <Text style={{ color:'#fff', fontWeight:'600' }}>
          {idx < questions.length - 1 ? 'Valider' : 'Continuer'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}
