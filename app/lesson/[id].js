import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useStore } from '../../store/useStore';
import CustomAlert from '../../components/CustomAlert';
import { useAlert } from '../../hooks/useAlert';

export default function Lesson() {
  const { id } = useLocalSearchParams();
  const { user, fetchLessonQuestions, saveAttempt, giveXP, updateProgress } = useStore();
  const { alertConfig, showAlert, hideAlert } = useAlert();
  
  const [lesson, setLesson] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isCompleted, setIsCompleted] = useState(false);
  const [wrongAnswers, setWrongAnswers] = useState([]); // Questions ratées
  const [isReviewMode, setIsReviewMode] = useState(false); // Mode révision
  const [hasShownIntro, setHasShownIntro] = useState(false);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);

  useEffect(() => {
    loadLesson();
  }, [id]);

  const loadLesson = async () => {
    try {
      setLoading(true);

      // Récupérer la leçon et ses questions
      const [lessonData, questionsData] = await Promise.all([
        useStore.getState().fetchLessonById(id),
        fetchLessonQuestions(id),
      ]);

      console.log('📚 Leçon chargée:', lessonData?.title);
      console.log('❓ Questions chargées:', questionsData?.length || 0);

      setLesson(lessonData);
      setQuestions(questionsData);
      setLoading(false);

      // Intro conviviale au démarrage (une fois par ouverture)
      if (!hasShownIntro && lessonData && (questionsData?.length || 0) > 0) {
        setHasShownIntro(true);
        setTimeout(() => {
          showAlert(
            'C\'est parti ! ✨',
            `Objectif: réussir ${questionsData.length}/${questionsData.length} questions\n\nDurée: ${lessonData.duration_min} min · Niveau ${lessonData.level}\n\nTu peux le faire 💪`,
            [
              { text: 'Commencer', onPress: () => {} }
            ]
          );
        }, 100);
      }
    } catch (error) {
      console.error('Erreur chargement leçon:', error);
      setLoading(false);
      showAlert(
        'Erreur de chargement',
        'Impossible de charger cette leçon. 😕\n\nRéessaye ou reviens plus tard.',
        [
          { text: 'Réessayer', onPress: loadLesson },
          { text: 'Retour', onPress: () => router.back() }
        ]
      );
    }
  };

  const handleAnswerSelect = async (answer) => {
    if (showExplanation) return; // Déjà répondu
    
    setSelectedAnswer(answer);
    setShowExplanation(true);

    const currentQuestion = questions[currentQuestionIndex];
    const isCorrect = answer.is_correct;

    // Sauvegarder la tentative
    await saveAttempt(user.id, currentQuestion.id, isCorrect);

    // Mettre à jour le score
    if (isCorrect) {
      setScore(score + 1);
      const nextStreak = currentStreak + 1;
      setCurrentStreak(nextStreak);
      if (nextStreak > maxStreak) setMaxStreak(nextStreak);
    } else {
      // Ajouter la question ratée pour la prochaine révision (toujours)
      setWrongAnswers((prev) => {
        const alreadyIncluded = prev.some((q) => q.id === currentQuestion.id);
        return alreadyIncluded ? prev : [...prev, currentQuestion];
      });
      setCurrentStreak(0);
    }
  };

  const handleNext = async () => {
    console.log('🔵 handleNext appelé - Question:', currentQuestionIndex + 1, '/', questions.length);
    
    if (currentQuestionIndex < questions.length - 1) {
      // Prochaine question
      console.log('→ Prochaine question');
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedAnswer(null);
      setShowExplanation(false);
    } else {
      // Leçon terminée
      console.log('→ Dernière question, appel completeLesson');
      await completeLesson();
    }
  };

  const completeLesson = async () => {
    console.log('🎯 completeLesson - Score:', score, '/', questions.length);
    console.log('❌ Mauvaises réponses:', wrongAnswers.length);
    console.log('📚 Mode révision:', isReviewMode);
    
    const allCorrect = score === questions.length; // Il faut 100% !
    
    console.log('📊 Toutes correctes:', allCorrect);
    
    try {
      // Si des erreurs → Mode révision OBLIGATOIRE
      if (wrongAnswers.length > 0 && !isReviewMode) {
        console.log('📝 Lancement mode révision (obligatoire)');
        
        setTimeout(() => {
          showAlert(
            'Revoyons tes erreurs 📚',
            `Tu as fait ${wrongAnswers.length} erreur${wrongAnswers.length > 1 ? 's' : ''}.\n\nOn va revoir ${wrongAnswers.length} question${wrongAnswers.length > 1 ? 's' : ''} jusqu'à ce que tu aies tout bon ! 💪`,
            [
              { text: 'C\'est parti !', onPress: startReviewMode }
            ]
          );
        }, 100);
        return;
      }

      // En mode révision, vérifier s'il y a encore des erreurs
      if (isReviewMode && wrongAnswers.length > 0) {
        console.log('❌ Encore des erreurs en mode révision, on recommence');
        
        setTimeout(() => {
          showAlert(
            'Encore quelques erreurs... 🤔',
            `Tu as fait ${wrongAnswers.length} erreur${wrongAnswers.length > 1 ? 's' : ''}.\nIl reste ${wrongAnswers.length} question${wrongAnswers.length > 1 ? 's' : ''} à maîtriser.\n\nOn recommence jusqu'à ce que tu aies tout bon !`,
            [
              { text: 'Recommencer la révision', onPress: startReviewMode }
            ]
          );
        }, 100);
        return;
      }

      // En mode révision, vérifier que TOUTES les réponses sont bonnes
      if (isReviewMode && !allCorrect) {
        console.log('❌ Pas toutes bonnes en révision');
        
        // En révision, on relance directement la révision avec les erreurs accumulées
        setTimeout(() => {
          showAlert(
            'Pas encore... 🤔',
            `Score : ${score}/${questions.length}\nIl reste ${Math.max(questions.length - score, 0)} question${(questions.length - score) > 1 ? 's' : ''} à corriger.\n\nIl faut toutes les bonnes réponses !`,
            [
              { text: 'Recommencer', onPress: startReviewMode }
            ]
          );
        }, 100);
        return;
      }

      // Toutes les réponses sont bonnes → Valider
      if (allCorrect) {
        console.log('✅ Leçon validée ! Toutes les réponses correctes');
        
        // Donner de l'XP
        const xpEarned = 50 + (score * 10);
        console.log('💰 Tentative give XP:', xpEarned);
        await giveXP(user.id, xpEarned, `Leçon terminée: ${lesson.title}`);
        
        // Marquer comme terminé
        console.log('📝 Tentative update progress');
        await updateProgress(user.id, id, 'done');
        
        setIsCompleted(true);
        console.log('🎉 Tout sauvegardé ! Affichage popup...');
        
        setTimeout(() => {
          showAlert(
            'Bravo ! 🎉',
            isReviewMode 
              ? `Tu as révisé tes erreurs et tout réussi !\n\n🔓 Leçon suivante débloquée\n🌟 +${xpEarned} XP\n🔥 Ton meilleur enchaînement: ${maxStreak}\n\nContinue ! 🚀`
              : `Parfait ! Tout juste du premier coup !\n\n✅ ${score}/${questions.length} bonnes réponses\n🔥 Ton meilleur enchaînement: ${maxStreak}\n🌟 +${xpEarned} XP\n🔓 Leçon suivante débloquée ! 🚀`,
            [
              { text: 'Continuer', onPress: () => router.back() }
            ]
          );
        }, 100);
      } else {
        console.log('❌ Leçon non validée - Pas toutes les réponses correctes');
        
        // Marquer comme en cours
        await updateProgress(user.id, id, 'in_progress');
        
        setTimeout(() => {
          showAlert(
            'Pas encore tout bon... 😅',
            `Score : ${score}/${questions.length}\nIl reste ${Math.max(questions.length - score, 0)} question${(questions.length - score) > 1 ? 's' : ''} à corriger.\n\nTa progression est sauvegardée.\nRéessaye, tu vas y arriver ! 💪`,
            [
              { text: 'Recommencer', onPress: restartLesson }
            ]
          );
        }, 100);
      }
    } catch (error) {
      console.error('❌ Erreur completeLesson complète:', error);
      
      setTimeout(() => {
        showAlert(
          'Oups...',
          `Un problème est survenu. 😕\n\nTon score : ${score}/${questions.length}\n\nVérifie que FIX_RLS_POLICIES.sql a été exécuté dans Supabase.`,
          [{ text: 'Retour', onPress: () => router.back() }]
        );
      }, 100);
    }
  };

  const startReviewMode = () => {
    console.log('🔄 Démarrage mode révision -', wrongAnswers.length, 'questions');
    // Reconstituer la liste des questions ratées UNIQUES
    const uniqueWrong = [];
    const seen = new Set();
    for (const q of wrongAnswers) {
      if (!seen.has(q.id)) {
        seen.add(q.id);
        uniqueWrong.push(q);
      }
    }
    const questionsToReview = uniqueWrong;
    console.log('📚 Questions à réviser:', questionsToReview);
    
    // Passer en mode révision
    setIsReviewMode(true);
    
    // Utiliser les questions ratées (uniques)
    setQuestions(questionsToReview);
    
    // Reset pour la nouvelle session (on garde les erreurs suivantes via handleAnswerSelect)
    setWrongAnswers([]);
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setShowExplanation(false);
    setScore(0);
    setCurrentStreak(0);
  };


  const restartLesson = () => {
    // Recharger la leçon complète
    setIsReviewMode(false);
    setWrongAnswers([]);
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setShowExplanation(false);
    setScore(0);
    setIsCompleted(false);
    
    // Recharger les questions originales
    loadLesson();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6C4CF7" />
        <Text style={styles.loadingText}>Préparation...</Text>
        <Text style={styles.loadingSubtext}>Chargement des questions 🎯</Text>
      </View>
    );
  }

  if (!questions || questions.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backText}>← Retour</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>🎯</Text>
          <Text style={styles.emptyText}>
            Pas de questions pour cette leçon
          </Text>
          <Text style={styles.emptySubtext}>
            Le contenu arrive bientôt !
          </Text>
        </View>
      </View>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => {
            showAlert(
              'Quitter le quiz ?',
              'Tu pourras reprendre où tu t\'es arrêté.\n\nEs-tu sûr ?',
              [
                { text: 'Annuler', style: 'cancel' },
                { text: 'Quitter', style: 'destructive', onPress: async () => { try { await updateProgress(user.id, id, 'in_progress'); } catch (e) {} router.back(); } }
              ]
            );
          }} 
          style={styles.backButton}
        >
          <Text style={styles.backText}>← Quitter</Text>
        </TouchableOpacity>
        <View style={styles.progressDots}>
          {questions.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                index === currentQuestionIndex && styles.dotActive,
                index < currentQuestionIndex && styles.dotDone,
              ]}
            />
          ))}
        </View>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView style={styles.content}>
        {/* Review Mode Banner */}
        {isReviewMode && (
          <View style={styles.reviewBanner}>
            <Text style={styles.reviewBannerEmoji}>📚</Text>
            <Text style={styles.reviewBannerText}>
              Mode révision · Restantes: {Math.max(questions.length - score, 0)}
            </Text>
          </View>
        )}

        {/* Question */}
        <View style={styles.questionContainer}>
          <Text style={styles.questionNumber}>
            {isReviewMode ? 'Révision' : 'Question'} {currentQuestionIndex + 1}/{questions.length}
          </Text>
          <Text style={styles.questionText}>{currentQuestion.stem}</Text>
        </View>

        {/* Answers */}
        <View style={styles.answersContainer}>
          {currentQuestion.answers?.map((answer) => {
            const isSelected = selectedAnswer?.id === answer.id;
            const isCorrect = answer.is_correct;
            const shouldShowCorrect = showExplanation && isCorrect;
            const shouldShowWrong = showExplanation && isSelected && !isCorrect;

            return (
              <TouchableOpacity
                key={answer.id}
                style={[
                  styles.answerCard,
                  isSelected && !showExplanation && styles.answerSelected,
                  shouldShowCorrect && styles.answerCorrect,
                  shouldShowWrong && styles.answerWrong,
                ]}
                onPress={() => handleAnswerSelect(answer)}
                disabled={showExplanation}
              >
                <View style={styles.answerContent}>
                  <Text style={[
                    styles.answerText,
                    shouldShowCorrect && styles.answerTextCorrect,
                    shouldShowWrong && styles.answerTextWrong,
                  ]}>
                    {answer.label}
                  </Text>
                </View>
                
                {showExplanation && (
                  <Text style={styles.answerIcon}>
                    {isCorrect ? '✅' : (isSelected ? '❌' : '')}
                  </Text>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Explanation */}
        {showExplanation && selectedAnswer && (
          <View style={styles.explanationContainer}>
            <Text style={styles.explanationTitle}>
              {selectedAnswer.is_correct ? '✅ Correct !' : '❌ Pas tout à fait...'}
            </Text>
            {selectedAnswer.explanation && (
              <Text style={styles.explanationText}>
                {selectedAnswer.explanation}
              </Text>
            )}
          </View>
        )}

        {/* Next Button */}
        {showExplanation && (
          <View style={styles.nextContainer}>
            <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
              <Text style={styles.nextButtonText}>
                {currentQuestionIndex < questions.length - 1 ? 'Question suivante' : 'Terminer'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Custom Alert */}
      <CustomAlert
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        buttons={alertConfig.buttons}
        onClose={hideAlert}
      />
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
    paddingBottom: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    width: 60,
  },
  backText: {
    fontSize: 14,
    color: '#6C4CF7',
    fontWeight: '600',
  },
  progressDots: {
    flexDirection: 'row',
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#e0e0e0',
  },
  dotActive: {
    backgroundColor: '#6C4CF7',
    width: 16,
  },
  dotDone: {
    backgroundColor: '#4caf50',
  },
  content: {
    flex: 1,
  },
  questionContainer: {
    backgroundColor: '#fff',
    padding: 24,
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 16,
  },
  questionNumber: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6C4CF7',
    marginBottom: 12,
  },
  questionText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    lineHeight: 28,
  },
  answersContainer: {
    padding: 20,
  },
  answerCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    flexDirection: 'row',
    alignItems: 'center',
  },
  answerSelected: {
    borderColor: '#6C4CF7',
    backgroundColor: '#f3f0ff',
  },
  answerCorrect: {
    borderColor: '#4caf50',
    backgroundColor: '#e8f5e9',
  },
  answerWrong: {
    borderColor: '#f44336',
    backgroundColor: '#ffebee',
  },
  answerContent: {
    flex: 1,
  },
  answerText: {
    fontSize: 16,
    color: '#333',
  },
  answerTextCorrect: {
    color: '#2e7d32',
    fontWeight: '600',
  },
  answerTextWrong: {
    color: '#c62828',
  },
  answerIcon: {
    fontSize: 24,
    marginLeft: 12,
  },
  explanationContainer: {
    backgroundColor: '#fff',
    padding: 20,
    marginHorizontal: 20,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#6C4CF7',
  },
  explanationTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
  },
  explanationText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  nextContainer: {
    padding: 20,
  },
  nextButton: {
    backgroundColor: '#6C4CF7',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  nextButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
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
  reviewBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff3e0',
    padding: 16,
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#ff9800',
  },
  reviewBannerEmoji: {
    fontSize: 24,
    marginRight: 12,
  },
  reviewBannerText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#f57c00',
  },
};

