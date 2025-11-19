# 🔐 Système de Login - Mindy

## ✅ Fonctionnalités

### 3 méthodes de connexion :

1. **Google Sign-In** (OAuth)
   - Fonctionne sur web et mobile
   - Détection automatique de la plateforme
   - Redirection automatique après connexion

2. **Inscription par email**
   - Page dédiée `/auth/register`
   - Validation des champs
   - Confirmation de mot de passe
   - Email de vérification (si activé dans Supabase)

3. **Connexion par email**
   - Page dédiée `/auth/login-email`
   - Formulaire simple
   - Redirection automatique après connexion

---

## 📁 Structure des fichiers

```
app/
├── login.js                 ← Page principale avec Google + liens
├── index.js                 ← Redirection si non connecté
├── _layout.js               ← Initialisation auth
└── auth/
    ├── register.js          ← Page d'inscription email
    └── login-email.js       ← Page de connexion email

store/
└── useStore.js              ← Auth functions (Google, Email, etc.)

lib/
└── supabase.js              ← Client Supabase configuré
```

---

## 🎨 UI/UX

### Page principale (`/login`)
```
┌─────────────────────────────────┐
│ Bienvenue sur Mindy             │
│ Apprends les compétences...     │
│                                 │
│ [📧 Continuer avec Google]      │ ← Google OAuth
│                                 │
│ ────────── ou ─────────         │
│                                 │
│ [Se connecter avec email]       │ ← Lien vers login-email
│ [Créer un compte]               │ ← Lien vers register
└─────────────────────────────────┘
```

### Page d'inscription (`/auth/register`)
```
┌─────────────────────────────────┐
│ Créer un compte                 │
│ Rejoins Mindy...                │
│                                 │
│ Email                           │
│ [ton@email.com          ]       │
│                                 │
│ Mot de passe                    │
│ [****************    ]          │
│                                 │
│ Confirmer le mot de passe       │
│ [****************    ]          │
│                                 │
│ [S'inscrire]                    │
│                                 │
│ Déjà un compte ? Se connecter   │
│ ← Retour                        │
└─────────────────────────────────┘
```

### Page de connexion (`/auth/login-email`)
```
┌─────────────────────────────────┐
│ Connexion                       │
│ Content de te revoir ! 👋       │
│                                 │
│ Email                           │
│ [ton@email.com          ]       │
│                                 │
│ Mot de passe                    │
│ [****************    ]          │
│                                 │
│ [Se connecter]                  │
│                                 │
│ Pas encore de compte ? S'inscrire│
│ ← Retour                        │
└─────────────────────────────────┘
```

---

## 🔧 Configuration Supabase

### Redirect URLs requises

Dans **Supabase Dashboard** > **Authentication** > **URL Configuration** :

```
Site URL:
com.mindy://

Redirect URLs:
http://localhost:8081      ← Web (Expo utilise 8081)
exp://localhost:8081       ← Mobile dev
com.mindy://               ← Production
```

### Providers activés

- ✅ **Google** : Client ID + Secret configurés
- ✅ **Email** : Activé avec confirmations

### Tables recommandées

```sql
-- Table profiles (auto-créé via trigger)
CREATE TABLE profiles (
  id uuid PRIMARY KEY REFERENCES auth.users,
  email text,
  full_name text,
  created_at timestamp DEFAULT now()
);

-- Trigger pour créer profil auto
CREATE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO profiles (id, email)
  VALUES (new.id, new.email);
  RETURN new;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE handle_new_user();
```

---

## 🚀 Flow utilisateur

### Google Sign-In

```
1. Clique "Continuer avec Google"
   ↓
2. Redirection vers Google
   ↓
3. Choisis compte Google
   ↓
4. Autorise Mindy
   ↓
5. Redirection vers app
   ↓
6. Session créée et sauvée
   ↓
7. Redirect vers page d'accueil
```

### Inscription Email

```
1. Clique "Créer un compte"
   ↓
2. Remplis email, password, confirme
   ↓
3. Validation (6+ caractères, passwords match)
   ↓
4. Compte créé dans Supabase
   ↓
5. Email de confirmation envoyé (si activé)
   ↓
6. Redirect vers login-email
```

### Connexion Email

```
1. Clique "Se connecter avec email"
   ↓
2. Entre email et password
   ↓
3. Vérification dans Supabase
   ↓
4. Session créée et sauvée
   ↓
5. Redirect vers page d'accueil
```

---

## 💾 Gestion des sessions

### Stockage

- **Mobile** : AsyncStorage
- **Web** : LocalStorage (via AsyncStorage polyfill)

### Auto-refresh

```javascript
// Dans lib/supabase.js
auth: {
  storage: AsyncStorage,
  autoRefreshToken: true,    // ✅
  persistSession: true,      // ✅
  detectSessionInUrl: false, // ✅ Important pour mobile
}
```

### Listener

```javascript
// Dans store/useStore.js
supabase.auth.onAuthStateChange((event, session) => {
  set({ session, user: session?.user || null });
});
```

---

## 🧪 Tests

### Test 1 : Google Sign-In (Web)
1. `npm start` → appuie sur 'w'
2. Clique "Continuer avec Google"
3. Choisis ton compte
4. Vérifie redirection et connexion

### Test 2 : Google Sign-In (Mobile)
1. `npm start` → scanne QR
2. Même processus que web
3. Vérifie popup navigateur

### Test 3 : Inscription Email
1. Clique "Créer un compte"
2. Email : `test@test.com`
3. Password : `test1234`
4. Vérifie compte créé dans Supabase

### Test 4 : Connexion Email
1. Clique "Se connecter avec email"
2. Entre les identifiants créés
3. Vérifie connexion réussie

### Test 5 : Persistence
1. Connecte-toi (n'importe quelle méthode)
2. Ferme l'app complètement
3. Rouvre l'app
4. → Tu devrais être toujours connecté ✅

---

## 🎯 Checklist

- [ ] Redirect URLs configurées dans Supabase
- [ ] Google Provider activé avec Client ID/Secret
- [ ] Email Provider activé
- [ ] Tables `profiles` créée (optionnel)
- [ ] Trigger `handle_new_user` créé (optionnel)
- [ ] Test Google Sign-In sur web
- [ ] Test Google Sign-In sur mobile
- [ ] Test inscription email
- [ ] Test connexion email
- [ ] Test persistence de session

---

## 📝 Notes

- Les sessions persistent automatiquement (AsyncStorage)
- Google Sign-In fonctionne sur web ET mobile
- Email nécessite confirmation si activé dans Supabase
- Le code détecte automatiquement la plateforme (web/mobile)
- Pas besoin de configuration manuelle des URLs de redirect

---

**Tout est prêt ! 🚀**

