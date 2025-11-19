# Configuration Supabase pour Mindy

## 🛡️ Configuration de l'authentification

### 1. Activation des providers dans Supabase Dashboard

Allez dans votre **Supabase Dashboard** > **Authentication** > **Providers** :

#### ✅ Google Sign-In (Principal)
1. Activez **Google** dans la liste des providers
2. Configurez :
   - **Client ID** : ID client de votre projet Google Cloud
   - **Client Secret** : Secret client de votre projet Google Cloud

#### ✅ Email/Password
1. Activez **Email** (normalement activé par défaut)
2. Configurez les options :
   - ✅ Enable email confirmations (recommandé)
   - ✅ Enable email change confirmations
   - ✅ Enable password recovery

### 2. Configuration des URLs de redirection

Dans **Authentication** > **URL Configuration** :

#### Site URL
```
com.mindy://
```

#### Redirect URLs (Important !)
```
exp://localhost:8081
http://localhost:3000
com.mindy://
```

⚠️ **Note importante** : L'URL `exp://localhost:8081` est utilisée pour le développement avec Expo. En production, tu utiliseras `com.mindy://`.

### 3. Configuration des emails (optionnel)

Dans **Authentication** > **Email Templates** :
- Personnalisez vos templates d'email de confirmation
- Ajoutez votre logo et vos couleurs

## 🔧 Configuration Google Cloud (pour Google Sign-In)

### 1. Console Google Cloud
1. Allez sur **Google Cloud Console**
2. **APIs & Services** > **Credentials**

### 2. OAuth 2.0 Client ID
1. Créez **OAuth 2.0 Client ID**
2. Type : **iOS application**
3. **Bundle ID** : `com.mindy.app`

### 3. Authorized redirect URIs
Ajoute cette URL exactement :
```
https://gvqunhimugyjtzmrbisg.supabase.co/auth/v1/callback
```

### 4. Récupérer les credentials
1. Une fois le client créé, copie le **Client ID** et **Client Secret**
2. Colle-les dans ton dashboard Supabase > Authentication > Providers > Google

## 📊 Tables de base recommandées

### Table `profiles`
```sql
CREATE TABLE profiles (
  id uuid REFERENCES auth.users ON DELETE CASCADE,
  email text,
  full_name text,
  avatar_url text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  
  PRIMARY KEY (id)
);

-- Enable RLS (Row Level Security)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view own profile
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);

-- Policy: Users can update own profile
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
```

### Table `user_progress` 
```sql
CREATE TABLE user_progress (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  topic text NOT NULL,
  xp integer DEFAULT 0,
  streak_days integer DEFAULT 0,
  last_activity_date date,
  total_lessons_completed integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  
  UNIQUE(user_id, topic)
);

ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own progress" ON user_progress FOR ALL USING (auth.uid() = user_id);
```

### Trigger pour créer un profil automatiquement
```sql
-- Function pour créer un profil
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name');
  return new;
END;
$$ language plpgsql security definer;

-- Trigger qui s'exécute à chaque nouvel utilisateur
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
```

## 🔐 Sécurité RLS (Row Level Security)

Toutes tes tables doivent avoir RLS activé pour s'assurer que les utilisateurs ne peuvent accéder qu'à leurs propres données :

```sql
-- Activer RLS sur une table
ALTER TABLE ma_table ENABLE ROW LEVEL SECURITY;

-- Policy de base pour les utilisateurs connectés
CREATE POLICY "Users can manage own data" ON ma_table FOR ALL USING (auth.uid() = user_id);
```

## 🚀 Test de la configuration

### En développement (avec Expo)
1. Lance ton app : `npm start`
2. Teste d'abord avec **Email/Password** (plus simple pour débugger)
3. Teste ensuite **Google Sign-In**

### Débogage Google Sign-In
Si ça charge à l'infini :
- ✅ Vérifie que `exp://localhost:8081` est dans les Redirect URLs Supabase
- ✅ Vérifie que le Client ID et Secret sont corrects dans Supabase
- ✅ Vérifie la console pour les erreurs
- ✅ Assure-toi que `expo-web-browser` est installé

### Commandes utiles
```bash
# Redémarrer Expo avec cache clear
npm start -- --clear

# Vérifier les packages
npm list expo-web-browser
```

## ⚠️ Notes importantes

- **Redirect URLs** doivent exactement correspondre
- Pour le développement, utilise `exp://localhost:8081`
- Pour la production, tu changeras pour `com.mindy://`
- Si Google charge à l'infini, c'est souvent un problème de redirect URL

## 🎯 Checklist de vérification

- ✅ Google activé dans Supabase Dashboard
- ✅ Client ID et Secret configurés
- ✅ `exp://localhost:8081` dans les Redirect URLs
- ✅ `expo-web-browser` installé (`npm list expo-web-browser`)
- ✅ Tables `profiles` et `user_progress` créées
- ✅ RLS activé sur les tables
- ✅ Trigger `handle_new_user` créé

Ton système de login est maintenant prêt ! 🎉
