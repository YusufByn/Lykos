# Lykos — Roadmap de développement

Découpage du projet en fonctionnalités autonomes, à coder une par une.
Backend d'abord en entier, puis le frontend.

Chaque fonctionnalité indique : son objectif, ses dépendances (ce qui doit
être fait avant), les fichiers concernés, les détails d'implémentation, et
les critères de validation (comment savoir que c'est terminé).

Conventions du projet : voir le skill Lykos (code simple et explicable,
commenté en français, sans emoji, requêtes préparées avec execute(),
validation Zod partagée, sécurité non négociable).

Architecture backend : routes -> middlewares -> controllers ->
repositories (accès à notre base) / services (appels externes).
Les controllers ne contiennent jamais de SQL : ils passent par les repositories.

**Note sur la numérotation :** le projet a d'abord été conçu autour de l'API TMDB
(suivi de films et séries) avant d'être recentré sur un suivi de lecture sans
dépendance externe. Les fonctionnalités F3 (service TMDB) et F5 (suivi épisodique)
ont été supprimées à cette occasion, et F13 côté frontend. La numérotation
d'origine est conservée pour rester cohérente avec l'historique Git.

---

## PHASE 0 — Fondations

### F0.1 — Lancement du serveur et connexion à la base

**Objectif :** démarrer le serveur Express et confirmer la connexion MySQL.

**Dépendances :** aucune (première étape).

**Fichiers concernés :**
- backend/src/config/env.js
- backend/src/config/db.js
- backend/src/config/jwt.js
- backend/app.js
- backend/index.js
- backend/.env (local, non versionné)

**Détails :**
- env.js lit et structure les variables d'environnement.
- db.js crée le pool mysql2 et expose testConnection().
- app.js configure Express (express.json, cors) sans démarrer.
- index.js appelle testConnection() puis app.listen().

**Critères de validation :**
- npm run dev:backend démarre sans erreur.
- Le message de connexion à la base s'affiche dans la console.
- Le serveur écoute sur le port défini dans le .env.

---

### F0.2 — Schéma de la base de données

**Objectif :** créer les 5 tables dans MySQL.

**Dépendances :** F0.1 (connexion fonctionnelle).

**Fichiers concernés :**
- backend/db/schema.sql (script de création des tables)

**Détails — les 5 tables :**
- user (id, email UNIQUE, password_hash, role, created_at, updated_at)
- password_reset (id, user_id -> user.id, token, expires_at, used_at, created_at)
- author (id, first_name, last_name)
- book_series (id, title, total_volumes)
- book (id, user_id -> user.id, author_id -> author.id,
  series_id -> book_series.id (nullable), title, publication_year, publisher,
  page_count, isbn, cover_url, summary, volume_number, reading_status, rating,
  comment, wishlisted_at, acquired_at, started_reading_at, finished_reading_at,
  created_at, updated_at)

**Contraintes d'intégrité :**
- email unique sur user, token unique sur password_reset.
- reading_status en ENUM ('to_read', 'reading', 'read', 'abandoned').
- CHECK sur rating (entre 1 et 5, ou NULL).
- Clés étrangères différenciées : CASCADE sur book.user_id (supprimer un compte
  supprime ses livres), RESTRICT sur book.author_id (pas d'auteur orphelin),
  SET NULL sur book.series_id (supprimer une saga laisse les livres en one-shots).
- Index composite (user_id, reading_status) sur book : c'est la requête la plus
  fréquente de l'application.

**Critères de validation :**
- Le script s'exécute sans erreur dans phpMyAdmin.
- Les 5 tables apparaissent avec leurs colonnes et contraintes.
- L'ordre de création respecte les dépendances (les tables référencées d'abord).

---

## PHASE 1 — Backend

### F1 — Authentification (register, login)

**Objectif :** permettre l'inscription et la connexion avec JWT.

**Dépendances :** F0.1, F0.2.

**Fichiers concernés :**
- shared/src/schemas/auth.schema.js (registerSchema, loginSchema)
- backend/src/repositories/user.repository.js (requêtes SQL sur la table user)
- backend/src/controllers/auth.controller.js
- backend/src/routes/auth.routes.js
- backend/src/middlewares/auth.middleware.js
- backend/src/config/jwt.js
- backend/app.js (brancher les routes auth)

**Détails :**
- user.repository.js : fonctions d'accès à la table user (findUserByEmail,
  createUser, findUserById...), en pool.execute() avec placeholders.
