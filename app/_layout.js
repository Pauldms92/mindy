// app/onboarding/_layout.js
import { Stack } from 'expo-router';
import { View, StatusBar } from 'react-native';
import { OnboardingProvider } from '../lib/OnboardingContext';

export default function OnboardingLayout() {
  return (
    <OnboardingProvider>
      <View style={{ flex: 1 }}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        <Stack screenOptions={{ headerShown: false }} />
      </View>
    </OnboardingProvider>
  );
}
