// app/onboarding/time.js
import { useContext, useEffect } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { ProgressBar } from 'react-native-paper';
import { OnboardingContext } from '../../lib/OnboardingContext';

export default function Time() {
  const router = useRouter();
  const { currentStep, setCurrentStep, totalSteps } = useContext(OnboardingContext);

  useEffect(() => {
    setCurrentStep(2); // étape 2
  }, []);

  const times = [
    { label: "5 min", value: 5 },
    { label: "10 min", value: 10 },
    { label: "15 min", value: 15 }
  ];

  const onSelect = (t) => {
    // ici tu pourrais stocker la préférence en DB ou AsyncStorage
    console.log("Temps choisi:", t);
    router.push('/onboarding/topics');
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

      <Text style={{ fontSize:22, fontWeight:'700', marginBottom:20 }}>
        De combien de temps disposes-tu chaque jour ?
      </Text>

      {times.map((t) => (
        <TouchableOpacity
          key={t.value}
          onPress={() => onSelect(t.value)}
          style={{
            padding:16,
            borderRadius:12,
            borderWidth:2,
            borderColor:'#7C4DFF',
            marginBottom:12,
            backgroundColor:'#EFE9FF'
          }}
        >
          <Text style={{ fontSize:16 }}>{t.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}
