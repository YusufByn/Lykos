// Landing page publique (F15).
// Seul ecran de l'application accessible sans compte : il presente Lykos a un
// visiteur qui ne connait pas encore l'outil, et l'oriente vers l'inscription.
//
// Page entierement statique : aucun appel API, aucun state, aucun useEffect.
// Il n'y a rien a charger, tout le contenu est ecrit en dur, ce qui la rend
// aussi immediate a afficher qu'a expliquer.
//
// Le texte est redige pour le referencement : il emploie les mots qu'un
// visiteur taperait reellement dans un moteur de recherche (suivi de lecture,
// bibliotheque personnelle, carnet de lecture, wishlist de livres) plutot que
// des formules creuses. La hierarchie des titres suit la meme logique : un
// seul <h1> qui annonce le sujet de la page, des <h2> pour les sections, des
// <h3> pour les trois fonctionnalites. C'est un critere SEO autant
// qu'accessibilite : un lecteur d'ecran parcourt la page par ses titres.

import { Link } from "react-router-dom";

export default function Landing() {
  return (
    <div className="min-h-screen bg-white">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
        {/* le nom en texte simple : le logo sera travaille plus tard, mettre
            une image provisoire ici couterait un aller-retour pour rien */}
        <span className="text-xl font-semibold text-[#1B1B1B]">Lykos</span>

        <nav className="flex items-center gap-4">
          <Link to="/login" className="text-sm text-[#434655]">
            Connexion
          </Link>
          <Link
            to="/register"
            className="rounded-lg bg-[#174ED8] px-4 py-2 text-sm font-medium text-white"
          >
            S'inscrire
          </Link>
        </nav>
      </header>

      <main>
        <section className="mx-auto max-w-5xl px-6 py-16 sm:py-24">
          {/* unique <h1> de la page : il porte le sujet principal, le suivi
              de lecture, et c'est le titre que reprendra un moteur de recherche */}
          <h1 className="max-w-3xl text-4xl font-semibold leading-tight text-[#1B1B1B] sm:text-5xl">
            Ton suivi de lecture, enfin à un seul endroit
          </h1>

          <p className="mt-6 max-w-2xl text-lg text-[#434655]">
            Lykos est un carnet de lecture en ligne. Tu y construis ta bibliothèque
            personnelle livre par livre, tu notes où tu en es, ce que tu en as pensé,
            et tu gardes de côté ceux que tu veux lire un jour. Rien n'est importé
            automatiquement : tu saisis tes livres toi-même, et ils n'appartiennent
            qu'à toi.
          </p>

          <div className="mt-10">
            <Link
              to="/register"
              className="inline-block rounded-lg bg-[#174ED8] px-6 py-3 font-medium text-white"
            >
              Commencer ma bibliothèque
            </Link>
          </div>
        </section>

        <section className="border-t border-[#E2E2E2] bg-white">
          <div className="mx-auto max-w-5xl px-6 py-16">
            <h2 className="text-2xl font-semibold text-[#1B1B1B]">
              Ce que tu peux faire avec Lykos
            </h2>

            {/* une colonne en mobile, trois a partir de la taille medium :
                les cartes restent lisibles sans defilement horizontal */}
            <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3">
              <article className="rounded-lg border border-[#E2E2E2] p-6">
                <h3 className="text-lg font-semibold text-[#1B1B1B]">
                  Ta bibliothèque et ta wishlist, séparées
                </h3>
                <p className="mt-3 text-[#434655]">
                  Les livres que tu possèdes vivent dans ta bibliothèque. Ceux que tu
                  veux acheter ou emprunter restent dans ta wishlist de livres, sans
                  se mélanger aux autres. Deux collections distinctes, deux écrans
                  distincts.
                </p>
              </article>

              <article className="rounded-lg border border-[#E2E2E2] p-6">
                <h3 className="text-lg font-semibold text-[#1B1B1B]">
                  Où tu en es, livre par livre
                </h3>
                <p className="mt-3 text-[#434655]">
                  Chaque livre porte un statut de lecture : à lire, en cours, lu ou
                  abandonné. Un livre abandonné reste dans ta bibliothèque, parce
                  qu'un abandon fait partie d'un parcours de lecture, ce n'est pas
                  une raison de le faire disparaître.
                </p>
              </article>

              <article className="rounded-lg border border-[#E2E2E2] p-6">
                <h3 className="text-lg font-semibold text-[#1B1B1B]">
                  Tes notes et tes dates
                </h3>
                <p className="mt-3 text-[#434655]">
                  Attribue une note sur cinq, écris un commentaire personnel, et
                  garde la trace des dates qui comptent : quand tu as acheté le livre,
                  quand tu l'as commencé, quand tu l'as terminé.
                </p>
              </article>
            </div>
          </div>
        </section>

        <section className="border-t border-[#E2E2E2]">
          <div className="mx-auto max-w-5xl px-6 py-16 text-center">
            <h2 className="text-2xl font-semibold text-[#1B1B1B]">
              Ouvre ton carnet de lecture
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-[#434655]">
              La création d'un compte prend une adresse email et un mot de passe.
              Ajoute ton premier livre dans la foulée.
            </p>

            <div className="mt-8">
              <Link
                to="/register"
                className="inline-block rounded-lg bg-[#174ED8] px-6 py-3 font-medium text-white"
              >
                Créer mon compte
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-[#E2E2E2]">
        <div className="mx-auto flex max-w-5xl flex-col gap-3 px-6 py-8 text-sm text-[#434655] sm:flex-row sm:items-center sm:justify-between">
          <p>Lykos — suivi de lecture personnel</p>

          <nav className="flex gap-4">
            <Link to="/login">Connexion</Link>
            <Link to="/register">S'inscrire</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