- register : valider avec registerSchema, vérifier via le repository que
  l'email n'existe pas, hasher le mot de passe avec bcrypt, créer l'utilisateur
  via le repository (role "user" par défaut), renvoyer un token JWT.
- login : valider avec loginSchema, récupérer l'utilisateur via le repository,
  comparer le mot de passe avec bcrypt.compare, renvoyer un token JWT.
- auth.middleware.js : lire le header Authorization, vérifier le JWT,
  attacher l'utilisateur décodé à la requête.
- Le controller n'écrit aucun SQL : il passe par le repository.

**Critères de validation :**
- POST /api/auth/register crée un utilisateur et renvoie un token.
- Un email déjà utilisé est refusé proprement.
- POST /api/auth/login renvoie un token pour de bons identifiants,
  une erreur pour de mauvais.
- Le mot de passe est stocké hashé, jamais en clair.
- Une route de test protégée par le middleware refuse sans token valide.
- Le SQL est isolé dans user.repository.js, pas dans le controller.

---

### F2 — Middleware de rôle (user / admin)

**Objectif :** restreindre certaines routes aux administrateurs.

**Dépendances :** F1.

**Fichiers concernés :**
- backend/src/middlewares/role.middleware.js
- backend/app.js (si besoin)

**Détails :**
- role.middleware.js vérifie que l'utilisateur authentifié a le rôle "admin".
- S'applique après auth.middleware.js sur les routes admin.
- Renvoie une erreur d'autorisation claire si le rôle ne correspond pas.

**Critères de validation :**
- Une route protégée par le middleware admin refuse un utilisateur "user".
- Elle accepte un utilisateur "admin".

---

### F3 — SUPPRIMÉE (service TMDB)

Fonctionnalité abandonnée lors du recentrage sur le suivi de lecture.
L'application ne dépend plus d'aucune API externe : toutes les données livre
sont saisies par l'utilisateur. Bénéfice pour la soutenance : la démonstration
fonctionne hors ligne, sans risque de quota, de coupure réseau ou d'API
indisponible le jour J.

---

### F4 — Bibliothèque (CRUD des livres)

**Objectif :** gérer la bibliothèque personnelle : ajout, consultation,
modification, suppression d'un livre, avec son statut de lecture, sa note,
son commentaire et ses dates de suivi.

**Dépendances :** F1.

**Fichiers concernés :**
- shared/src/schemas/book.schema.js (createBookSchema, updateBookSchema)
- backend/src/repositories/book.repository.js (requêtes SQL sur book)
- backend/src/repositories/author.repository.js (requêtes SQL sur author)
- backend/src/repositories/series.repository.js (requêtes SQL sur book_series)
- backend/src/controllers/book.controller.js
- backend/src/routes/book.routes.js
- backend/app.js (brancher les routes)

**Détails — endpoints :**
- GET /api/books : liste des livres de l'utilisateur connecté, avec filtres
  optionnels en query string (status, owned, wishlisted, series).
