# TODO — Refactor TransactionHeader (Desktop)

## Problèmes identifiés par Sam
1. **Cloche (notification icon)** — visible mais ne sert à rien, à retirer ou câbler
2. **Accès aux Permissions** — trop caché dans le menu `⋮`, besoin d'un raccourci plus visible
3. **Clarté générale** — le header desktop n'est pas clair, les actions importantes (Edit, Export, Permissions) doivent être plus accessibles

## Contexte
- Fichier : `frontend/src/components/transaction/TransactionHeader.tsx`
- Points d'entrée actuels vers les pages :
  - Edit → `navigate('/transactions/:id/edit')` ✅ visible
  - Export → `navigate('/transactions/:id/export')` ✅ dans menu
  - Permissions → `navigate('/transactions/:id/access')` ❌ caché dans menu `⋮`
- La maquette 07 (Actions Transaction) définit le menu dropdown

## Proposition à discuter
- Boutons icônes directs dans le header desktop (Edit, Permissions, Export)
- Retirer ou implémenter la cloche
- Menu `⋮` garde les actions moins fréquentes (Annuler, Archiver, Supprimer)

## Priorité : POST-MAQUETTES (à traiter après M12/M13)
