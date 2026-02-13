# Spec Technique — Emails & Notifications In-App

**Date** : 2026-02-12
**Auteur** : Paige (Tech Writer) — Party Mode
**Statut** : En attente d'approbation
**Chantier** : Système complet de communication (emails + cloche)

---

## 1. Vision

Le courtier a deux canaux de communication :

| Canal | Audience | Rôle |
|---|---|---|
| **Emails** (23 total) | Courtier + parties externes | Communication officielle |
| **Cloche in-app** | Courtier seul | Centre de contrôle — alertes + confirmations d'envoi |

La cloche dit au courtier :
- **Ce qui demande son attention** : deadlines, conditions en retard, alertes bloquantes
- **Ce qui a été communiqué** : "Courriel envoyé à Me Tremblay et Marie Dupont"

---

## 2. Inventaire complet des emails

### 2.1 Existants (10)

| # | Classe | Destinataire | Déclencheur | Cloche? |
|---|---|---|---|---|
| 1 | WelcomeMail | Utilisateur | Inscription | — |
| 2 | EmailVerificationMail | Utilisateur | Inscription | — |
| 3 | PasswordResetMail | Utilisateur | Mot de passe oublié | — |
| 4 | OfferAcceptedMail | Client | Automation (step) | ✅ "Courriel envoyé à [client]" |
| 5 | FirmConfirmedMail | Client | Automation (step) | ✅ "Courriel envoyé à [client]" |
| 6 | CelebrationMail | Client | Automation (closing) | ✅ "Courriel envoyé à [client]" |
| 7 | FintracReminderMail | Client | Automation (compliance) | ✅ "Rappel FINTRAC envoyé à [client]" |
| 8 | GoogleReviewReminderMail | Client | Automation (post-closing) | ✅ "Demande d'avis envoyée à [client]" |
| 9 | DeadlineWarningMail | Courtier | Job (48h avant) | ✅ "Deadline dans 48h — [condition]" |
| 10 | DailyDigestMail | Courtier | Job (quotidien) | ✅ "Résumé quotidien disponible" |

### 2.2 Nouveaux (13)

#### Batch 1 — Collaboration (3)

| # | Classe | Destinataire | Déclencheur | Cloche? |
|---|---|---|---|---|
| 11 | MemberInvitationMail | Membre invité | Ajout collaborateur | ✅ "Invitation envoyée à [email]" |
| 12 | PartyAddedMail | Partie (avocat, notaire...) | Ajout partie | ✅ "Courriel envoyé à [nom] ([rôle])" |
| 13 | ShareLinkMail | Destinataire du lien | Partage transaction | ✅ "Lien de partage envoyé à [email]" |

#### Batch 2 — Offres (4)

| # | Classe | Destinataire | Déclencheur | Cloche? |
|---|---|---|---|---|
| 14 | OfferSubmittedMail | Courtier + parties | Offre soumise | ✅ "Offre soumise — [montant]$. Courriel envoyé à [parties]" |
| 15 | OfferCounteredMail | Courtier + parties | Contre-offre | ✅ "Contre-offre — [montant]$. Courriel envoyé à [parties]" |
| 16 | OfferRejectedMail | Courtier + parties | Offre refusée | ✅ "Offre refusée. Courriel envoyé à [parties]" |
| 17 | OfferExpiredMail | Courtier + parties | Offre expirée | ✅ "Offre expirée. Courriel envoyé à [parties]" |

#### Batch 3 — Avancement & Conditions (4)

| # | Classe | Destinataire | Déclencheur | Cloche? |
|---|---|---|---|---|
| 18 | StepAdvancedMail | Parties | Étape validée | ✅ "Étape [nom] complétée. Courriel envoyé à [parties]" |
| 19 | ConditionResolvedMail | Courtier + parties | Condition complétée/levée | ✅ "Condition [titre] résolue. Courriel envoyé à [parties]" |
| 20 | BlockingConditionAlertMail | Courtier + parties | Condition bloquante dépassée | ✅ "⚠️ URGENT — Condition bloquante en retard: [titre]" |
| 21 | ConditionAssignedMail | Partie responsable | Condition assignée | ✅ "Condition [titre] assignée à [partie]. Courriel envoyé." |

#### Batch 4 — Transaction (2)

| # | Classe | Destinataire | Déclencheur | Cloche? |
|---|---|---|---|---|
| 22 | TransactionCancelledMail | Toutes les parties | Annulation | ✅ "Transaction annulée. Courriel envoyé à [N] parties" |
| 23 | TransactionRecapMail | Sélection manuelle | Envoi manuel | ✅ "Récapitulatif envoyé à [destinataires]" |

---

## 3. Système de notifications in-app (Cloche)

