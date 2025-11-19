import { router } from 'expo-router';
import { useEffect } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useStore } from '../store/useStore';

export default function Index() {
  const { user, loading } = useStore();
  
  console.log('📱 Index - Rendu - loading:', loading, 'user:', user ? user.email : 'null');

  useEffect(() => {
    console.log('🔄 Index - useEffect - loading:', loading, 'user:', user ? user.email : 'null');
    
    // Redirection automatique basée sur l'état d'authentification
    if (!loading) {
      if (!user) {
        console.log('🚀 Index - Redirection vers /login');
        router.replace('/login');
      } else {
        console.log('🚀 Index - Redirection vers /home pour user:', user.email);
        router.replace('/home');
      }
    } else {
      console.log('⏳ Index - En attente du chargement...');
    }
  }, [user, loading]);

  // Écran de chargement pendant l'initialisation
  if (loading) {
    return (
      <View style={{ flex:1, alignItems:'center', justifyContent:'center', backgroundColor:'#fff' }}>
        <ActivityIndicator size="large" color="#6C4CF7" />
        <Text style={{ marginTop:16, color:'#666', fontSize:16 }}>
          Chargement...
        </Text>
      </View>
    );
  }

  // Si pas d'utilisateur, on laisse le useEffect gérer la redirection
  if (!user) {
    return (
      <View style={{ flex:1, alignItems:'center', justifyContent:'center', backgroundColor:'#fff' }}>
        <ActivityIndicator size="large" color="#6C4CF7" />
      </View>
    );
  }

  // Écran principal pour les utilisateurs connectés
  return (
    <View style={{ flex:1, alignItems:'center', justifyContent:'center', padding:24 }}>
      <Text style={{ fontSize:26, fontWeight:'700', textAlign:'center', color:'#6C4CF7' }}>
        Salut {user?.email?.split('@')[0] || 'utilisateur'} ! 👋
      </Text>
      <Text style={{ fontSize:18, textAlign:'center', color:'#666', marginTop:12, marginBottom:32 }}>
        Prêt à apprendre les compétences modernes en 5 min/jour ?
      </Text>
      
      <TouchableOpacity onPress={()=>router.push('/onboarding/topics')}
        style={{ backgroundColor:'#6C4CF7', paddingVertical:16, paddingHorizontal:24, borderRadius:12, marginBottom:16 }}>
        <Text style={{ color:'#fff', fontWeight:'600', fontSize:16 }}>Commencer l'aventure</Text>
      </TouchableOpacity>

      {/* Bouton de déconnexion temporaire */}
      <TouchableOpacity 
        onPress={() => useStore.getState().signOut()}
        style={{ paddingVertical:12, paddingHorizontal:20, borderRadius:8, borderWidth:1, borderColor:'#ddd' }}
      >
        <Text style={{ color:'#666', fontSize:14 }}>Se déconnecter</Text>
      </TouchableOpacity>
    </View>
  );
}