- GET /api/books/:id : détail d'un livre.
- POST /api/books : créer un livre.
- PATCH /api/books/:id : modifier un livre (statut, note, commentaire, dates,
  ou n'importe quel champ descriptif).
- DELETE /api/books/:id : supprimer un livre.

**Points d'implémentation :**
- book.repository.js : toutes les requêtes SQL sur book (findByUser, findById,
  create, update, remove), en execute() avec placeholders. Les requêtes de
  lecture font une jointure sur author et book_series pour renvoyer directement
  le nom de l'auteur et le titre de la saga, sans obliger le front à enchaîner
  les appels. La réponse est un tableau plat : author_first_name et
  author_last_name, pas un objet auteur imbriqué. Une seule requête, aucune
  couche de transformation.
- Le user_id de l'utilisateur connecté va dans le WHERE de la requête SQL, pas
  dans un test JavaScript après coup. C'est ce qui garantit qu'un utilisateur ne
  peut ni lire ni modifier le livre d'un autre.
- Création implicite de l'auteur et de la saga : le front envoie un nom d'auteur
  en texte. Le controller cherche l'auteur en base, le crée s'il n'existe pas, et
  utilise son id. Même logique pour la saga, sauf que series_id reste NULL si
  aucun titre de saga n'est fourni. Cet enchaînement vit dans le controller, pas
  dans le repository.
- reading_status parmi 4 valeurs : to_read, reading, read, abandoned. Le schéma
  Zod partagé applique .default("to_read") à la création.
- Les quatre dates (wishlisted_at, acquired_at, started_reading_at,
  finished_reading_at) sont indépendantes du statut. Une date NULL signifie que
  l'événement n'a pas eu lieu.
- Optionnel si le temps le permet : GET /api/authors?search= pour alimenter une
  autocomplétion sur le champ auteur du formulaire, et éviter les doublons de
  saisie ("Pierce Brown" / "pierce brown").

**Critères de validation :**
- Un utilisateur ne voit et ne modifie que ses propres livres.
- Les 4 statuts fonctionnent.
- Ajouter un livre d'un auteur déjà connu réutilise la ligne author existante,
  n'en crée pas une deuxième.
- Ajouter un livre sans saga laisse bien series_id à NULL.
- La liste renvoie le nom de l'auteur et le titre de la saga, pas seulement
  leurs identifiants.
- Le SQL est isolé dans les repositories, pas dans le controller.

---

### F5 — SUPPRIMÉE (suivi épisodique)

Fonctionnalité abandonnée avec le passage aux livres : il n'existe pas
d'équivalent au découpage saison / épisode. La hiérarchie saga -> tome la
remplace, portée par la table book_series et le champ volume_number.

---

### F6 — Réinitialisation du mot de passe (Nodemailer + password_reset)

**Objectif :** permettre à un utilisateur de réinitialiser son mot de passe
par email, de façon autonome.

**Dépendances :** F1.

**Fichiers concernés :**
- backend/src/services/mail.service.js (service externe : envoi d'emails)
- backend/src/repositories/password_reset.repository.js (requêtes SQL)
- backend/src/controllers/auth.controller.js (ajout des méthodes)
- backend/src/routes/auth.routes.js (ajout des routes)
- shared/src/schemas/auth.schema.js (schéma de reset)
- backend/src/config/env.js (variables MAIL_*)

**Détails — endpoints :**
- POST /api/auth/forgot-password : génère un token unique, enregistre son hash
  via le repository dans password_reset avec une expiration (ex. 1h), envoie un
  email contenant le token en clair via mail.service.
- POST /api/auth/reset-password : vérifie le token (non expiré via expires_at,
  non utilisé via used_at), met à jour le mot de passe hashé, marque le token
  comme utilisé (used_at = date du jour).

**Points d'implémentation :**
- password_reset.repository.js : requêtes SQL sur password_reset
  (createToken, findValidToken, markAsUsed...), en execute() avec placeholders.
- mail.service.js configure Nodemailer avec les variables MAIL_* (service externe).
- Le lien envoyé par email met le token en query string
  (`${FRONTEND_URL}/reset-password?token=...`). Le front s'aligne sur cette
  forme, pas l'inverse : le backend est testé et validé.
- En développement, utiliser un service de test (ex. Mailtrap) pour capturer
  les emails sans les envoyer réellement.
- Token à usage unique et avec expiration : les deux vérifiés avant acceptation.
- Hash du token en SHA-256 et non bcrypt : le token est déjà un secret aléatoire
  de 256 bits généré par randomBytes, pas un mot de passe choisi par un humain.
  Un hash rapide suffit à empêcher qu'un vol de la base donne des tokens
  exploitables.
- Ne jamais révéler si un email existe ou non (réponse identique dans tous
  les cas pour forgot-password). Cela vaut aussi pour le chemin d'erreur : un
  échec d'envoi Nodemailer ne doit pas changer le statut HTTP, sinon la réponse
  redevient un oracle qui distingue les comptes existants des autres.

**Critères de validation :**
- La demande envoie bien un email contenant un lien avec token.
- Un token valide permet de changer le mot de passe.
- Un token expiré ou déjà utilisé est refusé.
- Plusieurs demandes successives créent plusieurs tokens valides.
- La réponse de forgot-password est identique pour un email inscrit et un email
  inconnu, y compris en cas d'échec d'envoi.

---

### F7 — Espace administrateur

**Objectif :** dashboard admin minimal (supervision des utilisateurs).

**Dépendances :** F1, F2.

**Fichiers concernés :**
- backend/src/repositories/user.repository.js (ajout de requêtes : liste, count)
- backend/src/controllers/admin.controller.js
- backend/src/routes/admin.routes.js
- backend/app.js (brancher les routes)

**Détails — endpoints :**
- GET /api/admin/users : liste des utilisateurs (email, date d'inscription).
- GET /api/admin/stats : nombre total d'utilisateurs inscrits (COUNT).

**Points d'implémentation :**
- Ajouter au user.repository les requêtes de liste et de comptage.
- Routes protégées par auth.middleware.js puis role.middleware.js (admin).
- L'admin ne voit jamais le contenu des bibliothèques des utilisateurs
  (confidentialité garantie).
- L'admin ne peut pas réinitialiser un mot de passe : seul l'utilisateur le
  peut, via le parcours mot de passe oublié. Aucun contrôle d'édition ni de
  suppression sur l'écran admin.

**Critères de validation :**
- Un admin obtient la liste des utilisateurs et le compteur.
- Un utilisateur non admin est refusé sur ces routes.
- Aucune donnée de bibliothèque n'est exposée.

---

## PHASE 2 — Frontend

### F8 — Setup du frontend (Tailwind, routeur, contexte, client API)

**Objectif :** poser les fondations du front avant les pages.

**Dépendances :** F1.

**Fichiers concernés :**
- frontend/tailwind.config.js, frontend/src/styles/index.css
- frontend/src/App.jsx (React Router)
- frontend/src/context/AuthContext.jsx
- frontend/src/services/api.js
- frontend/src/constants.js

**Détails :**
- Installer et configurer Tailwind.
- Mettre en place React Router avec les routes principales.
- AuthContext : état global de connexion (token, utilisateur). L'utilisateur est
  persisté en localStorage au même titre que le token : sans cela,
  isAuthenticated reste vrai après un rafraîchissement alors que user est null.
- api.js : wrapper fetch maison qui ajoute le token JWT au header,
  parse le JSON et gère les erreurs de façon centralisée.
- constants.js : clés de localStorage (token, utilisateur).

**Critères de validation :**
- Tailwind s'applique correctement.
- La navigation entre routes fonctionne.
- Le wrapper api.js envoie bien le token sur les requêtes protégées.
- Un rafraîchissement de page conserve la session et l'utilisateur.

---

### F9 — Pages d'authentification

**Objectif :** connexion, inscription, mot de passe oublié, réinitialisation.

**Dépendances :** F8, F1, F6.

**Fichiers concernés :**
- frontend/src/pages/Login.jsx
- frontend/src/pages/Register.jsx
- frontend/src/pages/ForgotPassword.jsx
- frontend/src/pages/ResetPassword.jsx
- frontend/src/components/AuthCard.jsx
- frontend/src/components/FormField.jsx

**Détails :**
- Valider les formulaires avec les schémas Zod partagés (@lykos/shared).
- Connexion et inscription stockent le token via AuthContext.
- Reset : page atteinte via le lien email. Le token arrive en **query string**
  (`/reset-password?token=...`), pas en paramètre de chemin, et se lit avec
  useSearchParams. C'est le front qui s'aligne sur le lien généré par
  mail.service.js, lequel est testé et validé.
- « Confirmer le mot de passe » n'existe pas côté backend : c'est une contrainte
  d'interface pour repérer une faute de frappe, vérifiée côté front uniquement,
  jamais envoyée à l'API.
- Message générique sur forgot-password (protection contre l'énumération de
  comptes), message précis sur reset-password : un email se devine, un token de
  256 bits non.

**Critères de validation :**
- Inscription et connexion fonctionnent de bout en bout.
- Les erreurs de validation s'affichent clairement.
- Le parcours de reset fonctionne du lien email au nouveau mot de passe.
- Un lien de reset sans token, expiré ou déjà utilisé affiche un message clair
  et non un formulaire voué à l'échec.

---

### F10 — Ma bibliothèque et Wishlist (collections et filtres)

**Objectif :** afficher les livres de l'utilisateur, répartis en collections
et filtrables par statut de lecture.

**Dépendances :** F8, F4.

**Fichiers concernés :**
- frontend/src/pages/Library.jsx
- frontend/src/pages/Wishlist.jsx
- frontend/src/components/Sidebar.jsx
- frontend/src/components/BookCard.jsx
- frontend/src/components/StatusSelector.jsx

**Détails — navigation à deux mécanismes :**

La sidebar porte les **collections**, c'est-à-dire des ensembles de livres
distincts :
- Ma bibliothèque (acquired_at non nul) : les livres possédés.
- Wishlist (wishlisted_at non nul et acquired_at nul) : les livres souhaités
  mais pas encore possédés.
- Administration, uniquement si l'utilisateur a le rôle admin.

Les **pills** en haut de l'écran portent les statuts de lecture (Tous, À lire,
En cours, Lu, Abandonné) et filtrent reading_status **à l'intérieur** de la
collection affichée.

**Points d'implémentation :**
- Un livre abandonné appartient toujours à la bibliothèque : c'est un état, pas
  un rangement. Un livre en wishlist, à l'inverse, n'est pas possédé du tout.
  C'est la seule vraie frontière, et c'est exactement celle qui est modélisée en
  base : reading_status d'un côté, acquired_at / wishlisted_at de l'autre.
- Mettre les quatre statuts à la fois dans la sidebar et dans les pills
  reviendrait à avoir deux mécanismes de navigation pour la même chose. La
  distinction collection / statut évite cette redondance.
- Pas de pills sur la Wishlist : reading_status a .default("to_read") dans le
  schéma partagé, donc les livres non possédés seraient tous sur la même pill et
  les quatre autres renverraient une liste vide en permanence.
- Le filtrage se fait côté backend, via les query params de GET /api/books
  (owned, wishlisted, status), et non en JavaScript après un chargement complet.
  La logique de filtrage n'est écrite qu'à un seul endroit et ne se dégrade pas
  quand la bibliothèque grossit. Coût assumé : une requête par clic de pill.
- Library.jsx relance l'appel à chaque changement de pill via un useEffect avec
  [status] en dépendance, protégé par un drapeau d'annulation dans la fonction de
  nettoyage : deux clics rapides ne doivent pas laisser la réponse périmée de la
  première requête écraser l'affichage de la seconde. Wishlist.jsx n'en a pas
  besoin, son tableau de dépendances est vide et l'effet ne se rejoue jamais.
- Library.jsx et Wishlist.jsx ne factorisent pas leur mécanique de chargement :
  chaque page reste autonome et lisible seule. Choix assumé au nom de
  l'explicabilité devant le jury.
- BookCard : couverture au format 2/3 en object-fit cover, titre, auteur. Un
  onError bascule sur un repli généré à partir des initiales du titre, ce qui
  couvre à la fois les livres sans couverture et les liens morts. cover_url est
  une URL saisie par l'utilisateur, pas un fichier uploadé.
- Sidebar : largeur 256px (w-64), conforme aux maquettes Figma. NavLink et non
  Link, pour obtenir l'état actif.
- Grille responsive : deux colonnes en mobile, jusqu'à cinq en desktop.

**Critères de validation :**
- Les deux collections affichent les bons livres : bibliothèque = possédés,
  wishlist = souhaités non possédés.
- Un livre abandonné apparaît bien dans la bibliothèque, sous la pill Abandonné.
- Les pills filtrent sans changer de collection.
- Le message de liste vide distingue une collection vide d'un filtre sans
  résultat.
- Un livre sans couverture, ou avec une URL morte, s'affiche correctement
  (pas d'image cassée).
- L'entrée Administration n'apparaît que pour un utilisateur admin.

---

### F11 — Formulaire d'ajout et d'édition d'un livre

**Objectif :** saisir manuellement un livre et le modifier.

**Dépendances :** F8, F4.

**Fichiers concernés :**
- frontend/src/pages/BookForm.jsx
- frontend/src/components/Toast.jsx

**Détails :**
- Un seul composant sert à la création et à la modification : en édition, les
  champs sont pré-remplis et la soumission part sur PATCH au lieu de POST.
- Champs obligatoires : titre, auteur, statut de lecture.
- Champs optionnels : année, éditeur, nombre de pages, ISBN, URL de couverture,
  résumé, saga, numéro de tome, note, commentaire, et les quatre dates.
- Auteur et saga se saisissent en texte libre : le backend s'occupe de créer
  les lignes correspondantes si elles n'existent pas.
- Validation avec les schémas Zod partagés, les mêmes que côté backend.
- Après enregistrement : toast de confirmation et redirection vers la liste.

**Critères de validation :**
- La création d'un livre fonctionne avec le minimum de champs.
- L'édition pré-remplit correctement le formulaire.
- Les erreurs de validation s'affichent champ par champ.
- Saisir un auteur déjà existant ne crée pas de doublon en base.

**Note soutenance :** c'est le parcours présenté dans les slides, de bout en
bout : BookForm.jsx -> schéma Zod partagé -> book.routes.js ->
auth.middleware.js -> book.controller.js (résolution auteur/saga) ->
book.repository.js -> MySQL. Sept fichiers, un seul parcours, qui touche au
passage la validation partagée, l'authentification et la vérification
d'appartenance.

---

### F12 — Détail d'un livre

**Objectif :** page de détail d'un livre avec toutes ses informations et son suivi.

**Dépendances :** F8, F4.

**Fichiers concernés :**
- frontend/src/pages/BookDetail.jsx

**Détails :**
- Couverture, titre, auteur, année, éditeur, nombre de pages, ISBN, résumé.
- Saga et numéro de tome si renseignés.
- Bloc de suivi : statut, note en étoiles, commentaire, et les quatre dates.
- Boutons Modifier (vers F11) et Supprimer (avec confirmation).
- C'est cet écran, et non BookCard, qui porte l'affichage complet du statut, de
  la note, de la saga et du numéro de tome. La carte reste volontairement
  minimale : couverture, titre, auteur.

**Critères de validation :**
- Toutes les informations du livre s'affichent.
- Les champs non renseignés ne laissent pas de libellé vide à l'écran.
- La suppression demande confirmation et renvoie à la liste.

---

### F13 — SUPPRIMÉE (détail série et accordéon épisodes)

Remplacée par F12. La notion de saga est portée par le champ saga du formulaire
et affichée sur la fiche livre.

---

### F14 — Dashboard administrateur

**Objectif :** interface admin de supervision.

**Dépendances :** F8, F7.

**Fichiers concernés :**
- frontend/src/pages/AdminDashboard.jsx

**Détails :**
- Visible uniquement pour un utilisateur admin (entrée Administration dans
  la sidebar, protégée par AdminRoute).
- Carte : nombre total d'utilisateurs.
- Tableau : email et date d'inscription des utilisateurs, rien d'autre. La table
  user ne contient ni nom ni prénom : minimisation des données personnelles,
  argument RGPD.
- Aucun contrôle d'édition, de suppression ni de réinitialisation de mot de passe.

**Critères de validation :**
- Un admin voit le compteur et la liste.
- Un utilisateur non admin n'a pas accès à cette page, même en forçant l'URL :
  la vraie barrière est role.middleware.js côté serveur, AdminRoute n'étant que
  son miroir côté expérience utilisateur.

---

### F15 — Landing page (SEO)

**Objectif :** page d'accueil publique, indexable, avant connexion.

**Dépendances :** F8.

**Fichiers concernés :**
- frontend/src/pages/Landing.jsx

**Détails :**
- Header (logo, Connexion, S'inscrire), hero, 3 fonctionnalités, aperçu,
  appel à l'action, footer.
- Plus aucune mention légale TMDB à afficher : l'application n'utilise plus
  de données tierces.
- Contenu textuel pensé pour le référencement (suivi de lecture, bibliothèque
  personnelle, carnet de lecture).

**Critères de validation :**
- La page est accessible sans être connecté.
- Les liens mènent vers connexion et inscription.

---

## Ordre de développement recommandé

Backend : F0.1 -> F0.2 -> F1 -> F2 -> F4 -> F6 -> F7
Frontend : F8 -> F9 -> F10 -> F11 -> F12 -> F14 -> F15

Chaque fonctionnalité se code, se teste et se valide avant de passer à la
suivante. Une branche Git par fonctionnalité (ou par phase) garde main propre.

Rappel architecture : les controllers passent par les repositories pour la
base et par les services pour l'externe. Aucun SQL directement dans un controller.