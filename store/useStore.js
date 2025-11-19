import { create } from 'zustand';
import { nanoid } from 'nanoid/non-secure';

export const useStore = create((set, get) => ({
  userId: null,
  initUser() {
    if (!get().userId) set({ userId: `guest_${Date.now()}_${Math.floor(Math.random()*1000)}` });
  },
  topics: [],
  minutesPerDay: 5,
  setTopics: (topics) => set({ topics }),
  setMinutes: (m) => set({ minutesPerDay: m }),
}));
