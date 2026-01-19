# Instructions Sonnet - Tâche 2: Rebranding "CRM Yanick" → "Ofra"

**Auteur**: Architecte Senior
**Date**: 2026-01-18
**Objectif**: Rebranding complet sans casser la logique métier ni les tests

---

## RÈGLES ABSOLUES

1. **ZÉRO changement de logique métier** - Uniquement strings/textes/config
2. **Tests doivent rester VERTS** - Vérifier après chaque étape majeure
3. **NE PAS renommer** le dossier `crm-yanick` ni le repo
4. **NE PAS commit de secrets** - `.env.test` doit rester hors git
5. **3 commits séparés** avec messages EXACTS fournis
6. **Inventaire AVANT remplacement** - Pas de replace aveugle

---

## ÉTAPE 1: Créer la branche

```bash
cd C:/Users/Lytnex/crm-yanick
git checkout -b feat/rebrand-ofra
```

---

## ÉTAPE 2: Scanner les occurrences

Fais un inventaire complet des occurrences à remplacer:

```bash
# Scanner toutes les occurrences
grep -r -i "yanick" --include="*.ts" --include="*.tsx" --include="*.json" --include="*.md" --include="*.html" --include="*.env*" . 2>/dev/null | grep -v node_modules | grep -v dist | grep -v ".git"
```

**Termes à chercher:**
- `Yanick`
- `CRM Yanick`
- `crm-yanick`
- `Yanick Boudreau`
- `yanick@`
- `crm_yanick` (dans configs DB - NE PAS CHANGER)

**IMPORTANT:** Ne PAS changer:
- Noms de base de données (`crm_yanick`, `crm_yanick_test`)
- Noms de containers Docker
- URLs Fly.io existantes

---

## ÉTAPE 3: Créer le système de branding Frontend

**Créer**: `frontend/src/config/brand.ts`

```typescript
/**
 * Centralized brand configuration for Ofra
 * Change values here to rebrand the entire application
 */
export const BRAND = {
  // Core identity
  name: 'Ofra',
  tagline: "De l'offre aux clés",
  taglineEn: 'From offer to keys',

  // Contact & links
  domain: 'ofra.ca',
  supportEmail: 'support@ofra.ca',

  // Visual identity
  colors: {
    primary: '#2563EB',    // Blue - professional
    secondary: '#059669',  // Green - trust
  },

  // Legal
  companyName: 'Ofra',
  copyright: `© ${new Date().getFullYear()} Ofra. All rights reserved.`,
} as const

export type Brand = typeof BRAND
```

---

## ÉTAPE 4: Créer le système de branding Backend

**Créer**: `backend/config/brand.ts`

```typescript
/**
 * Centralized brand configuration for Ofra
 * Used in emails, logs, and API responses
 */
const brand = {
  // Core identity
  name: 'Ofra',
  tagline: "De l'offre aux clés | From offer to keys",

  // Contact
  domain: 'ofra.ca',
  supportEmail: 'support@ofra.ca',

  // Email settings
  email: {
    fromName: 'Ofra',
    signature: 'L\'équipe Ofra | The Ofra Team',
  },
}

export default brand
```

---

## ÉTAPE 5: Mettre à jour le Frontend (UI + docs)

### 5.1 Mettre à jour `frontend/index.html`

Remplacer le title:
```html
<title>Ofra - Real Estate Transaction Management</title>
```

### 5.2 Mettre à jour les composants UI

**Fichiers probables à modifier:**
- `frontend/src/components/Layout.tsx` - Header/Sidebar
- `frontend/src/components/Navbar.tsx` (si existe)
- `frontend/src/App.tsx` (si titre présent)
- Tout fichier avec "Yanick" ou "CRM" visible

**Pattern de remplacement:**

AVANT:
```typescript
<h1>CRM Yanick</h1>
// ou
const appName = "CRM Yanick"
```

APRÈS:
```typescript
import { BRAND } from '../config/brand'

<h1>{BRAND.name}</h1>
// ou
const appName = BRAND.name
```

### 5.3 Mettre à jour le README principal

**Modifier**: `README.md`

Remplacer:
- "CRM Yanick" → "Ofra"
- "Yanick's CRM" → "Ofra"
- "yanick@crm.local" → "demo@ofra.ca" (dans exemples)
- Garder les références techniques (noms de DB, etc.)

Ajouter en haut:
```markdown
# Ofra

> De l'offre aux clés | From offer to keys

Real Estate Transaction Management Platform
```

### 5.4 Mettre à jour package.json (optionnel, metadata seulement)

**Modifier**: `frontend/package.json`

```json
{
  "name": "ofra-frontend",
  ...
}
```

---

## ÉTAPE 6: Lancer les tests Frontend

```bash
cd C:/Users/Lytnex/crm-yanick/frontend
npm run test:run
```

**Attendu**: 3 tests passent

Si un test échoue à cause du rebranding (ex: cherche "CRM Yanick" dans le DOM), adapter le test pour chercher "Ofra" ou utiliser `BRAND.name`.

---

## ÉTAPE 7: Premier Commit (UI + docs)

```bash
cd C:/Users/Lytnex/crm-yanick
git add frontend/src/config/brand.ts
git add frontend/index.html
git add frontend/src/components/
git add frontend/package.json
git add README.md
git status  # Vérifier qu'aucun secret n'est inclus
git commit -m "chore(brand): rebrand UI and docs to Ofra"
```

---

## ÉTAPE 8: Mettre à jour le Backend

### 8.1 Mettre à jour les templates emails

