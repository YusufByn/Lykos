// Formulaire d'ajout ET de modification d'un livre (F11).
// Un seul composant pour les deux usages : le mode se deduit de la presence
// de l'id dans l'url (useParams), pas d'une prop. En creation, l'id est
// absent et le formulaire part vide ; en edition, l'id est present, on
// charge le livre existant avant d'afficher le formulaire pre-rempli.

import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { createBookSchema, READING_STATUSES, updateBookSchema } from "@lykos/shared";
import FormField from "../components/FormField";
import Toast from "../components/Toast";
import { READING_STATUS_LABELS } from "../constants";
import { api } from "../services/api";

const READING_STATUS_OPTIONS = READING_STATUSES.map((status) => ({
  value: status,
  label: READING_STATUS_LABELS[status],
}));

// formulaire vide utilise en creation, et comme point de depart en edition
// avant que le livre charge ne vienne le remplacer (voir useEffect plus bas).
// Tous les champs sont des chaines, y compris les nombres et les dates : un
// <input> ne manipule que des chaines, la conversion se fait a la soumission
// (voir buildPayload) et jamais avant, pour ne pas complexifier handleChange.
const BLANK_FORM = {
  title: "",
  author_first_name: "",
  author_last_name: "",
  series_title: "",
  volume_number: "",
  publication_year: "",
  publisher: "",
  page_count: "",
  isbn: "",
  cover_url: "",
  summary: "",
  reading_status: "to_read",
  rating: "",
  comment: "",
  wishlisted_at: "",
  acquired_at: "",
  started_reading_at: "",
  finished_reading_at: "",
};

// Champs optionnels effacables en edition : exactement ceux que
// updateBookSchema declare .nullable() (voir book.schema.js). Liste nommee
// plutot que regle disseminee dans des if : on peut la comparer d'un coup
// d'oeil au schema partage, et un champ ajoute demain se voit tout de suite.
// Trois listes et non une seule, parce que la valeur envoyee quand le champ
// est rempli ne se construit pas pareil : chaine nettoyee au trim, nombre
// converti, ou chaine de date laissee telle quelle.
//
// Deux champs optionnels n'y figurent volontairement pas :
// - series_title, qui n'est pas .nullable() et garde son mecanisme de chaine
//   vide comme signal de detachement de saga (voir buildPayload) ;
// - volume_number, effacable lui aussi mais conditionne a series_title, donc
//   traite a part juste apres lui (voir buildPayload).
const ERASABLE_TEXT_FIELDS = [
  "author_first_name",
  "publisher",
  "isbn",
  "cover_url",
  "summary",
  "comment",
];

const ERASABLE_NUMBER_FIELDS = ["publication_year", "page_count", "rating"];

const ERASABLE_DATE_FIELDS = [
  "wishlisted_at",
  "acquired_at",
  "started_reading_at",
  "finished_reading_at",
];

