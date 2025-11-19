import { create } from 'zustand';
import { Platform } from 'react-native';
import { supabase } from '../lib/supabase';

// Fonction pour obtenir la bonne URL de redirection selon la plateforme
const getRedirectUrl = () => {
  if (Platform.OS === 'web') {
    return typeof window !== 'undefined' ? window.location.origin : 'http://localhost:8081';
  }
  return 'exp://localhost:8081';
};

export const useStore = create((set, get) => ({
  user: null,
  session: null,
  loading: true,
  isLoadingTopics: false,
  isLoadingStats: false,
  
  // Initialiser l'authentification
  async initAuth() {
    try {
      console.log('🔐 initAuth - Chargement session...');
      const { data: { session } } = await supabase.auth.getSession();
      console.log('🔐 initAuth - Session:', session ? session.user?.email : 'null');
      
      // Toujours mettre loading: false après avoir vérifié la session
      set({ session, user: session?.user || null, loading: false });

      // Assurer le profil même si la session existe déjà (pas d'événement SIGNED_IN)
      if (session?.user) {
        await get().ensureUserProfile(session.user);
      }

      // Écouter les changements d'authentification
      supabase.auth.onAuthStateChange(async (event, session) => {
        console.log('🔔 Auth state change:', event, session?.user?.email || 'null');
        
        // Pour INITIAL_SESSION, ne pas changer loading car c'est déjà fait dans initAuth
        if (event === 'INITIAL_SESSION') {
          set({ session, user: session?.user || null });
        } else {
          set({ session, user: session?.user || null, loading: false });
        }
        
        // Si connexion réussie, créer/vérifier le profil
        if (event === 'SIGNED_IN' && session?.user) {
          await get().ensureUserProfile(session.user);
        }
      });
    } catch (error) {
      console.error('Erreur init auth:', error);
      set({ loading: false });
    }
  },

  // Forcer le refresh de la session (utile après stockage manuel des tokens)
  async refreshSession() {
    try {
      console.log('🔄 Refresh session forcé...');
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('❌ Erreur refresh session:', error);
        return null;
      }
      
      console.log('✅ Session refreshed:', session ? session.user?.email : 'null');
      set({ session, user: session?.user || null });
      
      if (session?.user) {
        await get().ensureUserProfile(session.user);
      }
      
      return session;
    } catch (error) {
      console.error('❌ Erreur refresh session:', error);
      return null;
    }
  },

  // Créer ou vérifier le profil utilisateur
  async ensureUserProfile(user) {
    try {
      // Vérifier si le profil existe
      const { data: existingProfile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (!existingProfile) {
        // Créer le profil
        const { error: profileError } = await supabase
          .from('user_profiles')
          .insert({
            user_id: user.id,
            display_name: user.user_metadata?.full_name || user.email?.split('@')[0],
          });

        if (!profileError) {
          // Créer le streak initial
          await supabase
            .from('streaks')
            .insert({
              user_id: user.id,
              current_days: 0,
              best_days: 0,
            });
        }
      }
    } catch (error) {
      console.error('Erreur ensureUserProfile:', error);
    }
  },

  // Connexion avec Google
  async signInWithGoogle() {
    try {
      const redirectUrl = getRedirectUrl();
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          skipBrowserRedirect: false,
        },
      });
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erreur Google Sign-In:', error);
      throw error;
    }
  },

  // Connexion avec email
  async signInWithEmail(email, password) {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
    } catch (error) {
      console.error('Erreur Email Sign-In:', error);
      throw error;
    }
  },

  // Inscription avec email
  async signUpWithEmail(email, password) {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });
      
      if (error) throw error;
      
      return data;
    } catch (error) {
      console.error('Erreur Sign-Up:', error);
      throw error;
    }
  },

  // Déconnexion
  async signOut() {
    try {
      console.log('🔴 Début de la déconnexion');
      
      // Essayer de déconnecter via Supabase, mais ne pas échouer si ça ne marche pas
      try {
        const { error } = await supabase.auth.signOut();
        if (error) {
          console.log('⚠️ Erreur Supabase signOut (ignorée):', error.message);
        } else {
          console.log('✅ Supabase signOut OK');
        }
      } catch (supabaseError) {
        console.log('⚠️ Erreur Supabase signOut (ignorée):', supabaseError.message);
      }

      // TOUJOURS forcer le reset local de l'état, même si Supabase échoue
      set({ session: null, user: null, loading: false });
      console.log('✅ État local réinitialisé');

      // Nettoyer AsyncStorage sur mobile
      if (Platform.OS !== 'web') {
        try {
          const AsyncStorage = require('@react-native-async-storage/async-storage').default;
          await AsyncStorage.multiRemove([
            'sb-gvqunhimugyjtzmrbisg-auth-token',
            'supabase.auth.token'
          ]);
          console.log('✅ AsyncStorage nettoyé');
        } catch (e) {
          console.log('⚠️ Erreur nettoyage AsyncStorage:', e);
        }
      }

      // Sur web: nettoyer l'URL pour enlever les fragments OAuth (#access_token ...)
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        const cleanUrl = window.location.origin + window.location.pathname;
        try {
          window.history.replaceState({}, document.title, cleanUrl);
          console.log('✅ URL nettoyée');
        } catch (e) {
          console.log('⚠️ Impossible de nettoyer l\'URL:', e);
        }
      }
      
      console.log('✅ Déconnexion terminée');
    } catch (error) {
      console.error('❌ Erreur inattendue lors de la déconnexion:', error);
      
      // Même en cas d'erreur inattendue, forcer la déconnexion locale
      set({ session: null, user: null, loading: false });
      console.log('✅ Déconnexion forcée localement');
    }
  },

  // Récupérer les topics
  async fetchTopics() {
    const state = get();
    if (state.isLoadingTopics) {
      console.log('⚠️ fetchTopics - Déjà en cours, ignoré');
      return [];
    }
    
    try {
      set({ isLoadingTopics: true });
      console.log('🏷️ fetchTopics - Début requête Supabase...');
      const { data, error } = await supabase
        .from('topics')
        .select('*')
        .order('created_at', { ascending: true });

      console.log('🏷️ fetchTopics - Requête terminée');
      if (error) throw error;
      console.log('🏷️ fetchTopics - Retour:', data?.length || 0, 'topics');
      return data || [];
    } catch (error) {
      console.error('❌ Erreur fetch topics:', error);
      return [];
    } finally {
      set({ isLoadingTopics: false });
    }
  },

  // Récupérer un topic par ID
  async fetchTopicById(topicId) {
    try {
      const { data, error } = await supabase
        .from('topics')
        .select('*')
        .eq('id', topicId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erreur fetch topic:', error);
      return null;
    }
  },

  // Récupérer une leçon par ID
  async fetchLessonById(lessonId) {
    try {
      const { data, error } = await supabase
        .from('lessons')
        .select('*')
        .eq('id', lessonId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erreur fetch lesson:', error);
      return null;
    }
  },

  // Récupérer les stats de l'utilisateur
  async fetchUserStats(userId) {
    const state = get();
    if (state.isLoadingStats) {
      console.log('⚠️ fetchUserStats - Déjà en cours, ignoré');
      return {
        streak: 0,
        bestStreak: 0,
        xp: 0,
        lessonsCompleted: 0,
      };
    }
    
    try {
      set({ isLoadingStats: true });
      console.log('📊 fetchUserStats - Début pour user:', userId);
      
      // Récupérer le streak
      console.log('🔥 Récupération streak...');
      const { data: streakData } = await supabase
        .from('streaks')
        .select('*')
        .eq('user_id', userId)
        .single();
      console.log('🔥 Streak récupéré:', streakData);

      // Récupérer le total XP
      console.log('⭐ Récupération XP...');
      const { data: xpData } = await supabase
        .from('xp_events')
        .select('amount')
        .eq('user_id', userId);
      console.log('⭐ XP récupéré:', xpData?.length || 0, 'événements');

      const totalXp = xpData?.reduce((sum, event) => sum + event.amount, 0) || 0;

      // Récupérer le nombre de leçons complétées
      console.log('📚 Récupération progress...');
      const { data: progressData } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'done');
      console.log('📚 Progress récupéré:', progressData?.length || 0, 'leçons');

      const stats = {
        streak: streakData?.current_days || 0,
        bestStreak: streakData?.best_days || 0,
        xp: totalXp,
        lessonsCompleted: progressData?.length || 0,
      };

      console.log('✅ fetchUserStats - Terminé:', stats);
      return stats;
    } catch (error) {
      console.error('❌ Erreur fetch stats:', error);
      return {
        streak: 0,
        bestStreak: 0,
        xp: 0,
        lessonsCompleted: 0,
      };
    } finally {
      set({ isLoadingStats: false });
    }
  },

  // Récupérer les chapters d'un topic
  async fetchChapters(topicId) {
    try {
      console.log('🔍 fetchChapters pour topic_id:', topicId);
      
      const { data, error } = await supabase
        .from('chapters')
        .select('*')
        .eq('topic_id', topicId)
        .eq('is_published', true)
        .order('order_index', { ascending: true });

      console.log('📊 Réponse Supabase chapters:', { data, error });

      if (error) {
        console.error('❌ Erreur Supabase:', error);
        throw error;
      }
      
      console.log('✅ Chapters trouvés:', data?.length || 0);
      return data || [];
    } catch (error) {
      console.error('❌ Erreur fetch chapters:', error);
      return [];
    }
  },

  // Récupérer un chapter par ID
  async fetchChapterById(chapterId) {
    try {
      const { data, error } = await supabase
        .from('chapters')
        .select('*')
        .eq('id', chapterId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erreur fetch chapter:', error);
      return null;
    }
  },

  // Récupérer les leçons d'un chapter
  async fetchLessons(chapterId) {
    try {
      const { data, error } = await supabase
        .from('lessons')
        .select('*')
        .eq('chapter_id', chapterId)
        .eq('is_published', true)
        .order('order_index', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erreur fetch lessons:', error);
      return [];
    }
  },

  // Récupérer les lesson blocks d'une leçon
  async fetchLessonBlocks(lessonId) {
    try {
      const { data, error } = await supabase
        .from('lesson_blocks')
        .select('*')
        .eq('lesson_id', lessonId)
        .order('order_index', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erreur fetch lesson blocks:', error);
      return [];
    }
  },

  // Récupérer les questions d'un lesson block de type quiz avec réponses
  async fetchBlockQuestions(payload) {
    try {
      // Le payload contient les IDs des questions
      const questionIds = payload.question_ids || [];
      
      if (questionIds.length === 0) return [];

      const { data, error } = await supabase
        .from('questions')
        .select(`
          *,
          answers (*)
        `)
        .in('id', questionIds)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erreur fetch questions:', error);
      return [];
    }
  },

  // Récupérer toutes les questions/réponses d'une leçon
  async fetchLessonQuestions(lessonId) {
    try {
      // Récupérer les blocks
      const blocks = await get().fetchLessonBlocks(lessonId);
      
      // Récupérer toutes les questions de tous les blocks de type quiz
      const allQuestions = [];
      for (const block of blocks) {
        if (block.type === 'quiz') {
          const questions = await get().fetchBlockQuestions(block.payload);
          allQuestions.push(...questions);
        }
      }

      return allQuestions;
    } catch (error) {
      console.error('Erreur fetch lesson questions:', error);
      return [];
    }
  },

  // Récupérer la progression de l'utilisateur
  async fetchUserProgress(userId) {
    try {
      const { data, error } = await supabase
        .from('user_progress')
        .select('lesson_id, status')
        .eq('user_id', userId);

      if (error) throw error;
      
      // Convertir en objet {lesson_id: status}
      const progressMap = {};
      data?.forEach(item => {
        progressMap[item.lesson_id] = item.status;
      });
      
      return progressMap;
    } catch (error) {
      console.error('Erreur fetch progress:', error);
      return {};
    }
  },

  // Sauvegarder une tentative de réponse
  async saveAttempt(userId, questionId, isCorrect) {
    try {
      const { error } = await supabase
        .from('attempts')
        .insert({
          user_id: userId,
          question_id: questionId,
          is_correct: isCorrect,
          time_ms: 0,
        });

      if (error) throw error;
    } catch (error) {
      console.error('Erreur save attempt:', error);
    }
  },

  // Mettre à jour la progression d'une leçon
  async updateProgress(userId, lessonId, status) {
    try {
      const { error } = await supabase
        .from('user_progress')
        .upsert({
          user_id: userId,
          lesson_id: lessonId,
          status: status,
          last_attempt_at: new Date().toISOString(),
        });

      if (error) throw error;
    } catch (error) {
      console.error('Erreur update progress:', error);
    }
  },

  // Donner de l'XP à un utilisateur
  async giveXP(userId, amount, reason) {
    try {
      const { error } = await supabase
        .from('xp_events')
        .insert({
          user_id: userId,
          amount: amount,
          reason: reason,
        });

      if (error) throw error;
      console.log(`✨ +${amount} XP : ${reason}`);
    } catch (error) {
      console.error('Erreur give XP:', error);
    }
  },

  // Anciennes propriétés pour compatibilité
  userId: null,
  initUser() {
    if (!get().userId) set({ userId: `guest_${Date.now()}_${Math.floor(Math.random()*1000)}` });
  },
  topics: [],
  minutesPerDay: 5,
  setTopics: (topics) => set({ topics }),
  setMinutes: (m) => set({ minutesPerDay: m }),
}));
