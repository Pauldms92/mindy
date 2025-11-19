import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, TextInput, Alert, ActivityIndicator, Platform } from 'react-native';
import { router } from 'expo-router';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useStore } from '../store/useStore';
import { supabase } from '../lib/supabase';
import * as WebBrowser from 'expo-web-browser';

// Compat Expo SDKs récents & anciens
const extra = Constants.expoConfig?.extra ?? Constants.manifest?.extra;

// Important pour OAuth sur mobile
WebBrowser.maybeCompleteAuthSession();

export default function Login() {
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');

  const { signInWithGoogle, user } = useStore();
  
  console.log('🔐 Login - Rendu - user:', user ? user.email : 'null');

  // Rediriger automatiquement si déjà connecté
  useEffect(() => {
    if (user) {
      console.log('🚀 Login - User déjà connecté, redirection vers /home');
      router.replace('/home');
    }
  }, [user]);

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      setLoadingMessage('Connexion à Google...');
      
      const result = await signInWithGoogle();
      
      // Sur web, la redirection se fait automatiquement
      if (Platform.OS === 'web') {
        if (result?.url) {
          setLoadingMessage('Redirection vers Google...');
          window.location.href = result.url;
        }
      } else {
        // Sur mobile, utiliser WebBrowser
        if (result?.url) {
          setLoadingMessage('Ouverture de Google...');
          
          console.log('🔵 Opening WebBrowser for Google OAuth...');
          console.log('Redirect URL utilisée: exp://localhost:8081');
          
          const authResult = await WebBrowser.openAuthSessionAsync(
            result.url, 
            'exp://localhost:8081'
          );
          
          console.log('🔵 WebBrowser result:', authResult);
          
          if (authResult.type === 'success' && authResult.url) {
            console.log('✅ Authentification Google réussie');
            setLoadingMessage('Finalisation...');
            
            // Parser l'URL de retour
            const url = authResult.url;
            const hashParams = new URLSearchParams(url.split('#')[1] || '');
            const accessToken = hashParams.get('access_token');
            const refreshToken = hashParams.get('refresh_token');
            
            console.log('📍 Tokens extraits:', accessToken ? 'oui' : 'non');
            
            if (!accessToken) {
              throw new Error('Pas de tokens dans l\'URL');
            }
            
            // Stratégie : setSession avec timeout + fallback
            console.log('⏳ Tentative setSession avec timeout de 3s...');
            
            try {
              const sessionPromise = supabase.auth.setSession({
                access_token: accessToken,
                refresh_token: refreshToken,
              });
              
              const timeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Timeout')), 3000)
              );
              
              // Course entre setSession et le timeout
              const result = await Promise.race([sessionPromise, timeoutPromise]);
              
              console.log('✅ setSession réussi !');
              
            } catch (timeoutError) {
              console.log('⚠️ setSession timeout/erreur:', timeoutError.message);
            }
            
            // Attendre que le user soit chargé puis rediriger directement
            console.log('⏳ Attente que le user soit chargé dans le store...');
            setLoadingMessage('Connexion réussie ! 🎉');
            
            // Attendre max 5 secondes que le user apparaisse
            let attempts = 0;
            while (attempts < 50) {
              const currentUser = useStore.getState().user;
              
              if (currentUser) {
                console.log('✅ User détecté dans le store !');
                console.log('✅ User:', currentUser.email);
                
                // Attendre un peu pour que l'état soit stable
                await new Promise(resolve => setTimeout(resolve, 300));
                
                console.log('🚀 Redirection directe vers /home');
                setLoading(false);
                router.replace('/home');
                return;
              }
              
              // Log toutes les 10 tentatives
              if (attempts % 10 === 0) {
                console.log(`🔍 Attente user... (${attempts / 10}s)`);
              }
              
              await new Promise(resolve => setTimeout(resolve, 100));
              attempts++;
            }
            
            console.error('❌ User toujours null après 5s');
            throw new Error('Impossible de charger l\'utilisateur. Réessaye.');
          } else if (authResult.type === 'cancel') {
            console.log('⚠️ Utilisateur a annulé l\'authentification');
            Alert.alert(
              'Connexion annulée',
              'Tu as annulé la connexion avec Google. Réessaye quand tu es prêt ! 😊'
            );
          } else {
            console.log('❌ Type de résultat inattendu:', authResult.type);
            throw new Error('Erreur lors de la connexion avec Google');
          }
        }
      }
    } catch (error) {
      console.error('❌ Erreur Google complète:', error);
      
      // Messages d'erreur détaillés avec solutions
      let errorTitle = 'Problème de connexion';
      let errorMessage = '';
      
      if (error.message?.includes('network')) {
        errorTitle = 'Pas de connexion internet';
        errorMessage = 'Vérifie ta connexion internet et réessaye. 📶';
      } else if (error.message?.includes('timeout')) {
        errorTitle = 'Délai dépassé';
        errorMessage = 'La connexion a pris trop de temps. Réessaye dans quelques instants. ⏱️';
      } else {
        errorMessage = 'Un problème est survenu. Réessaye ou utilise ton email. 🔄';
      }
      
      // Arrêter le loading
      setLoading(false);
      setLoadingMessage('');
      
      Alert.alert(errorTitle, errorMessage, [
        { text: 'Réessayer', onPress: handleGoogleSignIn, style: 'default' },
        { text: 'Annuler', style: 'cancel' }
      ]);
    } finally {
      // Sur web uniquement, ne pas arrêter le loading car la page redirige
      if (Platform.OS === 'web' && loading) {
        // Le loading reste actif pendant la redirection web
      }
    }
  };


  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Bienvenue sur Mindy</Text>
        <Text style={styles.subtitle}>
          Apprends les compétences modernes en 5 min/jour
        </Text>
      </View>

      <View style={styles.buttonsContainer}>
        {/* Bouton Google */}
        <TouchableOpacity 
          style={styles.googleButton}
          onPress={handleGoogleSignIn}
          disabled={loading}
        >
          {loading ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <ActivityIndicator color="#fff" />
              <Text style={styles.googleButtonText}>{loadingMessage || 'Chargement...'}</Text>
            </View>
          ) : (
            <Text style={styles.googleButtonText}>📧 Continuer avec Google</Text>
          )}
        </TouchableOpacity>
        
        {/* Hint sous le bouton */}
        {!loading && (
          <Text style={styles.hintText}>
            💡 Rapide et sécurisé - Aucun mot de passe à retenir
          </Text>
        )}

        {/* Séparateur */}
        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>ou</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Boutons Email */}
        <TouchableOpacity 
          style={styles.emailButton}
          onPress={() => router.push('/auth/login-email')}
        >
          <Text style={styles.emailButtonText}>Se connecter avec email</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.registerButton}
          onPress={() => router.push('/auth/register')}
        >
          <Text style={styles.registerButtonText}>Créer un compte</Text>
        </TouchableOpacity>

      </View>
    </View>
  );
}

const styles = {
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 24,
    paddingTop: 60,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#6C4CF7',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
  buttonsContainer: {
    flex: 1,
  },
  googleButton: {
    backgroundColor: '#4285F4',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 24,
  },
  googleButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e0e0e0',
  },
  dividerText: {
    marginHorizontal: 16,
    color: '#999',
    fontSize: 14,
    fontWeight: '500',
  },
  emailButton: {
    backgroundColor: '#fff',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#6C4CF7',
    marginBottom: 12,
  },
  emailButtonText: {
    color: '#6C4CF7',
    fontSize: 16,
    fontWeight: '600',
  },
  registerButton: {
    backgroundColor: '#6C4CF7',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  registerButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  hintText: {
    fontSize: 13,
    color: '#999',
    textAlign: 'center',
    marginTop: -16,
    marginBottom: 16,
    fontStyle: 'italic',
  },
};
