import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { useStore } from '../store/useStore';
import { View, StatusBar } from 'react-native';
import { OnboardingProvider } from '../lib/OnboardingContext';

export default function RootLayout() {
  const initAuth = useStore(s => s.initAuth);

  useEffect(() => { 
    initAuth(); 
  }, []);

  return (
    <OnboardingProvider>
      <View style={{ flex: 1, backgroundColor: '#fff' }}>
        <StatusBar barStyle="dark-content" />
        <Stack screenOptions={{ headerShown: false }} />
      </View>
    </OnboardingProvider>
  );
}
