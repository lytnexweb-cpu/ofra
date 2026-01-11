# Fonctionnalité "Settings" - Documentation Complète

## Vue d'ensemble

Cette fonctionnalité permet à l'utilisateur unique du CRM (Yanick) de gérer son compte et ses préférences via l'interface avec **5 onglets complets** :
- 🔒 **Password** - Changer son mot de passe + se déconnecter de tous les appareils
- ✉️ **Email** - Changer son adresse email
- 👤 **Profile** - Gérer ses informations professionnelles (nom, téléphone, agence, licence)
- ✍️ **Email Signature** - Personnaliser la signature des emails automatiques
- 🎨 **Display** - Configurer langue, format de date, et timezone

## Architecture

### Backend (AdonisJS v6)

#### Fichiers créés

1. **`backend/app/validators/profile_validator.ts`**
   - Validateurs pour changement de mot de passe et email
   - Validation : newPassword ≥ 8 caractères + confirmation
   - Validation : currentPassword requis pour toute modification
   - Validateur pour mise à jour des informations de profil (updateProfileInfoValidator)

2. **`backend/app/controllers/profile_controller.ts`**
   - `changePassword()` - PUT /api/me/password
   - `updateProfile()` - PUT /api/me (email uniquement)
   - `updateProfileInfo()` - PUT /api/me/profile (nom, téléphone, agence, licence, signature)
   - `logoutAll()` - POST /api/me/logout-all

3. **`backend/database/migrations/*_add_profile_and_preferences_to_users_table.ts`**
   - Ajoute 8 nouveaux champs au modèle User:
     - `phone` (VARCHAR nullable) - Téléphone professionnel
     - `agency` (VARCHAR nullable) - Nom de l'agence/courtage
     - `license_number` (VARCHAR nullable) - Numéro de licence immobilière
     - `profile_photo` (TEXT nullable) - Photo de profil (base64 ou URL)
     - `email_signature` (TEXT nullable) - Signature HTML personnalisée
     - `language` (VARCHAR default 'fr') - Langue préférée
     - `date_format` (VARCHAR default 'DD/MM/YYYY') - Format de date
     - `timezone` (VARCHAR default 'America/Toronto') - Fuseau horaire

#### Fichiers modifiés

1. **`backend/start/routes.ts`**
   - Ajout de 4 routes protégées dans le groupe auth middleware

2. **`backend/app/models/user.ts`**
   - Ajout de 8 nouveaux champs avec `@column()` decorators
   - Mapping snake_case ↔ camelCase automatique

3. **`backend/app/services/transaction_automation_service.ts`**
   - Méthode `getSignature(user, language)` pour générer signatures personnalisées
   - Intégration dans tous les templates d'email automatiques

#### Routes API

```typescript
// Toutes protégées par middleware auth
PUT    /api/me/password         // Changer mot de passe
PUT    /api/me                  // Changer email
PUT    /api/me/profile          // Mettre à jour informations professionnelles
POST   /api/me/logout-all       // Se déconnecter partout
```

### Frontend (React + Vite + Tailwind)

#### Fichiers créés/Modifiés

1. **`frontend/src/api/profile.api.ts`**
   - Client API pour les opérations de profil
   - Types TypeScript pour les requêtes
   - Interfaces: `UpdateProfileInfoRequest` avec 8 champs

2. **`frontend/src/pages/SettingsPage.tsx`** (RÉÉCRIT COMPLET - 433 lignes)
   - Page principale avec **5 onglets**:
     - 🔒 **Password Tab**: Changement de mot de passe + "Sign Out Everywhere"
     - ✉️ **Email Tab**: Changement d'adresse email
     - 👤 **Profile Tab**: Nom, téléphone, agence, licence (4 champs)
     - ✍️ **Email Signature Tab**: Signature HTML personnalisée pour emails automatiques
     - 🎨 **Display Tab**: Langue (fr/en), format date (DD/MM/YYYY ou MM/DD/YYYY), timezone (6 zones canadiennes)
   - State management séparé pour chaque onglet
   - Validation côté client
   - Messages de succès/erreur auto-clear après 3 secondes
   - Query invalidation automatique après mises à jour

#### Fichiers modifiés

1. **`frontend/src/app/router.tsx`**
   - Ajout de la route `/settings`
   - Import de SettingsPage

2. **`frontend/src/components/Layout.tsx`**
   - Ajout du lien "Settings" dans la navigation (⚙️)

## Tests et validation

