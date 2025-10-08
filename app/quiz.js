// app/quiz.js
import { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '../lib/supabase';

export default function Quiz() {
  const params = useLocalSearchParams();
  const topicId = Array.isArray(params?.topicId) ? params.topicId[0] : params?.topicId;
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);
  const [questions, setQuestions] = useState([]); // [{id, stem, answers:[]}]
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!topicId) {
        setErrorMsg("Aucun thème sélectionné (topicId manquant).");
        setLoading(false);
        return;
      }

      // 1) Récupération des questions du thème
      const { data: qs, error: qErr } = await supabase
        .from('questions')
        .select('id, stem')
        .eq('topic_id', topicId);

      if (qErr) {
        if (mounted) {
          setErrorMsg(`Erreur chargement questions: ${qErr.message}`);
          setLoading(false);
        }
        return;
      }

      // 2) Pour chaque question, on charge ses réponses
      const withAnswers = await Promise.all(
        (qs || []).map(async (q) => {
          const { data: a, error: aErr } = await supabase
            .from('answers')
            .select('id, label, is_correct, explanation')
            .eq('question_id', q.id);

          if (aErr) console.log('Erreur réponses:', aErr);
          return { ...q, answers: a || [] };
        })
      );

      if (mounted) {
        setQuestions(withAnswers);
        setLoading(false);
      }
    })();

    return () => { mounted = false; };
  }, [topicId]);

  // Sélection d'une réponse
  const onPick = (answer) => setSelectedAnswer(answer);

  // Passer à la question suivante
  const nextQuestion = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((i) => i + 1);
      setSelectedAnswer(null);
    } else {
      alert("Quiz terminé ✅");
      router.push('/plan'); // 🔥 redirige vers plan.js (à créer)
    }
  };

  // UI states
  if (loading) {
    return (
      <View style={{ flex:1, justifyContent:'center', alignItems:'center' }}>
        <ActivityIndicator />
        <Text style={{ marginTop:8 }}>Chargement…</Text>
      </View>
    );
  }

  if (errorMsg) {
    return (
      <View style={{ flex:1, padding:24, justifyContent:'center', alignItems:'center' }}>
        <Text style={{ color:'red', textAlign:'center' }}>{errorMsg}</Text>
        <TouchableOpacity onPress={() => router.replace('/onboarding/topics')} style={{ marginTop:12 }}>
          <Text style={{ color:'#7C4DFF' }}>Choisir un thème</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!questions.length) {
    return (
      <View style={{ flex:1, padding:24, justifyContent:'center', alignItems:'center' }}>
        <Text>Aucune question pour ce thème.</Text>
        <TouchableOpacity onPress={() => router.replace('/onboarding/topics')} style={{ marginTop:12 }}>
          <Text style={{ color:'#7C4DFF' }}>Changer de thème</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const currentQ = questions[currentIndex];

  return (
    <View style={{ flex:1, padding:24 }}>
      <Text style={{ fontSize:12, color:'#666', marginBottom:4 }}>
        Question {currentIndex + 1} / {questions.length}
      </Text>
      <Text style={{ fontSize:20, fontWeight:'600', marginBottom:12 }}>
        {currentQ.stem}
      </Text>

      {currentQ.answers.map((a) => (
        <TouchableOpacity
          key={a.id}
          onPress={() => onPick(a)}
          style={{
            padding:14,
            borderRadius:10,
            borderWidth:1,
            borderColor: selectedAnswer?.id === a.id ? '#7C4DFF' : '#E5E7EB',
            backgroundColor: selectedAnswer?.id === a.id ? '#EFE9FF' : '#FFFFFF',
            marginBottom:10
          }}
        >
          <Text style={{ fontSize:16 }}>{a.label}</Text>
        </TouchableOpacity>
      ))}

      {selectedAnswer && (
        <View style={{ marginTop:16, padding:12, borderRadius:10, backgroundColor:'#F5F3FF' }}>
          <Text style={{ fontWeight:'700', color: selectedAnswer.is_correct ? 'green' : 'red' }}>
            {selectedAnswer.is_correct ? '✅ Bonne réponse' : '❌ Mauvaise réponse'}
          </Text>
          {!!selectedAnswer.explanation && (
            <Text style={{ marginTop:6, fontStyle:'italic' }}>{selectedAnswer.explanation}</Text>
          )}

          <TouchableOpacity
            onPress={nextQuestion}
            style={{ marginTop:16, backgroundColor:'#7C4DFF', padding:12, borderRadius:10 }}
          >
            <Text style={{ color:'#fff', textAlign:'center', fontWeight:'600' }}>
              {currentIndex < questions.length - 1 ? 'Question suivante' : 'Terminer'}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}
