// Champ de formulaire complet : un label, un champ de saisie (input, textarea
// ou select selon la prop "as") et son message d'erreur éventuel juste en
// dessous, avec une indication facultative (prop "hint") entre les deux.
// Regroupe ces éléments dans un seul composant pour ne pas les répéter à
// chaque champ de chaque page.
// Dix props au total : label, name, value, onChange et error sont obligatoires
// et utilisées à chaque appel ; type n'est lue que par la variante input (elle
// n'a pas de sens pour textarea ou select) ; as, options, hint et disabled sont
// optionnelles, avec un comportement par défaut (as="input", pas de hint,
// disabled=false) identique à la version d'origine du composant.

// classes partagées par les trois variantes de champ : meme gabarit visuel
// quelle que soit la balise choisie via la prop "as", ecrit une seule fois
const FIELD_CLASSES =
  "w-full rounded-lg border border-[#E2E2E2] px-3 py-2 text-[#1B1B1B] focus:border-[#174ED8] focus:outline-none";

export default function FormField({
  label,
  name,
  type,
  value,
  onChange,
  error,
  as = "input",
  options = [],
  hint,
  disabled = false,
}) {
  // aria-describedby doit lister le hint ET l'erreur quand les deux existent,
  // pour qu'un lecteur d'ecran annonce les deux a la suite du champ ; sans
  // hint, on ne pointe que vers l'erreur comme avant cet ajout
  const describedBy = hint ? `${name}-hint ${name}-error` : `${name}-error`;

  return (
    <div className="mb-4">
      <label htmlFor={name} className="mb-1 block text-sm font-medium text-[#1B1B1B]">
        {label}
      </label>

      {as === "input" && (
        <input
          id={name}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          disabled={disabled}
          // aria-invalid signale l'état invalide du champ, aria-describedby
          // rattache le message d'erreur au champ pour qu'un lecteur d'écran l'annonce
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy}
          className={FIELD_CLASSES}
        />
      )}

      {/* variante texte long (resume, commentaire...) : memes attributs
          d'accessibilite et de style que le input ci-dessus, seule la balise
          change selon la prop "as" */}
      {as === "textarea" && (
        <textarea
          id={name}
          name={name}
          rows={4}
          value={value}
          onChange={onChange}
          disabled={disabled}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy}
          className={FIELD_CLASSES}
        />
      )}

      {/* variante liste fermee (reading_status...) : "options" est fourni par
          la page appelante, FormField reste generique et ne connait aucune
          valeur metier comme READING_STATUSES */}
      {as === "select" && (
        <select
          id={name}
          name={name}
          value={value}
          onChange={onChange}
          disabled={disabled}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy}
          className={FIELD_CLASSES}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      )}

      {/* indication facultative sous le champ (ex. "8 caracteres minimum") :
          affichee seulement si la page appelante fournit la prop hint, ce qui
          ne change rien pour les pages qui ne la fournissent pas */}
      {hint && <p id={`${name}-hint`} className="mt-1 text-sm text-[#434655]">{hint}</p>}

      {/* espace toujours réservé : évite que le formulaire "saute" quand
          une erreur apparaît ou disparaît */}
      <p id={`${name}-error`} className="mt-1 min-h-[1.25rem] text-sm text-red-600">{error}</p>
    </div>
  );
}