// date du jour au format attendu par le schema ("YYYY-MM-DD"), calculee a
// partir des getters locaux de Date (getFullYear/getMonth/getDate) et non de
// toISOString() : toISOString() convertit en UTC, ce qui peut faire basculer
// sur le jour suivant ou precedent selon le fuseau horaire de l'utilisateur,
// exactement le decalage deja rencontre cote backend (voir skill Lykos sur
// dateStrings). getFullYear/getMonth/getDate restent en heure locale.
function getTodayLocalDate() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default function BookForm() {
  const { id } = useParams();
  const navigate = useNavigate();

  // presence de l'id dans l'url = mode edition. Deduit une seule fois par
  // rendu, jamais stocke dans un state : ce n'est pas une donnee qui change
  // en cours de vie du composant (l'url ne change pas sans remonter la page)
  const isEditMode = Boolean(id);

  const [form, setForm] = useState(BLANK_FORM);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [saving, setSaving] = useState(false);

  // chargement du livre existant, uniquement en mode edition
  const [loading, setLoading] = useState(isEditMode);
  // trois issues possibles du chargement, en plus du cas "toujours en cours" :
  // null (charge avec succes ou pas encore tente), "error" (erreur serveur),
  // "notFound" (livre inexistant ou appartenant a un autre utilisateur)
  const [loadStatus, setLoadStatus] = useState(null);

  // livre renvoye par la derniere sauvegarde reussie (creation ou edition) :
  // sa presence sert a la fois de signal de succes et de source pour savoir
  // vers quelle collection rediriger (voir useEffect de redirection plus bas)
  const [savedBook, setSavedBook] = useState(null);

  // livre tel que charge depuis l'API en mode edition, jamais modifie apres
  // coup (contrairement a "form") : sert de reference pour le lien Annuler,
  // qui doit renvoyer vers la collection reelle du livre, pas vers une
  // collection deduite d'une modification pas encore enregistree
  const [loadedBook, setLoadedBook] = useState(null);

  // charge le livre a modifier des le montage, uniquement en mode edition
  useEffect(() => {
    if (!isEditMode) {
      return;
    }

    let cancelled = false;

    async function fetchBook() {
      setLoading(true);
      setLoadStatus(null);

      try {
        const book = await api.get(`/books/${id}`);

        if (cancelled) {
          return;
        }

        setLoadedBook(book);

        // chaque valeur potentiellement absente est ramenee a une chaine vide
        // ou a "" pour les nombres/dates : un input controle par React refuse
        // null/undefined comme value, il faut toujours une chaine
        setForm({
          title: book.title ?? "",
          author_first_name: book.author_first_name ?? "",
          author_last_name: book.author_last_name ?? "",
          series_title: book.series_title ?? "",
          volume_number: book.volume_number != null ? String(book.volume_number) : "",
          publication_year: book.publication_year != null ? String(book.publication_year) : "",
          publisher: book.publisher ?? "",
          page_count: book.page_count != null ? String(book.page_count) : "",
          isbn: book.isbn ?? "",
          cover_url: book.cover_url ?? "",
          summary: book.summary ?? "",
          reading_status: book.reading_status ?? "",
          rating: book.rating != null ? String(book.rating) : "",
          comment: book.comment ?? "",
          wishlisted_at: book.wishlisted_at ?? "",
          acquired_at: book.acquired_at ?? "",
          started_reading_at: book.started_reading_at ?? "",
          finished_reading_at: book.finished_reading_at ?? "",
        });
      } catch (fetchError) {
        if (cancelled) {
          return;
        }

        // le backend renvoie exactement ce message pour un livre inexistant
        // OU appartenant a un autre utilisateur (meme reponse dans les deux
        // cas, voir book.controller.js) : on distingue ce cas precis du reste
        // des erreurs pour proposer un message et un lien adaptes
        if (fetchError.message === "Livre introuvable.") {
          setLoadStatus("notFound");
        } else {
          setLoadStatus("error");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchBook();

    return () => {
      cancelled = true;
    };
  }, [id, isEditMode]);

  // une fois le livre enregistre, on laisse le toast quelques instants a
  // l'ecran avant de renvoyer vers la collection a laquelle le livre
  // appartient desormais : possede (acquired_at rempli) -> bibliotheque,
  // sinon (wishlisted_at rempli sans acquired_at, ou aucun des deux) -> wishlist
  useEffect(() => {
    if (!savedBook) {
      return;
    }

    const target = savedBook.acquired_at ? "/bibliotheque" : "/wishlist";

    const timeoutId = setTimeout(() => {
      navigate(target, { replace: true });
    }, 1500);

    // ici on annule vraiment le minuteur avec clearTimeout (contrairement a
    // une requete fetch deja partie, un setTimeout pas encore declenche peut
    // etre stoppe net) : si le composant est demonte avant la fin du delai,
    // le redirect programme n'a plus lieu d'etre
    return () => clearTimeout(timeoutId);
  }, [savedBook, navigate]);

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((previous) => {
      const next = { ...previous, [name]: value };

      // la saga vient d'etre effacee par la saisie : on vide aussi le numero
      // de tome tout de suite, pour que l'etat du formulaire reste coherent
      // avec ce que buildPayload enverra (le champ tome devient desactive au
      // meme moment, voir plus bas dans le JSX). Un champ desactive n'est pas
      // un champ vide : c'est buildPayload qui garantit la vraie coherence,
      // ce nettoyage ici n'est qu'un confort visuel immediat pour l'utilisateur.
      if (name === "series_title" && value.trim() === "") {
        next.volume_number = "";
      }

      return next;
    });
  }

  // pre-remplit une des deux dates avec aujourd'hui, sans jamais toucher a
  // l'autre : un livre peut tres bien avoir ete voulu puis obtenu, les deux
  // dates sont independantes (voir skill Lykos). Les boutons ne font que
  // proposer une valeur de depart, les champs date restent modifiables plus
  // bas comme n'importe quel autre champ, rien n'est verrouille.
  function handleMarkAsOwned() {
    setForm((previous) => ({ ...previous, acquired_at: getTodayLocalDate() }));
  }

  function handleMarkAsWishlisted() {
    setForm((previous) => ({ ...previous, wishlisted_at: getTodayLocalDate() }));
  }

  // construit le corps envoye a l'API a partir du formulaire (chaines) en
  // convertissant chaque champ vers ce qu'attend le schema Zod.
  // Le point a retenir : un champ optionnel vide n'est pas traite pareil
  // selon le mode.
  // - En creation, il est omis du corps : il n'y a rien a effacer, et
  //   createBookSchema n'accepte pas null.
  // - En edition, il part a null : dans un PATCH, une cle absente signifie
  //   "ne pas modifier" et non "vider", donc sans null il serait impossible
  //   d'effacer une valeur deja enregistree (voir updateBookSchema).
  function buildPayload() {
    // champs jamais vides : title et author_last_name sont verifies avant
    // l'appel (voir handleSubmit), reading_status a toujours une valeur
    // selectionnee dans le <select>
    const payload = {
      title: form.title.trim(),
      author_last_name: form.author_last_name.trim(),
      reading_status: form.reading_status,
    };

    // regle unique, appliquee APRES trim : un champ qui ne contient que des
    // espaces est considere comme vide, il part donc a null en edition et
    // jamais en "   ". Aucun de ces champs ne part en chaine vide.
    for (const field of ERASABLE_TEXT_FIELDS) {
      const value = form[field].trim();

      if (value) {
        payload[field] = value;
      } else if (isEditMode) {
        payload[field] = null;
      }
    }

    // meme regle pour les nombres. La chaine vide n'a jamais ete valide ici :
    // z.number() refuse toute chaine, meme vide -> soit un vrai nombre, soit
    // null en edition, soit rien du tout en creation.
    for (const field of ERASABLE_NUMBER_FIELDS) {
      if (form[field] !== "") {
        payload[field] = Number(form[field]);
      } else if (isEditMode) {
        payload[field] = null;
      }
    }

    // meme regle pour les dates. La valeur d'un <input type="date"> est deja
    // au format "YYYY-MM-DD" attendu par z.string().date(), on la transmet
    // telle quelle sans jamais la faire passer par new Date().
    for (const field of ERASABLE_DATE_FIELDS) {
      if (form[field] !== "") {
        payload[field] = form[field];
      } else if (isEditMode) {
        payload[field] = null;
      }
    }

    // EXCEPTION a la regle ci-dessus, le seul champ optionnel qui n'y obeit
    // pas : series_title n'est pas .nullable() dans updateBookSchema. C'est la
    // chaine vide, et non null, qui sert de signal de detachement de saga,
    // interprete par resolveSeriesId() dans book.controller.js (teste et
    // valide en F4). On envoie donc "" en edition, et on omet la cle en
    // creation ou createBookSchema la refuserait (.min(1)).
    if (isEditMode) {
      payload.series_title = form.series_title.trim();
    } else if (form.series_title.trim()) {
      payload.series_title = form.series_title.trim();
    }

    // le numero de tome n'a de sens que rattache a une saga : le champ est
    // desactive tant qu'aucune saga n'est saisie (voir le JSX plus bas), et on
    // ne l'envoie que si series_title porte une vraie valeur. En edition, tout
    // autre cas part explicitement a null : si l'utilisateur detache le livre
    // de sa saga, le tome est efface en base au lieu d'y rester orphelin.
    // C'est ce que .nullable() sur volume_number a debloque : auparavant la
    // cle etait seulement omise, ce qui signifiait "ne pas modifier" et
    // laissait le numero en place malgre le detachement de la saga.
    if (form.volume_number !== "" && payload.series_title) {
      payload.volume_number = Number(form.volume_number);
    } else if (isEditMode) {
      payload.volume_number = null;
    }

    return payload;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setServerError("");

    const trimmedTitle = form.title.trim();
    const trimmedAuthorLastName = form.author_last_name.trim();
    const manualErrors = {};

    // verification manuelle de title/author_last_name avant meme d'appeler
    // Zod : updateBookSchema ne porte pas de message francais personnalise
    // sur ces deux champs (contrairement a createBookSchema qui en a un), on
    // evite ainsi de laisser remonter un message par defaut de Zod en anglais
    if (!trimmedTitle) {
      manualErrors.title = ["Le titre est obligatoire."];
    }
    if (!trimmedAuthorLastName) {
      manualErrors.author_last_name = ["Le nom de l'auteur est obligatoire."];
    }

    // contrainte valable dans les deux sens, creation comme edition : sans
    // acquired_at NI wishlisted_at, le livre n'appartient a aucune des deux
    // collections (la bibliotheque filtre sur acquired_at IS NOT NULL, la
    // wishlist sur wishlisted_at IS NOT NULL AND acquired_at IS NULL). Il
    // existerait en base sans jamais etre atteignable dans l'interface.
    // A la creation, le risque est de ne renseigner ni l'une ni l'autre.
    // En edition, le risque est nouveau : depuis que ces dates sont
    // effacables (.nullable() dans updateBookSchema), vider les deux ferait
    // disparaitre de l'ecran un livre qui existait, sans aucun avertissement.
    // Un livre doit toujours appartenir a une collection pour rester
    // atteignable, qu'on soit en train de le creer ou de le modifier.
    if (!form.acquired_at && !form.wishlisted_at) {
      manualErrors.acquisitionIntent = [
        isEditMode
          ? "Garde au moins une des deux dates, acquisition ou wishlist : sans elles, ce livre n'apparaîtrait plus dans aucune collection."
          : "Indique si tu possèdes ce livre ou si tu le veux, ou renseigne une des deux dates (acquisition ou wishlist).",
      ];
    }

    if (Object.keys(manualErrors).length > 0) {
      setErrors(manualErrors);
      return;
    }

    const payload = buildPayload();

    // validation cote front pour le confort de saisie uniquement : le
    // backend revalide de toute facon les memes regles avec le meme schema
    const schema = isEditMode ? updateBookSchema : createBookSchema;
    const validation = schema.safeParse(payload);

    if (!validation.success) {
      setErrors(validation.error.flatten().fieldErrors);
      return;
    }

    setErrors({});
    setSaving(true);

    try {
      const saved = isEditMode
        ? await api.patch(`/books/${id}`, validation.data)
        : await api.post("/books", validation.data);

      setSavedBook(saved);
    } catch (submitError) {
      setServerError(submitError.message);
    } finally {
      setSaving(false);
    }
  }

  // etat de chargement, uniquement possible en mode edition
  if (loading) {
    return (
      <div className="p-8">
        <p className="text-sm text-[#434655]">Chargement...</p>
      </div>
    );
  }

  if (loadStatus === "notFound") {
    return (
      <div className="p-8">
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
          Livre introuvable.
        </p>
        <Link to="/bibliotheque" className="mt-4 inline-block text-sm font-medium text-[#174ED8]">
          Retour à la bibliothèque
        </Link>
      </div>
    );
  }

  if (loadStatus === "error") {
    return (
      <div className="p-8">
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
          Impossible de charger ce livre pour le moment.
        </p>
        <Link to="/bibliotheque" className="mt-4 inline-block text-sm font-medium text-[#174ED8]">
          Retour à la bibliothèque
        </Link>
      </div>
    );
  }

  const disabled = saving || Boolean(savedBook);

  // Annuler : en creation, il n'existe pas encore de livre ni de collection
  // d'origine, on retourne toujours vers la bibliotheque. En edition, on
  // retourne vers la collection reelle du livre charge (meme regle que la
  // redirection post-enregistrement), jamais vers une collection deduite
  // d'une modification pas encore sauvegardee.
  let cancelTarget = "/bibliotheque";

  if (isEditMode) {
    if (loadedBook?.acquired_at) {
      cancelTarget = "/bibliotheque";
    } else {
      cancelTarget = "/wishlist";
    }
  }

  return (
    <div className="mx-auto max-w-2xl p-8">
      <h1 className="mb-6 text-2xl font-semibold text-[#1B1B1B]">
        {isEditMode ? "Modifier le livre" : "Ajouter un livre"}
      </h1>

      {serverError && (
        <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{serverError}</p>
      )}

      <form onSubmit={handleSubmit} noValidate>
        <fieldset disabled={disabled}>
          {!isEditMode && (
            <div className="mb-6 rounded-lg border border-[#E2E2E2] p-4">
              <p className="mb-2 text-sm font-medium text-[#1B1B1B]">Ce livre...</p>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleMarkAsOwned}
                  className="rounded-lg border border-[#E2E2E2] px-4 py-1.5 text-sm text-[#434655] hover:border-[#174ED8]"
                >
                  Je le possède
                </button>

                <button
                  type="button"
                  onClick={handleMarkAsWishlisted}
                  className="rounded-lg border border-[#E2E2E2] px-4 py-1.5 text-sm text-[#434655] hover:border-[#174ED8]"
                >
                  Je le veux
                </button>
              </div>

              {/* sans l'une des deux dates, le livre n'appartient a aucune
                  collection et devient invisible dans l'interface (la
                  bibliotheque filtre sur acquired_at, la wishlist sur
                  wishlisted_at), alors que le modele de donnees l'autorise :
                  ces boutons ne font que proposer une valeur de depart pour
                  eviter ce trou, les dates restent modifiables plus bas */}
              <p className="mt-2 text-xs text-[#434655]">
                Pré-remplit la date correspondante plus bas ; tu peux la modifier ou la compléter ensuite.
              </p>
            </div>
          )}

          <FormField
            label="Titre"
            name="title"
            type="text"
            value={form.title}
            onChange={handleChange}
            error={errors.title?.[0]}
          />

          <h2 className="mb-3 mt-6 text-lg font-semibold text-[#1B1B1B]">Auteur</h2>

          <FormField
            label="Prénom"
            name="author_first_name"
            type="text"
            value={form.author_first_name}
            onChange={handleChange}
            error={errors.author_first_name?.[0]}
          />

          <FormField
            label="Nom"
            name="author_last_name"
            type="text"
            value={form.author_last_name}
            onChange={handleChange}
            error={errors.author_last_name?.[0]}
          />

          <h2 className="mb-3 mt-6 text-lg font-semibold text-[#1B1B1B]">Lecture</h2>

          <FormField
            as="select"
            label="Statut de lecture"
            name="reading_status"
            value={form.reading_status}
            onChange={handleChange}
            error={errors.reading_status?.[0]}
            options={READING_STATUS_OPTIONS}
          />

          <h2 className="mb-3 mt-6 text-lg font-semibold text-[#1B1B1B]">Saga</h2>

          <FormField
            label="Titre de la saga"
            name="series_title"
            type="text"
            value={form.series_title}
            onChange={handleChange}
            error={errors.series_title?.[0]}
          />

          <FormField
            label="Numéro de tome"
            name="volume_number"
            type="number"
            value={form.volume_number}
            onChange={handleChange}
            error={errors.volume_number?.[0]}
            // contrainte d'interface, pas une regle metier : exactement comme
            // "confirmer le mot de passe" dans Register.jsx, rien dans le
            // modele de donnees n'exige une saga pour numeroter un tome, mais
            // un tome sans saga n'a pas de sens pour l'utilisateur. L'API
            // accepterait un volume_number sans series_title et creerait un
            // tome orphelin (series_id a NULL) ; ce champ reste desactive
            // tant qu'aucune saga n'est saisie pour eviter ce cas.
            disabled={!form.series_title.trim()}
          />

          <h2 className="mb-3 mt-6 text-lg font-semibold text-[#1B1B1B]">Détails</h2>

          <FormField
            label="Année de publication"
            name="publication_year"
            type="number"
            value={form.publication_year}
            onChange={handleChange}
            error={errors.publication_year?.[0]}
          />

          <FormField
            label="Éditeur"
            name="publisher"
            type="text"
            value={form.publisher}
            onChange={handleChange}
            error={errors.publisher?.[0]}
          />

          <FormField
            label="Nombre de pages"
            name="page_count"
            type="number"
            value={form.page_count}
            onChange={handleChange}
            error={errors.page_count?.[0]}
          />

          <FormField
            label="ISBN"
            name="isbn"
            type="text"
            value={form.isbn}
            onChange={handleChange}
            error={errors.isbn?.[0]}
          />

          <FormField
            label="URL de couverture"
            name="cover_url"
            type="text"
            value={form.cover_url}
            onChange={handleChange}
            error={errors.cover_url?.[0]}
            hint="Colle le lien d'une image trouvée en ligne (une URL, pas un fichier)."
          />

          <FormField
            as="textarea"
            label="Résumé"
            name="summary"
            value={form.summary}
            onChange={handleChange}
            error={errors.summary?.[0]}
          />

          <h2 className="mb-3 mt-6 text-lg font-semibold text-[#1B1B1B]">Ton avis</h2>

          <FormField
            label="Note"
            name="rating"
            type="number"
            value={form.rating}
            onChange={handleChange}
            error={errors.rating?.[0]}
            hint="Entre 1 et 5."
          />

          <FormField
            as="textarea"
            label="Commentaire"
            name="comment"
            value={form.comment}
            onChange={handleChange}
            error={errors.comment?.[0]}
          />

          <h2 className="mb-3 mt-6 text-lg font-semibold text-[#1B1B1B]">Suivi personnel</h2>

          <FormField
            label="Ajouté à la wishlist le"
            name="wishlisted_at"
            type="date"
            value={form.wishlisted_at}
            onChange={handleChange}
            error={errors.wishlisted_at?.[0]}
          />

          <FormField
            label="Acquis le"
            name="acquired_at"
            type="date"
            value={form.acquired_at}
            onChange={handleChange}
            error={errors.acquired_at?.[0]}
          />

          <FormField
            label="Lecture commencée le"
            name="started_reading_at"
            type="date"
            value={form.started_reading_at}
            onChange={handleChange}
            error={errors.started_reading_at?.[0]}
          />

          <FormField
            label="Lecture terminée le"
            name="finished_reading_at"
            type="date"
            value={form.finished_reading_at}
            onChange={handleChange}
            error={errors.finished_reading_at?.[0]}
          />

          {/* erreur de niveau formulaire, affichee dans les deux modes juste
              au-dessus du bouton : elle ne porte pas sur un champ precis mais
              sur la combinaison des deux dates, et sa cause comme sa
              correction different selon qu'on cree ou qu'on modifie */}
          {errors.acquisitionIntent && (
            <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
              {errors.acquisitionIntent[0]}
            </p>
          )}

          <div className="mt-6 flex items-center gap-4">
            <button
              type="submit"
              disabled={disabled}
              className="w-full rounded-lg bg-[#174ED8] px-3 py-2 font-medium text-white disabled:opacity-60"
            >
              {saving
                ? "Enregistrement..."
                : isEditMode
                  ? "Enregistrer les modifications"
                  : "Ajouter le livre"}
            </button>

            <Link to={cancelTarget} className="whitespace-nowrap text-sm text-[#434655]">
              Annuler
            </Link>
          </div>
        </fieldset>
      </form>

      {savedBook && (
        <Toast message={isEditMode ? "Livre modifié avec succès." : "Livre ajouté avec succès."} />
      )}
    </div>
  );
}
