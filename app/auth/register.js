import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { useStore } from '../../store/useStore';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');

  const { signUpWithEmail } = useStore();

  const handleRegister = async () => {
    // Validation avec messages assistants
    if (!email || !password || !confirmPassword) {
      Alert.alert(
        'Champs manquants',
        'Remplis tous les champs pour créer ton compte. 📝\n\nOn a besoin de :\n• Ton email\n• Un mot de passe (6+ caractères)\n• Confirmation du mot de passe'
      );
      return;
    }

    // Validation email
    if (!email.includes('@')) {
      Alert.alert(
        'Email invalide',
        'Utilise un email valide (ex: toi@exemple.com). ✉️'
      );
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert(
        'Mots de passe différents',
        'Les deux mots de passe doivent être identiques. Réessaye ! 🔑'
      );
      return;
    }

    if (password.length < 6) {
      Alert.alert(
        'Mot de passe trop court',
        'Utilise au moins 6 caractères pour sécuriser ton compte. 🔒\n\nTu en as actuellement ' + password.length + '.'
      );
      return;
    }

    try {
      setLoading(true);
      setLoadingMessage('Création de ton compte...');
      
      const result = await signUpWithEmail(email, password);
      
      // Sauvegarder l'email pour faciliter la reconnexion
      await AsyncStorage.setItem('lastEmail', email);
      
      // Vérifier si confirmation d'email requise
      const needsConfirmation = result?.user?.identities?.length === 0;
      
      if (needsConfirmation) {
        Alert.alert(
          'Presque terminé ! 📧', 
          'On t\'a envoyé un email à ' + email + '.\n\n✅ Clique sur le lien dans l\'email pour activer ton compte.\n\n💡 Pense à vérifier tes spams si tu ne le vois pas !',
          [
            { text: 'Compris !', onPress: () => router.replace('/auth/login-email') }
          ]
        );
      } else {
        // Pas de confirmation requise, compte actif directement
        setLoadingMessage('Bienvenue ! 🎉');
        
        // Message de succès avant redirection
        Alert.alert(
          'Bienvenue sur Mindy ! 🎉',
          'Ton compte est créé et tu es connecté !\n\nC\'est parti pour apprendre en 5 min/jour ! 🚀',
          [
            { text: 'Let\'s go !', onPress: () => router.replace('/home') }
          ]
        );
      }
    } catch (error) {
      console.error('❌ Erreur inscription complète:', error);
      
      // Messages d'erreur détaillés avec solutions
      let errorTitle = 'Problème d\'inscription';
      let errorMessage = '';
      
      if (error.message?.includes('already registered') || error.message?.includes('User already registered')) {
        errorTitle = 'Compte déjà existant';
        errorMessage = 'Un compte existe déjà avec cet email. 📧\n\nVeux-tu te connecter à la place ?';
        
        Alert.alert(errorTitle, errorMessage, [
          { text: 'Se connecter', onPress: () => router.replace('/auth/login-email'), style: 'default' },
          { text: 'Annuler', style: 'cancel' }
        ]);
        return;
      } else if (error.message?.includes('Invalid email')) {
        errorTitle = 'Email invalide';
        errorMessage = 'Vérifie que ton email est correct (ex: toi@exemple.com). ✉️';
      } else if (error.message?.includes('network')) {
        errorTitle = 'Pas de connexion internet';
        errorMessage = 'Vérifie ta connexion internet et réessaye. 📶';
      } else {
        errorMessage = error.message || 'Un problème est survenu. Réessaye dans quelques instants. 🔄';
      }
      
      Alert.alert(errorTitle, errorMessage, [
        { text: 'Réessayer', onPress: handleRegister, style: 'default' },
        { text: 'Annuler', style: 'cancel' }
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
          <Text style={styles.title}>Créer un compte</Text>
          <Text style={styles.subtitle}>
            Rejoins Mindy et commence ton apprentissage !
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
            <Text style={styles.helperText}>
              {password.length > 0 
                ? (password.length >= 6 
                    ? `✅ ${password.length} caractères` 
                    : `⚠️ ${password.length}/6 caractères minimum`)
                : '💡 Minimum 6 caractères'}
            </Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Confirmer le mot de passe</Text>
            <TextInput
              style={styles.input}
              placeholder="Confirme ton mot de passe"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              autoCapitalize="none"
              editable={!loading}
            />
            {confirmPassword.length > 0 && (
              <Text style={styles.helperText}>
                {password === confirmPassword 
                  ? '✅ Les mots de passe correspondent' 
                  : '❌ Les mots de passe ne correspondent pas'}
              </Text>
            )}
          </View>

          <TouchableOpacity 
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleRegister}
            disabled={loading}
          >
            {loading ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <ActivityIndicator color="#fff" />
                <Text style={styles.submitButtonText}>{loadingMessage || 'Inscription...'}</Text>
              </View>
            ) : (
              <Text style={styles.submitButtonText}>S'inscrire</Text>
            )}
          </TouchableOpacity>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Déjà un compte ?</Text>
            <TouchableOpacity 
              onPress={() => router.push('/auth/login-email')}
              disabled={loading}
            >
              <Text style={styles.linkText}>Se connecter</Text>
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
    color: '#666',
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

