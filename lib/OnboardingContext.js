// lib/OnboardingContext.js
import { createContext, useContext, useState } from 'react';

const OnboardingContext = createContext();

export function OnboardingProvider({ children }) {
  const [step, setStep] = useState(0);
  const [totalSteps, setTotalSteps] = useState(5);

  return (
    <OnboardingContext.Provider value={{ step, setStep, totalSteps, setTotalSteps }}>
      {children}
    </OnboardingContext.Provider>
  );
}

export const useOnboarding = () => useContext(OnboardingContext);
