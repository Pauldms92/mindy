import { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { supabase } from '../../lib/supabase.js';
import { router } from 'expo-router';

export default function Diag() {
  const [questions, setQuestions] = useState([]);
  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState(null);
  const [answers, setAnswers] = useState([]);

  useEffect(() => {
    // prend 3 premières questions (finance) pour MVP
    (async () => {
      const { data: q } = await supabase.from('questions').select('id, stem').limit(3);
      const qIds = q.map(x=>x.id);
      const { data: all } = await supabase.from('answers').select('id, question_id, label, is_correct');
      const merged = q.map(qq => ({
        ...qq,
        choices: all.filter(a=>a.question_id===qq.id)
      }));
      setQuestions(merged);
    })();
  }, []);

  if (!questions.length) return <View style={{flex:1,justifyContent:'center',alignItems:'center'}}><Text>Chargement…</Text></View>;

  const q = questions[idx];

  const onValidate = () => {
    if (selected==null) return;
    const choice = q.choices[selected];
    setAnswers([...answers, { question_id: q.id, correct: !!choice?.is_correct }]);
    setSelected(null);
    if (idx < questions.length-1) setIdx(idx+1);
    else router.replace('/plan');
  };

  return (
    <View style={{ flex:1, padding:24 }}>
      <Text style={{ fontSize:16, color:'#64748B' }}>Question {idx+1} / {questions.length}</Text>
      <Text style={{ fontSize:22, fontWeight:'700', marginVertical:12 }}>{q.stem}</Text>

      {q.choices.map((c,i)=>(
        <TouchableOpacity key={c.id} onPress={()=>setSelected(i)}
          style={{
            padding:16, borderRadius:12, marginVertical:6,
            borderWidth:2, borderColor: selected===i ? '#6C4CF7' : '#E6E0FF',
            backgroundColor:'#fff'
          }}>
          <Text style={{ fontSize:16 }}>{c.label}</Text>
        </TouchableOpacity>
      ))}

      <TouchableOpacity onPress={onValidate}
        style={{ marginTop:16, backgroundColor:'#6C4CF7', paddingVertical:16, borderRadius:12, alignItems:'center' }}>
        <Text style={{ color:'#fff', fontWeight:'600' }}>{idx < questions.length-1 ? 'Valider' : 'Voir mon plan'}</Text>
      </TouchableOpacity>
    </View>
  );
}
