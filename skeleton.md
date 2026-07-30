# Lykos — Squelette du monorepo

Carte des fichiers du projet. Chaque fichier référence sa fonctionnalité (Fx)
du roadmap.md. État : [x] fait / [ ] à faire.

Rappel : les fichiers se créent au moment où on les code, pas avant.
Le front est généré par Vite (`npm create vite@latest -- --template react`).

---

## Fichiers supprimés lors du pivot (films/séries -> livres)

Fait le 29 juillet 2026, avant de recoder quoi que ce soit. Conservé ici comme
trace du changement de périmètre, utile au dossier professionnel.

```
backend/src/routes/tmdb.routes.js
backend/src/routes/tracking.routes.js
backend/src/routes/episode.routes.js
backend/src/controllers/tmdb.controller.js
backend/src/controllers/tracking.controller.js
backend/src/controllers/episode.controller.js
backend/src/repositories/media_tracking.repository.js
backend/src/repositories/episode_progress.repository.js
backend/src/services/tmdb.service.js
shared/src/schemas/tracking.schema.js
shared/src/schemas/episode.schema.js
```

Nettoyages associés :
- `backend/src/routes/index.js` : retrait des imports et des `router.use(...)`
  des routes tmdb, tracking et episode. C'est bien ici que vit le branchement,
  pas dans `app.js` qui se contente d'importer cet agrégateur.
- `backend/src/config/env.js` : retrait des variables TMDB_*.
- `backend/.env` et `.env.example` : retrait de la clé et du token TMDB.
- `shared/src/index.js` : retrait des exports des deux schémas supprimés.

---

## Racine

```
lykos/
├── package.json          # workspaces npm (@lykos/shared, @lykos/backend, frontend)
├── roadmap.md            # découpage en fonctionnalités
└── skeleton.md           # ce fichier
```

---

## shared/ — schémas Zod partagés

```
shared/
├── package.json
└── src/
    ├── index.js                  # exports des schémas
    └── schemas/
        ├── auth.schema.js        # F1/F6 — registerSchema, loginSchema, reset
        └── book.schema.js        # F4 — createBookSchema, updateBookSchema,
                                  #      READING_STATUSES (source unique)
```

---

## backend/ — Node/Express/MySQL

Architecture : routes -> middlewares -> controllers -> repositories (SQL) / services (externe).
Aucun SQL dans un controller.

```
backend/
├── package.json
├── index.js                          # F0.1 — testConnection() puis app.listen()
├── app.js                            # F0.1 — config Express, monte routes/index.js
├── db/
│   └── schema.sql                    # F0.2 — les 5 tables
├── docs/
│   └── bug-dates.md                  # dysfonctionnement dateStrings mysql2
└── src/
    ├── config/
    │   ├── env.js                    # F0.1 — variables d'environnement
    │   ├── db.js                     # F0.1 — pool mysql2 + testConnection()
    │   └── jwt.js                    # F0.1/F1 — signature et vérification JWT
    ├── routes/
    │   ├── index.js                  # F0.1 — agrégateur, branche toutes les routes
    │   ├── auth.routes.js            # F1/F6 — register, login, forgot/reset-password
    │   ├── book.routes.js            # F4 — CRUD bibliothèque
    │   └── admin.routes.js           # F7 — supervision admin
    ├── middlewares/
    │   ├── auth.middleware.js        # F1 — vérifie le JWT
    │   └── role.middleware.js        # F2 — restreint aux admins
    ├── controllers/
    │   ├── auth.controller.js        # F1/F6
    │   ├── book.controller.js        # F4 — orchestre livre + auteur + saga
    │   └── admin.controller.js       # F7
    ├── repositories/                 # accès SQL (execute + placeholders)
    │   ├── user.repository.js        # F1/F7
    │   ├── book.repository.js        # F4 — CRUD book, jointures author/series
    │   ├── author.repository.js      # F4 — findByName, create
    │   ├── series.repository.js      # F4 — findByTitle, create
    │   └── password_reset.repository.js   # F6
    └── services/                     # appels externes
        └── mail.service.js           # F6 — Nodemailer
```

Convention de nommage des fichiers : snake_case pour les noms composés
(`password_reset.repository.js`), conforme aux noms de tables SQL.

---

## frontend/ — React (Vite) + Tailwind