### 3.1 Modèle de données

```sql
CREATE TABLE notifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  transaction_id INTEGER REFERENCES transactions(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  -- Types: deadline_warning | condition_overdue | condition_resolved |
  --        blocking_alert | step_advanced | offer_update |
  --        email_sent | member_invited | party_added |
  --        transaction_cancelled | share_sent | daily_digest
  title VARCHAR(255) NOT NULL,
  body TEXT,
  icon VARCHAR(10),           -- emoji: ⏰ ✅ ⚠️ 📨 📋 etc.
  severity VARCHAR(20) DEFAULT 'info',
  -- Severity: info | warning | urgent
  link VARCHAR(500),          -- ex: /transactions/123
  email_recipients TEXT[],    -- ["Me Tremblay (avocat)", "Marie Dupont (client)"]
  read_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_unread ON notifications(user_id, read_at)
  WHERE read_at IS NULL;
CREATE INDEX idx_notifications_user_created ON notifications(user_id, created_at DESC);
```

### 3.2 API

| Méthode | Route | Description |
|---|---|---|
| GET | `/api/notifications` | Liste paginée (défaut: 20, non-lues en premier) |
| GET | `/api/notifications/unread-count` | Nombre de non-lues (pour le badge) |
| PATCH | `/api/notifications/:id/read` | Marquer comme lue |
| POST | `/api/notifications/read-all` | Tout marquer comme lu |

### 3.3 Composant UI

**Emplacement** : Bouton cloche existant dans `Layout.tsx` (lignes 189-194 mobile, 225-230 desktop)

**Comportement** :
- Badge rouge avec compteur (non-lues)
- Click → Dropdown Radix Popover (max 300px large, max 400px haut)
- Liste scrollable de notifications
- Chaque notification : icône + titre + body + temps relatif + indicateur non-lue
- Notifications urgentes (severity=urgent) : fond rouge pâle
- Click sur notification → navigue vers `link` + marque comme lue
- Bouton "Tout marquer comme lu" en haut du dropdown
- Polling toutes les 60 secondes pour le badge count (pas de WebSocket pour v1)

### 3.4 Exemples de notifications

```
⏰ Deadline dans 48h                                    il y a 2h
   Inspection — Transaction Dupont
   Consultez votre courriel pour les détails

✅ Étape "Offre acceptée" complétée                     il y a 3h
   Transaction Leblanc
   Courriel envoyé à Me Tremblay (avocat) et Marie Dupont (client)

⚠️ URGENT — Condition bloquante en retard               il y a 5h
   Financement — Transaction Martin (-3 jours)
   Consultez votre courriel pour les détails

📨 Offre soumise — 325 000$                             hier
   Transaction Gagnon
   Courriel envoyé à Me Roy (avocat) et Paul Gagnon (vendeur)

📋 Récapitulatif envoyé                                 hier
   Transaction Dupont
   Envoyé à Me Tremblay, Marie Dupont, Banque Nationale
```

---

## 4. Logique des destinataires

### 4.1 Règles

```
Courtier = transaction.user (propriétaire)
Parties  = transaction.parties.where(email IS NOT NULL)
Langue   = transaction.user.language (FR par défaut)
```

### 4.2 Matrice destinataires

| Email | Courtier (email) | Courtier (cloche) | Parties (email) |
|---|---|---|---|
| MemberInvitationMail | — | ✅ confirmation | — (membre reçoit) |
| PartyAddedMail | — | ✅ confirmation | ✅ partie ajoutée |
| ShareLinkMail | — | ✅ confirmation | ✅ destinataire |
| OfferSubmittedMail | ✅ | ✅ | ✅ |
| OfferCounteredMail | ✅ | ✅ | ✅ |
| OfferRejectedMail | ✅ | ✅ | ✅ |
| OfferExpiredMail | ✅ | ✅ | ✅ |
| StepAdvancedMail | — (il clique) | ✅ confirmation | ✅ |
| ConditionResolvedMail | ✅ | ✅ | ✅ |
| BlockingConditionAlertMail | ✅ | ✅ URGENT | ✅ |
| ConditionAssignedMail | ✅ | ✅ | ✅ partie responsable |
| TransactionCancelledMail | ✅ | ✅ | ✅ toutes |
| TransactionRecapMail | ✅ copie | ✅ confirmation | ✅ sélection |

---

## 5. Architecture technique

### 5.1 Pattern d'envoi

Chaque trigger fait les deux actions atomiquement :

