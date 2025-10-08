import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { useStore } from '../store/useStore';
import { View, StatusBar } from 'react-native';

export default function RootLayout() {
  const initUser = useStore(s => s.initUser);

  useEffect(() => { initUser(); }, []);

  return (
    <View style={{ flex:1, backgroundColor:'#fff' }}>
      <StatusBar barStyle="dark-content" />
      <Stack screenOptions={{ headerShown:false }} />
    </View>
  );
}