Archi volontairement simple (défendable à l'oral) : 4 dossiers.
État global : AuthContext (token JWT, utilisateur, rôle), persistés tous les deux
en localStorage.
État local et appels API : useState + useEffect (pas de React Query).
Routes protégées : wrappers PrivateRoute et AdminRoute, miroirs des deux
middlewares backend. La vraie barrière reste côté serveur.
Validation des formulaires : schémas Zod partagés (@lykos/shared).

```
frontend/
├── package.json
├── vite.config.js
├── tailwind.config.js                # F8
├── index.html
└── src/
    ├── main.jsx                      # généré par Vite
    ├── App.jsx                       # F8 — React Router, toutes les routes déclarées
    ├── constants.js                  # F8 — clés de localStorage (token, utilisateur)
    ├── styles/
    │   └── index.css                 # F8 — directives Tailwind
    ├── context/
    │   └── AuthContext.jsx           # F8 — état global d'authentification
    ├── services/
    │   └── api.js                    # F8 — wrapper fetch (token JWT, JSON, erreurs)
    ├── components/
    │   ├── PrivateRoute.jsx          # F8 — protège les routes connectées
    │   ├── AdminRoute.jsx            # F8 — protège en plus par rôle admin
    │   ├── Layout.jsx                # F8/F10 — Sidebar + <Outlet />
    │   ├── AuthCard.jsx              # F9 — carte centrée partagée par les 4 pages auth
    │   ├── FormField.jsx             # F9 — label + input + message d'erreur
    │   ├── Sidebar.jsx               # F10 — collections : bibliothèque, wishlist,
    │   │                             #       administration si admin (w-64, 256px)
    │   ├── BookCard.jsx              # F10 — couverture 2/3 + repli, titre, auteur
    │   ├── StatusSelector.jsx        # F10 — pills de statut de lecture
    │   │                             #       (Tous + les 4 de READING_STATUSES)
    │   └── Toast.jsx                 # F11 — notification de succès
    └── pages/
        ├── Landing.jsx               # F15 — page publique SEO
        ├── Login.jsx                 # F9
        ├── Register.jsx              # F9
        ├── ForgotPassword.jsx        # F9
        ├── ResetPassword.jsx         # F9 — token en query string (useSearchParams)
        ├── Library.jsx               # F10 — livres possédés, filtrés par statut
        ├── Wishlist.jsx              # F10 — livres souhaités non possédés, sans pills
        ├── BookForm.jsx              # F11 — création ET édition
        ├── BookDetail.jsx            # F12 — fiche livre complète
        └── AdminDashboard.jsx        # F14 — compteur + liste utilisateurs
```

Navigation : la sidebar porte les collections, les pills portent les statuts de
lecture à l'intérieur d'une collection. Un livre abandonné reste dans la
bibliothèque, c'est un état et pas un rangement (voir roadmap.md, F10).

---

## État d'avancement

### Backend
- [x] F0.1 — Serveur + connexion base
- [x] F0.2 — Schéma SQL (5 tables, refait après le pivot)
- [x] F1 — Authentification (register, login)
- [x] F2 — Middleware de rôle
- [x] F6 — Réinitialisation mot de passe
- [x] F7 — Espace admin
- [x] F4 — Bibliothèque (CRUD livres)

Tout est testé, F4 validé sur serveur réel avec deux utilisateurs (isolation,
réutilisation d'auteur, series_id repassé à NULL).

F3 (service TMDB) et F5 (suivi épisodique) supprimées lors du pivot.

### Frontend
- [x] F8 — Setup (Tailwind, router, AuthContext, api.js, PrivateRoute, AdminRoute)
- [x] F9 — Pages auth (Login, Register, Forgot, Reset) — code fait, recette
      navigateur non faite
- [ ] F10 — Bibliothèque et Wishlist — Library, Wishlist, BookCard,
      StatusSelector faits ; Sidebar.jsx reste à écrire. Recette navigateur non
      faite
- [ ] F11 — Formulaire livre (création et édition)
- [ ] F12 — Détail livre
- [ ] F14 — Dashboard admin
- [ ] F15 — Landing page

F13 (détail série) supprimée lors du pivot.

### Reste à faire hors fonctionnalités
- [ ] Recette navigateur de F9 et F10 (aucun rendu vérifié à ce jour)
- [ ] Tests unitaires : book.repository.js et la résolution auteur/saga du
      controller (Vitest, pas de configuration nécessaire avec les modules ES)
- [ ] Relecture ligne par ligne et nettoyage des commentaires, avant les slides
      puisque le code y sera capturé en image
- [ ] Slides et dossier professionnel
- [ ] Mise en production (hébergement non choisi)