### 1. Test Backend (API)

#### Démarrer le backend
```bash
cd backend
npm run dev
```

#### Test 1: Changer le mot de passe

**Requête :**
```bash
curl -X PUT http://localhost:3333/api/me/password \
  -H "Content-Type: application/json" \
  -H "Cookie: adonis-session=YOUR_SESSION_COOKIE" \
  -d '{
    "currentPassword": "password123",
    "newPassword": "newpassword123",
    "newPasswordConfirmation": "newpassword123"
  }'
```

**Réponse attendue (succès) :**
```json
{
  "success": true,
  "data": {
    "message": "Password changed successfully"
  }
}
```

**Cas d'erreur 1 : Mot de passe actuel incorrect**
```json
{
  "success": false,
  "error": {
    "message": "Current password is incorrect",
    "code": "E_INVALID_CURRENT_PASSWORD"
  }
}
```

**Cas d'erreur 2 : Validation échouée (mot de passe trop court)**
```json
{
  "success": false,
  "error": {
    "message": "Validation failed",
    "code": "E_VALIDATION_FAILED",
    "details": {
      "newPassword": ["The newPassword field must have at least 8 characters"]
    }
  }
}
```

**Cas d'erreur 3 : Mots de passe ne correspondent pas**
```json
{
  "success": false,
  "error": {
    "message": "Validation failed",
    "code": "E_VALIDATION_FAILED",
    "details": {
      "newPassword": ["The newPassword field and newPasswordConfirmation field must be the same"]
    }
  }
}
```

#### Test 2: Changer l'email

**Requête :**
```bash
curl -X PUT http://localhost:3333/api/me \
  -H "Content-Type: application/json" \
  -H "Cookie: adonis-session=YOUR_SESSION_COOKIE" \
  -d '{
    "email": "yanick.new@crm.local",
    "currentPassword": "password123"
  }'
```

**Réponse attendue (succès) :**
```json
{
  "success": true,
  "data": {
    "message": "Profile updated successfully",
    "user": {
      "id": 1,
      "email": "yanick.new@crm.local",
      "fullName": "Yanick"
    }
  }
}
```

**Cas d'erreur 1 : Email déjà utilisé**
```json
{
  "success": false,
  "error": {
    "message": "This email is already in use",
    "code": "E_EMAIL_IN_USE"
  }
}
```

**Cas d'erreur 2 : Mot de passe actuel incorrect**
```json
{
  "success": false,
  "error": {
    "message": "Current password is incorrect",
    "code": "E_INVALID_CURRENT_PASSWORD"
  }
}
```

#### Test 3: Se déconnecter partout

**Requête :**
```bash
curl -X POST http://localhost:3333/api/me/logout-all \
  -H "Cookie: adonis-session=YOUR_SESSION_COOKIE"
```

**Réponse attendue :**
```json
{
  "success": true,
  "data": {
    "message": "Logged out successfully. Note: Cookie-based sessions on other devices will expire naturally."
  }
}
```

### 2. Test Frontend (UI)

#### Démarrer le frontend
```bash
cd frontend
npm run dev
```

#### Accéder à la page Settings
1. Se connecter avec `yanick@crm.local` / `password123`
2. Cliquer sur "Settings ⚙️" dans la navigation
3. URL : http://localhost:5173/settings

#### Test 1: Changer le mot de passe (succès)

**Étapes :**
1. Onglet "Password" (actif par défaut)
2. Remplir le formulaire :
   - Current Password: `password123`
   - New Password: `newpassword123`
   - Confirm New Password: `newpassword123`
3. Cliquer sur "Change Password"

**Résultat attendu :**
- ✅ Message vert : "Password changed successfully"
- ✅ Formulaire réinitialisé (champs vides)
- ✅ Bouton disabled pendant le chargement

#### Test 2: Changer le mot de passe (erreur - mdp actuel faux)

**Étapes :**
1. Current Password: `wrongpassword`
2. New Password: `newpassword123`
3. Confirm New Password: `newpassword123`
4. Soumettre

**Résultat attendu :**
- ❌ Message rouge : "Current password is incorrect"

#### Test 3: Changer le mot de passe (erreur - validation)

**Étapes :**
1. New Password: `short` (moins de 8 caractères)
2. Confirm New Password: `short`
3. Soumettre

**Résultat attendu :**
- ❌ Message rouge : "New password must be at least 8 characters long"

#### Test 4: Changer le mot de passe (erreur - confirmation)

