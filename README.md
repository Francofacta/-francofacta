# FrancoFacta

FrancoFacta est un SaaS en français pour les associés de TPE qui veulent suivre les dépenses d'un projet commun:
avances par membre, justificatifs, remboursements et budget consolidé.

## Stack

- Next.js App Router
- Supabase Auth, Postgres et Storage
- Stripe Checkout + abonnements mensuels
- Déploiement Vercel

## Fonctionnalités incluses

- Landing page en français avec hero, douleurs, fonctionnement en 4 étapes, bannière Perso, tarifs Starter/Pro/Sur mesure et CTA.
- Authentification Supabase email/mot de passe.
- Onboarding projet : nom, type, membres, parts, date de fin, budget, revenus, moyens de paiement, onglets et devise (€/$/£/CHF/CAD/MAD).
- Dashboard dépenses : KPI par associé, vue membre, modes de paiement, filtres, table détaillée, export Excel, modale d'ajout et téléversement de justificatif.
- Onglets Justificatifs, Solde & Équilibre, Coffre-fort, Revenus Pro et Rentabilité Pro.
- Routes API Stripe pour Checkout et webhooks d'abonnement.
- Schéma SQL Supabase avec RLS, revenus, coffre-fort et bucket `expense-receipts`.

## Démarrage local

```bash
npm install
cp .env.example .env.local
npm run dev
```

Ouvrez [http://localhost:3000](http://localhost:3000).

L'application fonctionne en mode démo si Supabase ou Stripe ne sont pas encore configurés. Les données d'onboarding sont
alors conservées dans `localStorage`.

## Configuration Supabase

1. Créez un projet Supabase.
2. Exécutez `supabase/schema.sql` dans l'éditeur SQL Supabase.
3. Copiez `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` et `SUPABASE_SERVICE_ROLE_KEY` dans Vercel.
4. Activez l'authentification email/password dans Supabase Auth.

## Configuration Stripe

1. Créez les produits/prix Stripe:
   - Perso: 29 EUR en paiement unique pour 12 mois d'accès
   - Starter: 19 EUR/mois
   - Pro: 39 EUR/mois
2. Copiez les price ids dans:
   - `STRIPE_PERSO_PRICE_ID`
   - `STRIPE_STARTER_PRICE_ID`
   - `STRIPE_PRO_PRICE_ID`
3. Ajoutez `STRIPE_SECRET_KEY`.
4. Créez un webhook vers `/api/stripe/webhook` et ajoutez `STRIPE_WEBHOOK_SECRET`.

Les routes protégées vérifient le plan actif dans Supabase avant onboarding et dashboard.

## Déploiement Vercel

1. Importez le dépôt dans Vercel.
2. Renseignez les variables de `.env.example`.
3. Déployez. Le fichier `vercel.json` cible le framework Next.js et la région Paris (`cdg1`).

## Scripts

```bash
npm run dev
npm run lint
npm run build
```
