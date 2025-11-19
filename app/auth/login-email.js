import { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { useStore } from '../../store/useStore';

export default function LoginEmail() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');

  const { signInWithEmail } = useStore();

  // Charger l'email sauvegardé
  useEffect(() => {
    const loadSavedEmail = async () => {
      try {
        const savedEmail = await AsyncStorage.getItem('lastEmail');
        if (savedEmail) {
          setEmail(savedEmail);
        }
      } catch (error) {
        console.log('Pas d\'email sauvegardé');
      }
    };
    loadSavedEmail();
  }, []);

  const handleLogin = async () => {
    // Validation
    if (!email || !password) {
      Alert.alert(
        'Champs manquants',
        'Entre ton email et ton mot de passe pour te connecter. 📝'
      );
      return;
    }

    // Validation email basique
    if (!email.includes('@')) {
      Alert.alert(
        'Email invalide',
        'Vérifie que ton email est correct (ex: toi@exemple.com). ✉️'
      );
      return;
    }

    try {
      setLoading(true);
      setLoadingMessage('Connexion en cours...');
      
      await signInWithEmail(email, password);
      
      // Sauvegarder l'email pour la prochaine fois
      await AsyncStorage.setItem('lastEmail', email);
      
      setLoadingMessage('Connexion réussie ! 🎉');
      
      // Petit délai pour que l'utilisateur voie le message
      setTimeout(() => {
        router.replace('/home');
      }, 500);
    } catch (error) {
      console.error('Erreur connexion:', error);
      
      // Messages d'erreur détaillés
      let errorTitle = 'Connexion échouée';
      let errorMessage = '';
      
      if (error.message?.includes('Invalid login credentials')) {
        errorTitle = 'Email ou mot de passe incorrect';
        errorMessage = 'Vérifie tes identifiants ou crée un compte si tu es nouveau. 🔑';
      } else if (error.message?.includes('Email not confirmed')) {
        errorTitle = 'Email non confirmé';
        errorMessage = 'Clique sur le lien dans l\'email qu\'on t\'a envoyé. 📧';
      } else if (error.message?.includes('network')) {
        errorTitle = 'Pas de connexion internet';
        errorMessage = 'Vérifie ta connexion et réessaye. 📶';
      } else {
        errorMessage = error.message || 'Un problème est survenu. Réessaye dans quelques instants. 🔄';
      }
      
      Alert.alert(errorTitle, errorMessage, [
        { text: 'Créer un compte', onPress: () => router.push('/auth/register'), style: 'default' },
        { text: 'Réessayer', style: 'cancel' }
      ]);
    } finally {
      setLoading(false);
      setLoadingMessage('');
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={styles.title}>Connexion</Text>
          <Text style={styles.subtitle}>
            Content de te revoir ! 👋
          </Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="ton@email.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              editable={!loading}
            />
            {email && email.includes('@') && (
              <Text style={styles.helperText}>✅ Email valide</Text>
            )}
            {email && !email.includes('@') && email.length > 3 && (
              <Text style={styles.helperTextWarning}>⚠️ Format d'email incorrect</Text>
            )}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Mot de passe</Text>
            <TextInput
              style={styles.input}
              placeholder="Ton mot de passe"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
              editable={!loading}
            />
          </View>

          <TouchableOpacity 
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <ActivityIndicator color="#fff" />
                <Text style={styles.submitButtonText}>{loadingMessage || 'Connexion...'}</Text>
              </View>
            ) : (
              <Text style={styles.submitButtonText}>Se connecter</Text>
            )}
          </TouchableOpacity>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Pas encore de compte ?</Text>
            <TouchableOpacity 
              onPress={() => router.push('/auth/register')}
              disabled={loading}
            >
              <Text style={styles.linkText}>S'inscrire</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
            disabled={loading}
          >
            <Text style={styles.backButtonText}>← Retour</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = {
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#6C4CF7',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
  },
  form: {
    flex: 1,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f5f5f5',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    fontSize: 16,
  },
  helperText: {
    fontSize: 12,
    marginTop: 4,
    color: '#4caf50',
  },
  helperTextWarning: {
    fontSize: 12,
    marginTop: 4,
    color: '#ff9800',
  },
  submitButton: {
    backgroundColor: '#6C4CF7',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
    gap: 6,
  },
  footerText: {
    fontSize: 14,
    color: '#666',
  },
  linkText: {
    fontSize: 14,
    color: '#6C4CF7',
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  backButton: {
    alignItems: 'center',
    marginTop: 20,
    paddingVertical: 12,
  },
  backButtonText: {
    color: '#999',
    fontSize: 14,
  },
};

