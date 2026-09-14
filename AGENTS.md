<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Locagest — guide de contribution

Application Next.js 16 (App Router) de gestion locative immobilière, adossée à Supabase.
Stack : React 19, TypeScript strict, Tailwind 4, shadcn/ui, Recharts.

## Règle n°1 : séparer le fonctionnel du visuel

Trois couches, dans cet ordre de dépendance. **Une couche ne remonte jamais vers celle du dessus.**

```
lib/        accès aux données + logique métier pure   (aucun JSX, aucun hook React)
  ↓
hooks/      orchestration : état, effets, appels lib/ (aucun JSX)
  ↓
app/ + components/   rendu uniquement                 (aucun appel Supabase)
```

**Une `page.tsx` ne contient que du JSX et un appel de hook.** Si tu y écris `supabase.from(...)`,
`useState` pour des données serveur, ou un calcul métier, c'est au mauvais endroit.

Référence à imiter : [`app/bien/[id]/bail/page.tsx`](app/bien/[id]/bail/page.tsx) (47 lignes, purement
visuel) → [`hooks/useLeaseDocument.ts`](hooks/useLeaseDocument.ts) (état + effets) →
[`lib/properties.ts`](lib/properties.ts), [`lib/documents.ts`](lib/documents.ts) (requêtes).

### Où mettre quoi

| Tu écris… | Emplacement |
|---|---|
| une requête Supabase | `lib/<table>.ts` — une fonction par intention (`fetchX`, `createX`, `updateX`) |
| un calcul sans I/O (formatage, rentabilité, dates) | `lib/<domaine>.ts`, fonction pure et testable |
| `useState` / `useEffect` pour un écran | `hooks/use<Écran>.ts` |
| du JSX réutilisé par plusieurs écrans | `components/<domaine>/` |
| une primitive shadcn/ui | `components/ui/` — ne pas la modifier à la main |

Ne crée pas de couche données propre à une route (`_api/`, `_queries/`). Tout passe par `lib/`,
sinon les types et les requêtes se dupliquent — c'est déjà arrivé et il a fallu refusionner.

## Règle n°2 : ne jamais avaler une erreur

C'est le piège principal de ce projet : avec Supabase, un refus RLS ressemble à un résultat vide.
`lib/errors.ts` existe pour rendre les deux cas distinguables.

```ts
// ✗ interdit — un refus RLS s'affiche comme « aucun bien »
const { data, error } = await supabase.from("properties").select();
if (error || !data) return [];

// ✓ attendu
const result = await supabase.from("properties").select("*, rentals(*)");
return (unwrap(result, "Impossible de charger les biens") as Property[] | null) ?? [];
```

- **Lecture** : `unwrap(result, contexte)`.
- **Lecture `.single()`** où « aucune ligne » est légitime : `unwrapMaybe(...)` → renvoie `null`.
- **Écriture** : `assertWritten(result, contexte)`. Une mutation ne renvoie jamais son résultat brut
  à l'appelant, elle lève.
- **Dans un hook** : `try/catch` + `setError(toErrorMessage(err, "…"))`. Exposer `error` pour un échec
  de chargement, `actionError` pour un échec de mutation (cf. [`hooks/usePropertyDetail.ts`](hooks/usePropertyDetail.ts)).
- **Dans une page** : afficher via `<ErrorNotice message={…} />`.

En cas d'échec d'écriture, **laisser la modale ouverte** : la saisie de l'utilisateur ne doit pas être perdue.

## Règle n°3 : un seul jeu de types

[`lib/types.ts`](lib/types.ts) est la source unique pour `Property`, `Rental`, `OwnerProfile`,
`DocumentRecord`. Ne redéclare pas ces entités ailleurs, ne les élargis pas « par sécurité ».

- Interdiction du `any`, y compris `useState<any>`.
- Type d'après le **schéma**, pas d'après l'usage : si une colonne est nullable en base, écris
  `number | null` — ne mets pas `number | string` parce qu'un vieux `parseFloat` traîne quelque part.
- Les colonnes nullables actuelles à connaître : `base_rent_price` et `service_charges` sont `null`
  tant que le loyer n'a pas été saisi (la création d'un bien ne le demande pas).

Cible à terme : générer ces types (`supabase gen types typescript`) et typer le client.

## Next.js 16

Lis `node_modules/next/dist/docs/` avant d'écrire du code framework — cette version diffère de ce que
tu connais probablement (voir le bloc en haut de ce fichier).

- App Router uniquement. Les pages sont pour l'instant **toutes** des Client Components (`"use client"`),
  parce que l'accès Supabase se fait côté navigateur avec la clé anon. Ne convertis pas une page en
  Server Component sans traiter d'abord l'authentification (voir « Dette connue »).
- Les Route Handlers vont dans `app/api/<nom>/route.ts` — réservés aux appels serveur-à-serveur
  (exemple : [`app/api/irl/route.ts`](app/api/irl/route.ts), qui interroge l'INSEE).
- Colocation : un dossier préfixé `_` est exclu du routage. À n'utiliser que pour du visuel propre à
  une route, jamais pour de l'accès aux données.
- Variables d'environnement : `NEXT_PUBLIC_SUPABASE_URL` et `NEXT_PUBLIC_SUPABASE_ANON_KEY` dans
  `.env.local` (non versionné). Elles sont lues au démarrage : redémarrer `next dev` après modification.

## Conventions d'écriture

- Guillemets doubles, point-virgule final, imports triés par chemin.
- Commentaires et libellés d'interface **en français**. Un commentaire explique le *pourquoi*,
  jamais le *quoi*.
- Nommage : `fetchX` / `createX` / `updateX` / `deleteX` dans `lib/`, `use<Écran>` dans `hooks/`,
  `handleX` pour un gestionnaire d'événement, `onX` pour une prop.
- Pas de `console.log` laissé dans le code livré.

## Avant de livrer

```bash
npm run typecheck   # tsc --noEmit — doit être vert
npm run lint
npm run build
npm run check       # les trois d'affilée
```

`npm run typecheck` est non négociable : `next dev` ne typecheck pas, un `ReferenceError` peut donc
vivre en dev et ne casser qu'au build. C'est déjà arrivé sur le tableau de bord.

## Dette connue — ne pas l'aggraver

1. **Aucune authentification.** Il n'existe ni login, ni colonne `owner_id` sur `properties` /
   `rentals`. Les policies RLS ne peuvent donc pas isoler les données par utilisateur, et la clé anon
   est publique par construction. C'est le chantier bloquant pour toute mise en production.
   N'ajoute pas de table sans prévoir sa colonne de propriétaire.
2. **8 erreurs ESLint `react-hooks/set-state-in-effect`** préexistantes (hooks et providers). Le motif
   fautif : une fonction de chargement définie dans le corps du hook puis appelée dans l'effet.
   Le correctif est de déclarer la logique *dans* l'effet, avec un drapeau d'annulation —
   [`hooks/useLeaseDocument.ts`](hooks/useLeaseDocument.ts) montre la forme attendue. N'en ajoute pas de nouvelles.
3. **Deux lockfiles versionnés** (`package-lock.json` et `yarn.lock`). Utilise **npm**, et ne commite
   pas de churn de lockfile sans rapport avec ton changement.
