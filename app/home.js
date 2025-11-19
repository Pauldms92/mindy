import { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { useStore } from '../store/useStore';
import CustomAlert from '../components/CustomAlert';
import { useAlert } from '../hooks/useAlert';

export default function Home() {
  const { user, signOut, fetchTopics, fetchUserStats, refreshSession } = useStore();
  const { alertConfig, showAlert, hideAlert } = useAlert();
  const [isFirstVisit, setIsFirstVisit] = useState(false);
  const [topics, setTopics] = useState([]);
  const [stats, setStats] = useState({ streak: 0, xp: 0, lessonsCompleted: 0 });
  const [loading, setLoading] = useState(true);
  const [hasTriedRefresh, setHasTriedRefresh] = useState(false);

  // Forcer un refresh de session si user est null (cas iOS après login Google)
  useEffect(() => {
    const tryRefreshSession = async () => {
      if (!user && !hasTriedRefresh) {
        console.log('⚠️ Home - user null, tentative de refresh session...');
        setHasTriedRefresh(true);
        
        // Attendre un peu pour que AsyncStorage soit prêt
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const session = await refreshSession();
        console.log('🔄 Refresh result:', session ? session.user?.email : 'null');
      }
    };
    
    tryRefreshSession();
  }, [user, hasTriedRefresh, refreshSession]);

  // Charger les données - logique simple
  useEffect(() => {
    const loadData = async () => {
      console.log('📊 Home - loadData - user:', user ? user.email : 'null');
      
      if (!user) {
        console.log('⚠️ Home - pas de user, attente...');
        return;
      }
      
      // La protection contre les appels multiples est maintenant dans le store
      
      // Si on a déjà les données, ne pas recharger
      if (topics.length > 0 && stats.xp !== undefined) {
        console.log('⚠️ Home - Données déjà présentes, ignoré');
        setLoading(false);
        return;
      }
      
      try {
        console.log('✅ Home - user présent, chargement des données...');
        setLoading(true);
        
        // Charger topics et stats en parallèle (logique web simple)
        console.log('📥 Début fetchTopics...');
        const topicsPromise = fetchTopics();
        
        console.log('📥 Début fetchUserStats pour user.id:', user.id);
        const statsPromise = fetchUserStats(user.id);
        
        console.log('⏳ Attente Promise.all...');
        const [topicsData, statsData] = await Promise.all([topicsPromise, statsPromise]);
        
        console.log('✅ Topics chargés:', topicsData?.length || 0);
        console.log('✅ Stats chargées:', statsData);
        
        setTopics(topicsData);
        setStats(statsData);
        setLoading(false);
      } catch (error) {
        console.error('❌ Erreur chargement données home:', error);
        
        // Gestion d'erreur simple (comme sur web)
        Alert.alert(
          'Erreur de chargement',
          'Impossible de charger tes données. Vérifie ta connexion et réessaye. 🔄',
          [
            { text: 'Réessayer', onPress: loadData },
            { text: 'Retour', onPress: () => router.back() }
          ]
        );
        setLoading(false);
      }
    };
    
    loadData();
  }, [user]);

  // Reset isLoadingTopics et isLoadingStats dans le store quand l'utilisateur change
  useEffect(() => {
    useStore.setState({ isLoadingTopics: false, isLoadingStats: false });
  }, [user]);

  // Détecter si c'est la première visite
  useEffect(() => {
    const checkFirstVisit = async () => {
      if (loading) return; // Attendre que les données soient chargées
      
      const hasVisited = await AsyncStorage.getItem('hasVisitedHome');
      if (!hasVisited) {
        setIsFirstVisit(true);
        await AsyncStorage.setItem('hasVisitedHome', 'true');
        
        // Message de bienvenue personnalisé
        setTimeout(() => {
          const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'ami';
          showAlert(
            `Bienvenue ${userName} ! 🎉`,
            'Tu es maintenant connecté à Mindy !\n\n📚 Ici tu vas pouvoir apprendre les compétences modernes en seulement 5 minutes par jour.\n\n💡 Commence par choisir un sujet qui t\'intéresse ci-dessous !',
            [{ text: 'C\'est parti ! 🚀' }]
          );
        }, 800);
      }
    };
    checkFirstVisit();
  }, [user, loading]);

  const handleLogout = async () => {
    showAlert(
      'Déconnexion',
      'Tu es sûr de vouloir te déconnecter ? 👋',
      [
        {
          text: 'Oui, me déconnecter',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('👋 Début logout depuis home.js');
              await signOut();
              console.log('✅ SignOut terminé, redirection...');
              router.replace('/login');
            } catch (error) {
              console.error('❌ Erreur lors de la déconnexion:', error);
              // Forcer la redirection même en cas d'erreur
              router.replace('/login');
            }
          }
        },
        { text: 'Annuler', style: 'cancel' }
      ]
    );
  };

  // Écran de chargement
  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8f9fa' }}>
        <ActivityIndicator size="large" color="#6C4CF7" />
        <Text style={{ marginTop: 16, color: '#666', fontSize: 16 }}>
          Chargement de tes données...
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>
            Salut {user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'ami'} ! 👋
          </Text>
          <Text style={styles.email}>{user?.email}</Text>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Text style={styles.logoutText}>Déconnexion</Text>
        </TouchableOpacity>
      </View>

      {/* Hero Section */}
      <View style={styles.hero}>
        <Text style={styles.heroTitle}>
          Bienvenue dans Mindy ! 🎉
        </Text>
        <Text style={styles.heroSubtitle}>
          Apprends les compétences modernes en 5 min/jour
        </Text>
      </View>

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.lessonsCompleted}</Text>
          <Text style={styles.statLabel}>Leçons</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.streak}</Text>
          <Text style={styles.statLabel}>Streak 🔥</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.xp}</Text>
          <Text style={styles.statLabel}>XP</Text>
        </View>
      </View>

      {/* Featured Topics */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          {topics.length > 0 ? 'Commence ton apprentissage' : 'Aucun sujet disponible'}
        </Text>
        
        {topics.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateEmoji}>📚</Text>
            <Text style={styles.emptyStateText}>
              Les sujets arrivent bientôt !
            </Text>
            <Text style={styles.emptyStateSubtext}>
              En attendant, ton profil est bien créé. 👍
            </Text>
          </View>
        ) : (
          topics.map((topic) => (
            <TouchableOpacity 
              key={topic.id} 
              style={styles.topicCard}
              onPress={() => router.push(`/topic/${topic.id}`)}
            >
              <Text style={styles.topicEmoji}>{topic.icon || '📖'}</Text>
              <View style={styles.topicContent}>
                <Text style={styles.topicTitle}>{topic.title}</Text>
              </View>
              <Text style={styles.topicArrow}>→</Text>
            </TouchableOpacity>
          ))
        )}
      </View>

      {/* Daily Challenge */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Challenge du jour</Text>
        <View style={styles.challengeCard}>
          <Text style={styles.challengeEmoji}>🎯</Text>
          <Text style={styles.challengeTitle}>Complète ta première leçon</Text>
          <Text style={styles.challengeReward}>+50 XP</Text>
        </View>
      </View>

      {/* Info Box */}
      <View style={styles.infoBox}>
        <Text style={styles.infoTitle}>🎓 Page de démonstration</Text>
        <Text style={styles.infoText}>
          Ceci est une page d'accueil fictive qui simule l'entrée dans l'application Mindy.
        </Text>
        <Text style={styles.infoText}>
          ✅ Ton système de login fonctionne parfaitement !
        </Text>
        <Text style={styles.infoText}>
          💡 Tu es connecté avec : {user?.app_metadata?.provider === 'google' ? 'Google' : 'Email'}
        </Text>
      </View>

      <View style={{ height: 40 }} />
      
      {/* Custom Alert */}
      <CustomAlert
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        buttons={alertConfig.buttons}
        onClose={hideAlert}
      />
    </ScrollView>
  );
}

const styles = {
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  greeting: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
  },
  email: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  logoutButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  logoutText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '600',
  },
  hero: {
    padding: 24,
    backgroundColor: '#6C4CF7',
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 16,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.9,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#6C4CF7',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  section: {
    padding: 20,
    paddingTop: 0,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    marginBottom: 16,
  },
  topicCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  topicEmoji: {
    fontSize: 32,
    marginRight: 16,
  },
  topicContent: {
    flex: 1,
  },
  topicTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  topicSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  topicArrow: {
    fontSize: 20,
    color: '#6C4CF7',
    fontWeight: '600',
  },
  emptyState: {
    backgroundColor: '#fff',
    padding: 40,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  emptyStateEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  challengeCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#6C4CF7',
    borderStyle: 'dashed',
  },
  challengeEmoji: {
    fontSize: 48,
    marginBottom: 8,
  },
  challengeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  challengeReward: {
    fontSize: 14,
    color: '#6C4CF7',
    fontWeight: '600',
  },
  infoBox: {
    backgroundColor: '#e3f2fd',
    padding: 20,
    marginHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#90caf9',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1976d2',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#1565c0',
    lineHeight: 20,
    marginBottom: 4,
  },
};