```typescript
// Exemple: StepAdvancedMail trigger
async function onStepAdvanced(transaction: Transaction, step: WorkflowStep) {
  const parties = await transaction.getPartiesWithEmail()
  const owner = await transaction.related('user').query().first()
  const lang = normalizeLanguage(owner?.language)
  const recipientNames: string[] = []

  // 1. Envoyer emails aux parties
  for (const party of parties) {
    await mail.sendLater(new StepAdvancedMail({
      to: party.email,
      partyName: party.fullName,
      stepName: step.name,
      transactionLabel: transaction.label,
      language: lang,
    }))
    recipientNames.push(`${party.fullName} (${party.role})`)
  }

  // 2. Créer notification cloche pour le courtier
  await Notification.create({
    userId: transaction.userId,
    transactionId: transaction.id,
    type: 'step_advanced',
    icon: '✅',
    severity: 'info',
    title: `Étape "${step.name}" complétée`,
    body: `Courriel envoyé à ${recipientNames.join(', ')}`,
    link: `/transactions/${transaction.id}`,
    emailRecipients: recipientNames,
  })
}
```

### 5.2 Service NotificationService

```typescript
// backend/app/services/notification_service.ts
class NotificationService {
  // Créer une notification
  async notify(opts: {
    userId: number
    transactionId?: number
    type: string
    icon: string
    severity: 'info' | 'warning' | 'urgent'
    title: string
    body?: string
    link?: string
    emailRecipients?: string[]
  }): Promise<Notification>

  // Compter non-lues
  async unreadCount(userId: number): Promise<number>

  // Lister (paginé)
  async list(userId: number, page: number, limit: number): Promise<Notification[]>

  // Marquer comme lue
  async markRead(notificationId: number, userId: number): Promise<void>

  // Tout marquer comme lu
  async markAllRead(userId: number): Promise<void>
}
```

### 5.3 Fichiers à créer/modifier

**Backend — Nouveaux fichiers :**
```
backend/database/migrations/XXXX_create_notifications_table.ts
backend/app/models/notification.ts
backend/app/controllers/notifications_controller.ts
backend/app/services/notification_service.ts
backend/app/mails/member_invitation_mail.ts
backend/app/mails/party_added_mail.ts
backend/app/mails/share_link_mail.ts
backend/app/mails/offer_submitted_mail.ts
backend/app/mails/offer_countered_mail.ts
backend/app/mails/offer_rejected_mail.ts
backend/app/mails/offer_expired_mail.ts
backend/app/mails/step_advanced_mail.ts
backend/app/mails/condition_resolved_mail.ts
backend/app/mails/blocking_condition_alert_mail.ts
backend/app/mails/condition_assigned_mail.ts
backend/app/mails/transaction_cancelled_mail.ts
backend/app/mails/transaction_recap_mail.ts
```

**Backend — Fichiers modifiés :**
```
backend/app/mails/partials/email_translations.ts  (13 nouvelles sections)
backend/start/routes.ts                            (4 routes notifications)
backend/app/services/automation_executor_service.ts (ajouter notifications aux triggers existants)
backend/app/services/reminder_service.ts           (ajouter notifications aux reminders existants)
```

**Frontend — Nouveaux fichiers :**
```
frontend/src/api/notifications.api.ts
frontend/src/components/NotificationBell.tsx
frontend/src/components/NotificationItem.tsx
```

**Frontend — Fichiers modifiés :**
```
frontend/src/components/Layout.tsx          (remplacer placeholder par NotificationBell)
frontend/src/i18n/locales/fr/common.json    (clés notifications)
frontend/src/i18n/locales/en/common.json    (clés notifications)
```

**Fichier à supprimer :**
```
backend/app/services/email_service.ts       (stub mort, remplacé par les classes mail)
```

---

## 6. Ordre d'implémentation

| Phase | Contenu | Dépendances |
|---|---|---|
| **Phase 1** | Migration notifications + Model + Service + Controller + Routes | Aucune |
| **Phase 2** | Composant NotificationBell + API frontend + Layout integration | Phase 1 |
| **Phase 3** | Batch 1 emails (Collab: 3) + traductions + notifications twin | Phase 1 |
| **Phase 4** | Batch 2 emails (Offres: 4) + traductions + notifications twin | Phase 1 |
| **Phase 5** | Batch 3 emails (Conditions: 4) + traductions + notifications twin | Phase 1 |
| **Phase 6** | Batch 4 emails (Transaction: 2) + traductions + notifications twin | Phase 1 |
| **Phase 7** | Rétrofit notifications sur les 10 emails existants (triggers automation + reminder) | Phase 2 |

---

## 7. Hors scope (Phase 2 future)

- WebSocket / temps réel (v1 = polling 60s)
- Préférences de notification granulaires (v1 = tout activé)
- Email digest configurable (v1 = quotidien fixe)
- Push notifications mobile
- MemberInvitationAcceptedMail, TransactionArchivedMail (nice-to-have)
