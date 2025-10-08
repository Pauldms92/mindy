import { router } from 'expo-router';
import { View, Text, TouchableOpacity } from 'react-native';

export default function Index() {
  return (
    <View style={{ flex:1, alignItems:'center', justifyContent:'center', padding:24 }}>
      <Text style={{ fontSize:26, fontWeight:'700', textAlign:'center', color:'#6C4CF7' }}>
        Apprends les compétences modernes en 5 min/jour
      </Text>
      <TouchableOpacity onPress={()=>router.push('/onboarding/topics')}
        style={{ marginTop:24, backgroundColor:'#6C4CF7', paddingVertical:16, paddingHorizontal:24, borderRadius:12 }}>
        <Text style={{ color:'#fff', fontWeight:'600' }}>Commencer</Text>
      </TouchableOpacity>
    </View>
  );
}
