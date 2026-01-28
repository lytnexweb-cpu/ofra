# Stratégie E2E — Ofra CRM

> Document créé le 2026-01-28 suite au Party Mode BMAD.
> Validé par Sam.

---

## 1. Framework Choisi

**Playwright** (TypeScript)

### Pourquoi Playwright ?

| Critère | Playwright | Cypress |
|---------|------------|---------|
| Vitesse | ✅ Rapide, parallélisable | ❌ Plus lent |
| Browsers | ✅ Chrome, Firefox, Safari, Edge | ⚠️ Chromium-only (free) |
| TypeScript | ✅ Natif | ✅ Supporté |
| Auto-wait | ✅ Intelligent | ✅ Oui |
| Communauté | ✅ Microsoft, croissante | ✅ Grande |

**Décision** : Playwright pour sa vitesse et son support multi-browser natif.

---

## 2. Philosophie E2E

### Ce qu'on teste en E2E
- **Parcours critiques** : Les flows que l'utilisateur fait le plus souvent
- **Happy path** : Le chemin où tout fonctionne
- **Intégration réelle** : Frontend ↔ Backend ↔ Database

### Ce qu'on NE teste PAS en E2E
- Edge cases (couverts par tests unitaires)
- Validations de formulaires (couverts par tests unitaires)
- Logique métier complexe (couverts par tests fonctionnels backend)
- Composants UI isolés (couverts par tests Vitest + Testing Library)

### Pyramide de Tests Ofra

```
        /\
       /E2E\         ← 10-15 tests (parcours critiques)
      /------\
     / Func.  \      ← 70 tests backend (API)
    /----------\
   / Unit Tests \    ← 252 tests frontend + services
  /==============\
```

---

## 3. Parcours Critiques à Tester

### Parcours 1 : Authentification

| Test | Description | Priorité |
|------|-------------|----------|
| `auth-register` | Créer un compte → recevoir welcome email → login | P1 |
| `auth-login` | Email + password → accès dashboard | P1 |
| `auth-logout` | Clic logout → retour login page | P1 |
| `auth-forgot-password` | Demander reset → recevoir email | P2 |

### Parcours 2 : Transactions (Core Business)

| Test | Description | Priorité |
|------|-------------|----------|
| `tx-create` | Sélectionner template → créer transaction | P1 |
| `tx-list` | Voir liste des transactions → filtrer par step | P1 |
| `tx-detail` | Cliquer transaction → voir détails + steps | P1 |
| `tx-advance` | Avancer une step → voir progression | P1 |
| `tx-skip` | Sauter une step → voir progression | P2 |

### Parcours 3 : Clients

| Test | Description | Priorité |
|------|-------------|----------|
| `client-create` | Formulaire → créer client | P1 |
| `client-list` | Voir liste des clients | P2 |
| `client-link-tx` | Créer transaction avec client existant | P1 |

---

## 4. Structure des Fichiers

```
frontend/
├── e2e/
│   ├── fixtures/
│   │   └── test-data.ts         # Données de test réutilisables
│   ├── pages/
│   │   ├── login.page.ts        # Page Object: Login
│   │   ├── dashboard.page.ts    # Page Object: Dashboard
│   │   ├── transaction.page.ts  # Page Object: Transaction
│   │   └── client.page.ts       # Page Object: Client
│   ├── auth.spec.ts             # Tests auth
│   ├── transaction.spec.ts      # Tests transaction
│   └── client.spec.ts           # Tests client
├── playwright.config.ts
```

---

## 5. Configuration Recommandée

### playwright.config.ts

```typescript
export default defineConfig({
  testDir: './e2e',
  timeout: 30000,
  retries: process.env.CI ? 2 : 0,
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    // Firefox et Safari en CI seulement
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
  },
})
```

---

## 6. Prérequis pour les Tests

### Base de données
- Tests E2E utilisent une DB de test séparée
- Seed avec données minimales avant chaque suite
- Cleanup après chaque suite

### Backend
- Doit être running sur `localhost:3333`
- Connecté à la DB de test

### Frontend
- Dev server sur `localhost:5173`
- Playwright le lance automatiquement si pas running

---

## 7. Patterns à Suivre

### Page Object Pattern
```typescript
// pages/login.page.ts
export class LoginPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/login')
  }

  async login(email: string, password: string) {
    await this.page.fill('[data-testid="email"]', email)
    await this.page.fill('[data-testid="password"]', password)
    await this.page.click('[data-testid="submit"]')
  }
}
```

### Data-testid Convention
- Tous les éléments interactifs doivent avoir un `data-testid`
- Format : `kebab-case` (ex: `transaction-card`, `step-advance-btn`)

---

## 8. Estimations

| Phase | Contenu | Effort |
|-------|---------|--------|
| Setup | Installer Playwright, config, structure | ~30 min |
| Auth tests | 4 tests | ~45 min |
| Transaction tests | 5 tests | ~1h |
| Client tests | 3 tests | ~30 min |
| **Total** | **12 tests E2E** | **~3h** |

---

## 9. Critères de Succès

- [ ] 12 tests E2E passent en local
- [ ] Tests peuvent tourner en CI (GitHub Actions)
- [ ] Temps d'exécution < 2 minutes
- [ ] Screenshots sur échec pour debug

---

## 10. Non-Goals (Hors Scope)

- Tests de performance (Lighthouse)
- Tests d'accessibilité (a11y)
- Tests visuels (Percy, Chromatic)
- Tests mobile (responsive)

Ces éléments pourront être ajoutés dans une phase ultérieure.

---

_Document créé par Paige (Tech Writer) — 2026-01-28_
_Validé par : Sam (Admin), Équipe BMAD_
