import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useStore } from '../../store/useStore';

export default function TopicLessons() {
  const { id } = useLocalSearchParams();
  const { user, fetchChapters, fetchUserProgress } = useStore();
  
  const [topic, setTopic] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [progress, setProgress] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTopicData();
  }, [id]);

  const loadTopicData = async () => {
    try {
      setLoading(true);

      console.log('📚 Chargement topic ID:', id);

      // Récupérer le topic
      const topicData = await useStore.getState().fetchTopicById(id);
      console.log('📖 Topic:', topicData);
      setTopic(topicData);

      // Récupérer les chapters
      const chaptersData = await fetchChapters(id);
      console.log('📑 Chapters récupérés:', chaptersData);
      console.log('📑 Nombre de chapters:', chaptersData?.length);
      setChapters(chaptersData);

      // Récupérer la progression
      const progressData = await fetchUserProgress(user.id);
      setProgress(progressData);

      setLoading(false);
    } catch (error) {
      console.error('❌ Erreur chargement topic:', error);
      Alert.alert(
        'Erreur de chargement',
        'Impossible de charger les chapitres. Réessaye. 🔄',
        [
          { text: 'Réessayer', onPress: loadTopicData },
          { text: 'Retour', onPress: () => router.back() }
        ]
      );
    }
  };

  const openChapter = (chapter) => {
    router.push(`/chapter/${chapter.id}`);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6C4CF7" />
        <Text style={styles.loadingText}>Chargement...</Text>
        <Text style={styles.loadingSubtext}>Préparation du contenu 📚</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>← Retour</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{topic?.title || 'Leçons'}</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView style={styles.content}>
        {/* Topic Info */}
        <View style={styles.topicHeader}>
          <Text style={styles.topicEmoji}>{topic?.icon || '📖'}</Text>
          <Text style={styles.topicTitle}>{topic?.title}</Text>
          <Text style={styles.topicSubtitle}>
            {chapters.length} chapitre{chapters.length > 1 ? 's' : ''} disponible{chapters.length > 1 ? 's' : ''}
          </Text>
        </View>

        {/* Chapters List */}
        <View style={styles.lessonsContainer}>
          <Text style={styles.sectionTitle}>Chapitres</Text>
          
          {chapters.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>📚</Text>
              <Text style={styles.emptyText}>
                Les chapitres arrivent bientôt !
              </Text>
              <Text style={styles.emptySubtext}>
                Reviens dans quelques jours. 👍
              </Text>
            </View>
          ) : (
            chapters.map((chapter, index) => (
              <TouchableOpacity
                key={chapter.id}
                style={styles.lessonCard}
                onPress={() => openChapter(chapter)}
              >
                <View style={styles.lessonNumber}>
                  <Text style={styles.lessonNumberText}>{index + 1}</Text>
                </View>
                
                <View style={styles.lessonContent}>
                  <Text style={styles.lessonTitle}>
                    {chapter.title}
                  </Text>
                </View>

                <View style={styles.lessonStatus}>
                  <Text style={styles.statusEmoji}>→</Text>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = {
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    marginTop: 16,
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingSubtext: {
    marginTop: 8,
    color: '#999',
    fontSize: 14,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    width: 60,
  },
  backText: {
    fontSize: 16,
    color: '#6C4CF7',
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  content: {
    flex: 1,
  },
  topicHeader: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 16,
  },
  topicEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  topicTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
  },
  topicSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  progressContainer: {
    padding: 20,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  progressPercent: {
    fontSize: 14,
    fontWeight: '700',
    color: '#6C4CF7',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#6C4CF7',
    borderRadius: 4,
  },
  lessonsContainer: {
    padding: 20,
    paddingTop: 0,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    marginBottom: 16,
  },
  lessonCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  lessonCardLocked: {
    opacity: 0.5,
  },
  lessonNumber: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#6C4CF7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  lessonNumberText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  lessonContent: {
    flex: 1,
  },
  lessonTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  lessonTitleLocked: {
    color: '#999',
  },
  lessonMeta: {
    fontSize: 13,
    color: '#666',
  },
  lessonStatus: {
    width: 32,
  },
  statusEmoji: {
    fontSize: 20,
    textAlign: 'center',
  },
  emptyState: {
    backgroundColor: '#fff',
    padding: 40,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
};

