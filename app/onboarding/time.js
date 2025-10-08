// app/onboarding/time.js
import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';

export default function Time() {
  const router = useRouter();

  return (
    <View style={{ flex:1, justifyContent:'center', alignItems:'center', padding:24 }}>
      <Text style={{ fontSize:20, fontWeight:'600', marginBottom:20 }}>
        De combien de temps disposes-tu chaque jour ?
      </Text>

      {["5 min", "10 min", "15 min"].map((t) => (
        <TouchableOpacity
          key={t}
          onPress={() => router.push('/plan')}
          style={{
            padding:14,
            borderRadius:10,
            borderWidth:1,
            borderColor:'#7C4DFF',
            marginBottom:10
          }}
        >
          <Text>{t}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}