**Fichier principal**: `backend/app/services/transaction_automation_service.ts`

Chercher et remplacer:
- "CRM Yanick" → "Ofra"
- "Yanick" (dans signatures) → "Ofra"
- Toute mention du nom dans les sujets/corps d'emails

**Pattern:**

AVANT:
```typescript
const subject = "CRM Yanick - Votre offre a été acceptée"
```

APRÈS:
```typescript
import brand from '#config/brand'

const subject = `${brand.name} - Votre offre a été acceptée`
```

### 8.2 Mettre à jour les logs/messages

Chercher dans:
- `backend/app/controllers/*.ts`
- `backend/app/services/*.ts`
- `backend/app/exceptions/*.ts`

Remplacer les strings "Yanick" ou "CRM Yanick" par référence à brand.

### 8.3 Mettre à jour le seeder (email de démo)

**Modifier**: `backend/database/seeders/user_seeder.ts`

AVANT:
```typescript
email: 'yanick@crm.local'
```

APRÈS:
```typescript
email: 'demo@ofra.local'
```

### 8.4 Mettre à jour .env.example

**Modifier**: `backend/.env.example`

Remplacer les références "yanick" dans les commentaires ou valeurs d'exemple.

### 8.5 Mettre à jour package.json backend (metadata)

**Modifier**: `backend/package.json`

```json
{
  "name": "ofra-backend",
  ...
}
```

---

## ÉTAPE 9: Gérer .env.test

### 9.1 Créer .env.test.example

**Créer**: `backend/.env.test.example`

```env
# Test environment configuration
# Copy to .env.test and fill in values

NODE_ENV=test
DB_HOST=localhost
DB_PORT=5432
DB_USER=root
DB_PASSWORD=your_test_password
DB_DATABASE=crm_yanick_test
APP_KEY=your-test-app-key-minimum-32-characters
SESSION_DRIVER=cookie
ENFORCE_BLOCKING_CONDITIONS=true

# SMTP not needed for tests (emails fail gracefully)
# SMTP_HOST=
# SMTP_PORT=
```

### 9.2 Vérifier .gitignore

**Vérifier/Modifier**: `backend/.gitignore`

S'assurer que cette ligne existe:
```
.env.test
```

Si `.env.test` a déjà été commité, le retirer:
```bash
git rm --cached backend/.env.test 2>/dev/null || true
```

---

## ÉTAPE 10: Lancer les tests Backend

```bash
cd C:/Users/Lytnex/crm-yanick/backend
node ace test
```

**Attendu**: 16 tests passent

Les erreurs SMTP sont normales et attendues.

---

## ÉTAPE 11: Deuxième Commit (Backend + emails)

```bash
cd C:/Users/Lytnex/crm-yanick
git add backend/config/brand.ts
git add backend/app/services/
git add backend/app/controllers/
git add backend/database/seeders/
git add backend/package.json
git add backend/.env.example
git status  # Vérifier qu'aucun .env.test n'est inclus
git commit -m "chore(brand): rebrand backend and email templates to Ofra"
```

---

## ÉTAPE 12: Troisième Commit (Cleanup .env)

```bash
cd C:/Users/Lytnex/crm-yanick
git add backend/.env.test.example
git add backend/.gitignore
git status
git commit -m "chore: add .env.test.example and update gitignore"
```

---

## CHECKLIST FINALE

Avant de considérer terminé:

- [ ] Branche `feat/rebrand-ofra` créée
- [ ] `frontend/src/config/brand.ts` créé
- [ ] `backend/config/brand.ts` créé
- [ ] `frontend/index.html` title → "Ofra"
- [ ] Composants UI utilisent `BRAND.name`
- [ ] README mis à jour
- [ ] Templates emails utilisent `brand.name`
- [ ] Seeder utilise `demo@ofra.local`
- [ ] `.env.test.example` créé
- [ ] `.env.test` dans `.gitignore`
- [ ] Tests frontend passent (3/3)
- [ ] Tests backend passent (16/16)
- [ ] 3 commits avec messages exacts
- [ ] Aucun secret dans les commits (`git diff --staged` avant chaque commit)

---

## RÉSUMÉ DES COMMITS ATTENDUS

```
1. chore(brand): rebrand UI and docs to Ofra
   - frontend/src/config/brand.ts (nouveau)
   - frontend/index.html
   - frontend/src/components/*.tsx
   - frontend/package.json
   - README.md

2. chore(brand): rebrand backend and email templates to Ofra
   - backend/config/brand.ts (nouveau)
   - backend/app/services/transaction_automation_service.ts
   - backend/database/seeders/user_seeder.ts
   - backend/package.json
   - backend/.env.example

3. chore: add .env.test.example and update gitignore
   - backend/.env.test.example (nouveau)
   - backend/.gitignore
```

---

## COMMENT REVENIR EN ARRIÈRE

Si besoin de rollback:

```bash
# Voir les commits
git log --oneline -5

# Rollback un commit
git revert <commit-hash>

# Ou rollback toute la branche
git checkout main
git branch -D feat/rebrand-ofra
```

---

## CE QU'IL NE FAUT PAS TOUCHER

| Élément | Raison |
|---------|--------|
| `crm_yanick` (nom DB) | Casserait les connexions |
| `crm_yanick_test` (nom DB test) | Casserait les tests |
| Dossier `crm-yanick` | Casserait tous les paths |
| URLs Fly.io | Config déploiement |
| `docker-compose.yml` container names | Casserait Docker |

---

FIN DES INSTRUCTIONS
