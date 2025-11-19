import { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useStore } from '../../store/useStore';

export default function ChapterLessons() {
  const { id } = useLocalSearchParams();
  const { user, fetchLessons, fetchUserProgress } = useStore();
  
  const [chapter, setChapter] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [progress, setProgress] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadChapterData();
  }, [id]);

  // Recharger quand on revient sur l'écran (après une leçon)
  useFocusEffect(
    useCallback(() => {
      loadChapterData();
    }, [id, user?.id])
  );

  const loadChapterData = async () => {
    try {
      setLoading(true);

      // Récupérer le chapter
      const chapterData = await useStore.getState().fetchChapterById(id);
      setChapter(chapterData);

      // Récupérer les leçons
      const lessonsData = await fetchLessons(id);
      setLessons(lessonsData);

      // Récupérer la progression
      const progressData = await fetchUserProgress(user.id);
      setProgress(progressData);

      setLoading(false);
    } catch (error) {
      console.error('Erreur chargement chapter:', error);
      Alert.alert(
        'Erreur de chargement',
        'Impossible de charger les leçons. Réessaye. 🔄',
        [
          { text: 'Réessayer', onPress: loadChapterData },
          { text: 'Retour', onPress: () => router.back() }
        ]
      );
    }
  };

  const startLesson = (lesson) => {
    router.push(`/lesson/${lesson.id}`);
  };

  const getLessonStatus = (lessonId) => {
    return progress[lessonId] || 'not_started';
  };

  const getStatusEmoji = (status) => {
    switch (status) {
      case 'done': return '✅';
      case 'in_progress': return '⏳';
      default: return '🔒';
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6C4CF7" />
        <Text style={styles.loadingText}>Chargement...</Text>
        <Text style={styles.loadingSubtext}>Préparation des leçons 📖</Text>
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
        <Text style={styles.headerTitle}>{chapter?.title || 'Leçons'}</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView style={styles.content}>
        {/* Chapter Info */}
        <View style={styles.chapterHeader}>
          <Text style={styles.chapterTitle}>{chapter?.title}</Text>
          <Text style={styles.chapterSubtitle}>
            {lessons.length} leçon{lessons.length > 1 ? 's' : ''}
          </Text>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressLabel}>Ta progression</Text>
            <Text style={styles.progressPercent}>
              {lessons.length > 0 
                ? Math.round((lessons.filter(l => getLessonStatus(l.id) === 'done').length / lessons.length) * 100)
                : 0}%
            </Text>
          </View>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { width: `${lessons.length > 0 ? (lessons.filter(l => getLessonStatus(l.id) === 'done').length / lessons.length) * 100 : 0}%` }
              ]} 
            />
          </View>
        </View>

        {/* Lessons List */}
        <View style={styles.lessonsContainer}>
          <Text style={styles.sectionTitle}>Leçons</Text>
          
          {lessons.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>📚</Text>
              <Text style={styles.emptyText}>
                Les leçons pour ce chapitre arrivent bientôt !
              </Text>
            </View>
          ) : (
            lessons.map((lesson, index) => {
              const status = getLessonStatus(lesson.id);
              const isLocked = index > 0 && getLessonStatus(lessons[index - 1].id) !== 'done';
              
              return (
                <TouchableOpacity
                  key={lesson.id}
                  style={[styles.lessonCard, isLocked && styles.lessonCardLocked]}
                  onPress={() => !isLocked && startLesson(lesson)}
                  disabled={isLocked}
                >
                  <View style={styles.lessonNumber}>
                    <Text style={styles.lessonNumberText}>{index + 1}</Text>
                  </View>
                  
                  <View style={styles.lessonContent}>
                    <Text style={[styles.lessonTitle, isLocked && styles.lessonTitleLocked]}>
                      {lesson.title}
                    </Text>
                    <Text style={styles.lessonMeta}>
                      ⏱️ {lesson.duration_min} min · Niveau {lesson.level}
                    </Text>
                  </View>

                  <View style={styles.lessonStatus}>
                    <Text style={styles.statusEmoji}>
                      {isLocked ? '🔒' : getStatusEmoji(status)}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })
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
  chapterHeader: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 16,
  },
  chapterTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  chapterSubtitle: {
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