**Étapes :**
1. New Password: `newpassword123`
2. Confirm New Password: `different123`
3. Soumettre

**Résultat attendu :**
- ❌ Message rouge : "New passwords do not match"

#### Test 5: Changer l'email (succès)

**Étapes :**
1. Aller dans l'onglet "Email"
2. Remplir le formulaire :
   - New Email: `yanick.updated@crm.local`
   - Current Password: `password123`
3. Cliquer sur "Update Email"

**Résultat attendu :**
- ✅ Message vert : "Profile updated successfully"
- ✅ Champ password réinitialisé
- ✅ Email actuel mis à jour dans l'interface

#### Test 6: Changer l'email (erreur - mdp incorrect)

**Étapes :**
1. New Email: `new.email@test.com`
2. Current Password: `wrongpassword`
3. Soumettre

**Résultat attendu :**
- ❌ Message rouge : "Current password is incorrect"

#### Test 7: Se déconnecter partout

**Étapes :**
1. Retour à l'onglet "Password"
2. Scroller jusqu'à la section "Sign Out Everywhere"
3. Cliquer sur "Sign Out Everywhere"
4. Confirmer dans la dialog

**Résultat attendu :**
- ✅ Redirection vers `/login`
- ✅ Session terminée
- ✅ Impossible d'accéder aux pages protégées sans se reconnecter

### 3. Test de bout en bout (E2E)

#### Scénario complet

1. **Se connecter** avec les identifiants par défaut
2. **Changer le mot de passe** : `password123` → `newpassword456`
3. **Se déconnecter** (bouton normal)
4. **Se reconnecter** avec le nouveau mot de passe `newpassword456`
5. **Changer l'email** : `yanick@crm.local` → `yanick.updated@crm.local`
6. **Vérifier** que l'email est mis à jour dans le header/nav
7. **Se déconnecter partout**
8. **Se reconnecter** avec le nouvel email et le nouveau mot de passe
9. **Remettre les valeurs par défaut** pour les autres tests

## Gestion des erreurs

### Backend

| Code d'erreur | Description | HTTP Status |
|---------------|-------------|-------------|
| `E_INVALID_CURRENT_PASSWORD` | Mot de passe actuel incorrect | 422 |
| `E_EMAIL_IN_USE` | Email déjà utilisé par un autre compte | 422 |
| `E_VALIDATION_FAILED` | Validation des champs échouée | 422 |
| `E_LOGOUT_FAILED` | Échec de la déconnexion | 400 |

### Frontend

Les erreurs sont affichées dans des bandeaux colorés :
- ✅ **Succès** : Fond vert clair, bordure verte, texte vert foncé
- ❌ **Erreur** : Fond rouge clair, bordure rouge, texte rouge foncé

Messages d'erreur possibles :
- "Current password is incorrect"
- "New passwords do not match"
- "New password must be at least 8 characters long"
- "This email is already in use"
- "Network error. Please check your connection and try again."

## Sécurité

### Backend

1. **Vérification du mot de passe actuel** : Toutes les modifications (password/email) nécessitent le mot de passe actuel
2. **Hash automatique** : Le nouveau mot de passe est hashé via le hook `beforeSave` du modèle User
3. **Middleware auth** : Toutes les routes sont protégées par `middleware.auth()`
4. **Validation stricte** : Minimum 8 caractères pour les nouveaux mots de passe
5. **Email unique** : Vérification que l'email n'est pas déjà utilisé

### Frontend

1. **Validation côté client** : Vérification avant l'envoi de la requête
2. **Credentials inclus** : `credentials: 'include'` dans les requêtes HTTP
3. **Pas de stockage du mot de passe** : Les champs password sont réinitialisés après succès
4. **Confirmation utilisateur** : Dialog de confirmation pour "Sign Out Everywhere"

## Limitations connues

### "Sign Out Everywhere"

⚠️ **Note importante** : Avec les sessions basées sur des cookies (implémentation actuelle), il n'est pas possible de réellement invalider toutes les sessions sur tous les appareils.

**Ce qui se passe actuellement :**
- La session active est détruite
- L'utilisateur est redirigé vers `/login`
- Les autres sessions (autres navigateurs/appareils) restent actives jusqu'à expiration naturelle (défini dans `config/session.ts`)

**Solutions possibles pour un vrai "logout everywhere" :**
1. **Database session storage** : Stocker les sessions en DB et les supprimer toutes
2. **Token blacklisting** : Utiliser JWT + blacklist des tokens
3. **Session versioning** : Ajouter un `sessionVersion` dans le modèle User et l'incrémenter

