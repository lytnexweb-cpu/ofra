# FINTRAC Module — Spécification technique

**Date** : 12 février 2026
**Statut** : Validé par l'équipe (Party Mode)
**Priorité** : Prochaine itération

---

## 1. Contexte

FINTRAC (Centre d'analyse des opérations et déclarations financières du Canada) oblige tout courtier immobilier à :
- Vérifier l'identité de chaque client avec qui il a une relation d'affaires
- Collecter et conserver : type d'ID, numéro, date de naissance, occupation, source des fonds
- Maintenir un dossier de conformité traçable par transaction

### État actuel dans le code
- ✅ Email de rappel (`fintrac_reminder_mail.ts`)
- ✅ Automation `create_task` à l'étape `firm-pending`
- ✅ Catégorie document `identity` existante
- ✅ Système de conditions avec blocking/required/recommended
- ✅ Evidence system (file/link/note)
- ✅ ConditionEvent audit trail
- ❌ Aucun formulaire de collecte de données identité
- ❌ Aucun tracking de conformité par transaction
- ❌ Aucun modèle dédié pour les données FINTRAC

---

## 2. Décisions validées

### D-FINTRAC-01 : Étape déclencheur
- **Étape** : `firm-pending` (slug exact, étape 5)
- **Raison** : Moment légal où la conformité doit être complétée avant de continuer vers pre-closing

### D-FINTRAC-02 : Niveau de blocage
- **Niveau** : `blocking`
- **Raison** : Obligation légale. L'étape `firm-pending` ne peut pas avancer vers `pre-closing` sans FINTRAC résolu.
- **Escape interdit** : Pas de "skip with risk" possible sur les conditions FINTRAC

### D-FINTRAC-03 : 1 condition par personne concernée
- **Règle** : 1 condition FINTRAC par buyer (si `transaction.type === 'purchase'`) ou par seller (si `transaction.type === 'sale'`)
- **Raison** : Traçabilité individuelle. L'agent voit clairement "Jean ✅, Marie 🔴"
- **Late party** : Si un buyer/seller est ajouté après `firm-pending`, auto-création d'une condition FINTRAC
- **Party retiré** : Auto-archive de la condition FINTRAC associée

### D-FINTRAC-04 : Modèle dédié FintracRecord
- **Table** : `fintrac_records`
- **Contrainte** : `unique(transaction_id, party_id)`
- **Raison** : Sépare les données de conformité du modèle Party (pas de pollution). Permet l'évolution future (beneficial owners, méthodes de vérification)

### D-FINTRAC-05 : Preuve obligatoire
- **Règle** : La condition FINTRAC ne peut être résolue sans minimum 1 document `identity` lié comme evidence
- **Raison** : Empêche le courtier de cocher "fait" sans preuve réelle

### D-FINTRAC-06 : Override autoConditionsEnabled
- **Règle** : FINTRAC est TOUJOURS créé, même si `autoConditionsEnabled === false`
- **Raison** : Conformité légale ≠ packs optionnels. Un courtier ne peut pas désactiver la loi.

### D-FINTRAC-07 : UX hybride
- **Données** vivent sur `FintracRecord` (par transaction + party)
- **Action** vit dans la Transaction (condition blocking dans le flow)
- **CTA** : "Compléter FINTRAC" sur la condition → ouvre modale dédiée
- **Modale** : Formulaire identité + upload document identity + auto-resolve condition

---

## 3. Modèle de données

### FintracRecord (nouvelle table)

```
fintrac_records
├── id                    : number (PK)
├── transaction_id        : number (FK → transactions)
├── party_id              : number (FK → transaction_parties)
├── date_of_birth         : date | null
├── id_type               : enum('drivers_license', 'canadian_passport', 'foreign_passport', 'citizenship_card', 'other_government_id') | null
├── id_number             : string | null
├── occupation            : string | null
├── source_of_funds       : string | null
├── verified_at           : datetime | null
├── verified_by_user_id   : number (FK → users) | null
├── notes                 : text | null
├── created_at            : datetime
├── updated_at            : datetime
└── UNIQUE(transaction_id, party_id)
```

### Relations
- `FintracRecord` belongsTo `Transaction`
- `FintracRecord` belongsTo `TransactionParty`
- `FintracRecord` belongsTo `User` (verifiedBy)
- `Transaction` hasMany `FintracRecord`
- `TransactionParty` hasOne `FintracRecord` (per transaction)

---

## 4. FintracService (nouveau service)

```typescript
class FintracService {
  // Appelé quand une transaction entre dans firm-pending
  async onStepEnter(transaction, step): Promise<void>
    // Si step.slug !== 'firm-pending' → return
    // Déterminer le rôle cible : transaction.type === 'purchase' ? 'buyer' : 'seller'
    // Récupérer toutes les parties avec ce rôle
    // Pour chaque party → créer condition FINTRAC blocking + FintracRecord vide
    // Ignorer autoConditionsEnabled (override conformité)

  // Appelé quand un party est ajouté
  async onPartyAdded(transaction, party): Promise<void>
    // Vérifier si transaction est à firm-pending ou plus loin
    // Vérifier si le rôle du party correspond au type de transaction
    // Si oui → créer condition FINTRAC blocking + FintracRecord vide

  // Appelé quand un party est retiré
  async onPartyRemoved(transaction, party): Promise<void>
    // Archiver la condition FINTRAC associée
    // Soft-delete le FintracRecord

  // Vérifie la conformité complète
  async isCompliant(transaction): Promise<boolean>
    // Toutes les conditions FINTRAC sont résolues
    // Chaque FintracRecord a verified_at non null

  // Complète un enregistrement FINTRAC
  async complete(fintracRecordId, data, userId): Promise<FintracRecord>
    // Met à jour les champs identité
    // Set verified_at + verified_by_user_id
    // Auto-resolve la condition FINTRAC associée (si evidence présente)
}
```

---

## 5. Flow UX

```
Transaction à l'étape firm-pending
  │
  ├─ Auto-création conditions FINTRAC (1 par buyer/seller)
  │   └─ Condition : "FINTRAC — [Nom du party]"
  │       ├─ level: blocking
  │       ├─ sourceType: legal
  │       └─ step: firm-pending
  │
  └─ L'agent voit dans sa page Transaction Detail :
      │
      ├─ ActionZone : "🔴 1 condition bloquante — FINTRAC"
      │
      └─ ConditionCard : "FINTRAC — Jean Dupont"
          └─ CTA : "Compléter FINTRAC"
              │
              └─ FintracComplianceModal
                  ├─ Champs identité pré-remplis (si déjà complété avant)
                  │   ├─ Type d'ID (dropdown)
                  │   ├─ Numéro d'ID
                  │   ├─ Date de naissance
                  │   ├─ Occupation
                  │   └─ Source des fonds
                  ├─ Upload document identity (obligatoire)
                  └─ Bouton "Compléter"
                      ├─ PATCH /api/fintrac-records/:id  → sauvegarde données
                      ├─ POST /api/.../documents          → upload doc identity
                      ├─ POST /api/.../evidence            → lie doc comme preuve
                      └─ Auto-resolve condition FINTRAC
```

---

## 6. Plan d'implémentation

### Étape 1 : Backend — Migration + Modèle FintracRecord
- Migration : créer table `fintrac_records` avec tous les champs
- Modèle : `backend/app/models/fintrac_record.ts`
- Validator : `backend/app/validators/fintrac_validator.ts`
- Relations sur Transaction et TransactionParty

### Étape 2 : Backend — FintracService
- Service : `backend/app/services/fintrac_service.ts`
- Méthodes : onStepEnter, onPartyAdded, onPartyRemoved, isCompliant, complete
- Hooks dans WorkflowEngineService (advanceStep → appeler onStepEnter)
- Hooks dans TransactionPartiesController (store/destroy → appeler onPartyAdded/onPartyRemoved)

### Étape 3 : Backend — Controller + Routes
- Controller : `backend/app/controllers/fintrac_controller.ts`
- Routes : GET/PATCH `/api/transactions/:id/fintrac` (list + complete)
- Empêcher escape sur conditions FINTRAC (dans conditions_controller resolve)

### Étape 4 : Frontend — FintracComplianceModal
- Composant : `frontend/src/components/transaction/FintracComplianceModal.tsx`
- Formulaire identité + upload document + auto-resolve
- Pré-remplissage si FintracRecord existe déjà
- API : `frontend/src/api/fintrac.api.ts`

### Étape 5 : Frontend — Câblage ConditionCard
- Détecter condition FINTRAC (via sourceType `legal` + titre pattern ou flag dédié)
- CTA spécial "Compléter FINTRAC" → ouvre FintracComplianceModal
- Badge visuel distinct sur la condition FINTRAC

### Étape 6 : PDF Export + i18n
- Section "Conformité FINTRAC" dans pdf_export_service.ts
- Checkbox dans ExportSharePage
- Clés i18n FR/EN (formulaire, conditions, modale, PDF, erreurs)

---

## 7. Types d'ID acceptés (NB)

| Clé | FR | EN |
|-----|----|----|
| `drivers_license` | Permis de conduire | Driver's License |
| `canadian_passport` | Passeport canadien | Canadian Passport |
| `foreign_passport` | Passeport étranger | Foreign Passport |
| `citizenship_card` | Carte de citoyenneté / résident permanent | Citizenship / PR Card |
| `other_government_id` | Autre pièce d'identité gouvernementale avec photo | Other Government Photo ID |

---

## 8. Cas limites

| Cas | Comportement |
|-----|-------------|
| 0 buyers/sellers au moment de firm-pending | Aucune condition FINTRAC créée. Dès qu'un party est ajouté → auto-création |
| Buyer ajouté après firm-pending | Auto-création condition FINTRAC blocking |
| Buyer retiré après firm-pending | Condition FINTRAC archivée + FintracRecord soft-deleted |
| autoConditionsEnabled = false | FINTRAC créé quand même (override conformité) |
| Même personne sur 2 transactions | 2 FintracRecords distincts (1 par transaction) — données peuvent être copiées |
| Agent tente d'escape la condition FINTRAC | Interdit — pas de skip_with_risk sur level=blocking + sourceType=legal |

---

## 9. Évolution FINTRAC — Roadmap post-V1

> Ce qui suit n'est PAS dans le scope V1. C'est la vision idéale pour les versions futures.
> L'architecture V1 (modèle `FintracRecord` dédié) est conçue pour supporter ces évolutions sans refactoring.

### V1.5 — Conformité renforcée

| Feature | Détail | Effort estimé |
|---------|--------|---------------|
| Double vérification d'identité | 2 pièces d'identité requises (la loi FINTRAC exige parfois 2 méthodes de vérification). Ajout `secondIdType`, `secondIdNumber` sur FintracRecord | Petit (migration + UI) |
| Formulaire officiel CanCEFI | Génération du formulaire FINTRAC officiel (59.01) en PDF pré-rempli à partir des données FintracRecord | Moyen (template PDF) |
| Méthodes de vérification | Tracking de la méthode utilisée : en personne, agent de confiance, double processus. Champ `verificationMethod` sur FintracRecord | Petit (migration + dropdown) |
| Beneficial owners | Pour les achats via corporation/fiducie : identifier et vérifier les propriétaires bénéficiaires (>25% contrôle). Nouveau modèle ou extension FintracRecord | Moyen |

### V2 — Gestion du cycle de vie

| Feature | Détail | Effort estimé |
|---------|--------|---------------|
| Rétention 5 ans | Tracking de la date de rétention obligatoire (5 ans après fin de relation d'affaires). Alertes avant expiration. Champ `retentionExpiresAt` | Petit (migration + cron job) |
| Expiration des pièces d'identité | Suivi de la date d'expiration de chaque pièce d'identité. Alerte quand un ID expire pendant une transaction active | Petit (champ `idExpiryDate`) |
| Copie automatique entre transactions | Si un client revient pour une 2e transaction, pré-remplir automatiquement depuis le FintracRecord le plus récent + demander confirmation que les infos sont toujours valides | Moyen (lookup + UI confirmation) |
| Rapport de conformité global | Dashboard admin : liste de tous les FintracRecords par statut (complété, incomplet, expiré). Export CSV pour audits | Moyen (admin page + API) |

### V3 — Conformité avancée

| Feature | Détail | Effort estimé |
|---------|--------|---------------|
| Déclaration de transaction suspecte | Formulaire intégré pour signaler une transaction suspecte à FINTRAC (STR — Suspicious Transaction Report) | Grand (réglementation complexe) |
| Intégration API FINTRAC | Soumission électronique directe à FINTRAC (si/quand l'API est disponible) | Grand (dépend de FINTRAC) |
| Audit trail certifié | Horodatage cryptographique des vérifications pour preuve légale | Moyen |
| Multi-province | Adapter les exigences FINTRAC par province (variations mineures) | Petit (config par province) |

### Pourquoi c'est un avantage compétitif durable

- Les outils américains (Dotloop, SkySlope, Open To Close) n'ont **aucune raison** de construire FINTRAC — la réglementation n'existe pas aux USA
- Chaque niveau d'évolution creuse le fossé concurrentiel
- La conformité FINTRAC est **obligatoire et permanente** — ce n'est pas une mode qui passe
- Un courtier qui a ses 5 ans de records dans Ofra ne changera pas d'outil facilement (rétention = lock-in naturel)