Pour l'instant, le message retourné est clair :
```
"Logged out successfully. Note: Cookie-based sessions on other devices will expire naturally."
```

## Commandes de déploiement

### Build et test en local
```bash
# Backend
cd backend
npm run build
npm run dev

# Frontend
cd frontend
npm run build
npm run dev
```

### Déploiement sur Fly.io
```bash
# Backend
cd backend
fly deploy

# Frontend
cd frontend
fly deploy
```

## Checklist de validation

### Backend
- [ ] `npm run build` sans erreurs
- [ ] Routes accessibles via curl/Postman
- [ ] Validation des erreurs fonctionne
- [ ] Hash du mot de passe vérifié en DB

### Frontend
- [ ] `npm run build` sans erreurs
- [ ] Page /settings accessible
- [ ] Formulaire mot de passe fonctionnel
- [ ] Formulaire email fonctionnel
- [ ] Bouton "Sign Out Everywhere" fonctionne
- [ ] Messages d'erreur affichés correctement
- [ ] États de chargement visibles

### UX
- [ ] Navigation vers Settings visible
- [ ] Tabs fonctionnent
- [ ] Forms réinitialisés après succès
- [ ] Loading states pendant les requêtes
- [ ] Messages de succès/erreur clairs
- [ ] Responsive design OK

## Captures d'écran (à ajouter)

1. Page Settings - Onglet Password
2. Page Settings - Onglet Email
3. Message de succès (changement de password)
4. Message d'erreur (mot de passe incorrect)
5. Navigation avec lien Settings

---

## Détails des 5 Onglets

### 1. Password Tab 🔒
**Fonctionnalités:**
- Changement de mot de passe sécurisé
- Vérification du mot de passe actuel
- Confirmation du nouveau mot de passe
- Validation: minimum 8 caractères
- Bouton "Sign Out Everywhere" (déconnexion de tous les appareils)
- Message d'avertissement sur les sessions cookies

**Champs:**
- Current Password (requis)
- New Password (minimum 8 caractères)
- Confirm New Password (doit matcher)

### 2. Email Tab ✉️
**Fonctionnalités:**
- Changement d'adresse email
- Vérification du mot de passe actuel (sécurité)
- Validation d'unicité de l'email
- Invalidation automatique du cache après mise à jour

**Champs:**
- New Email (valide format email)
- Current Password (requis)

### 3. Profile Tab 👤
**Fonctionnalités:**
- Gestion des informations professionnelles
- Utilisé pour les signatures d'email automatiques
- Aucun mot de passe requis (pas de données sensibles)

**Champs:**
- Full Name (nom complet affiché dans emails)
- Phone Number (téléphone professionnel)
- Agency Name (nom du courtage/agence)
- License Number (numéro de licence immobilière)

### 4. Email Signature Tab ✍️
**Fonctionnalités:**
- Personnalisation de la signature des emails automatiques
- Support HTML complet
- Exemple de signature professionnelle fourni
- Utilisée dans les 6 templates d'emails (3 acheteur, 3 vendeur)
- Fallback: si vide, utilise "Yanick - Agent immobilier"

**Champs:**
- Email Signature (textarea HTML, 6 rows)

**Placeholder exemple:**
```html
Yanick B.<br/>
Agent immobilier agréé<br/>
📱 514-XXX-XXXX<br/>
📧 yanick@example.com
```

### 5. Display Tab 🎨
**Fonctionnalités:**
- Préférences d'affichage (prêt pour future i18n)
- Configuration de la langue de l'interface
- Format de date préféré
- Timezone pour affichage correct des dates/heures

**Champs:**
- Language: Français (fr) / English (en)
- Date Format: DD/MM/YYYY (européen) / MM/DD/YYYY (américain)
- Timezone: 6 zones canadiennes
  - America/Toronto (Eastern - Ontario, Québec)
  - America/Vancouver (Pacific - Colombie-Britannique)
  - America/Montreal (Eastern - Québec)
  - America/Edmonton (Mountain - Alberta)
  - America/Halifax (Atlantic - Nouvelle-Écosse)
  - America/Regina (Central - Saskatchewan)

---

**Auteur** : CRM Yanick MVP++
**Date** : 10 janvier 2026
**Version** : 2.0.0 (avec Profile, Email Signature, Display tabs)
