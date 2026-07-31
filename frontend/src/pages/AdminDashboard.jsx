// Dashboard administrateur (F14).
// Ecran de supervision, en lecture seule : un compteur de comptes et la liste
// des utilisateurs. Aucun controle d'edition, de suppression ni de
// reinitialisation de mot de passe : l'admin supervise, il n'agit pas sur les
// comptes, et il ne voit jamais le contenu des bibliotheques.
//
// Le tableau ne montre que l'email et la date d'inscription parce que la table
// user ne contient rien d'autre d'identifiant : ni nom, ni prenom. C'est un
// choix de minimisation des donnees personnelles (RGPD) fait des la conception
// du schema, pas une restriction ajoutee ici.

import { useEffect, useState } from "react";
import { api } from "../services/api";

// created_at de la table user est une colonne DATETIME : l'API la renvoie en
// ISO complet, avec heure et suffixe Z ("2026-07-29T12:48:48.000Z"), et non en
// "YYYY-MM-DD" comme les 4 dates de suivi d'un livre, qui sont des colonnes
// DATE (le pool mysql2 est configure avec dateStrings: ['DATE'], donc seules
// les colonnes DATE sont converties en chaine, voir skill Lykos).
//
// Cette difference de type impose une methode de formatage differente :
// - une colonne DATE est une date de calendrier, sans heure ni fuseau. La
//   passer par new Date() la ferait interpreter comme minuit UTC, puis
//   reafficher dans le fuseau local, ce qui peut faire perdre un jour. D'ou le
//   decoupage de chaine utilise dans BookDetail.jsx, qui ne cree aucun Date.
// - une colonne DATETIME est un instant reel, deja porteur d'un fuseau (Z).
//   Le convertir vers le fuseau du lecteur est exactement ce qu'on veut, il
//   n'y a pas de jour a perdre. new Date() est donc legitime ici, et
//   toLocaleDateString("fr-FR") donne directement le format JJ/MM/AAAA.
function formatSignupDate(isoDateTime) {
  return new Date(isoDateTime).toLocaleDateString("fr-FR");
}

export default function AdminDashboard() {
  const [totalUsers, setTotalUsers] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function fetchDashboard() {
      setLoading(true);
      setError("");

      try {
        // les deux appels partent en parallele avec Promise.all : ils sont
        // totalement independants, aucun n'a besoin du resultat de l'autre.
        // Les enchainer l'un apres l'autre additionnerait les deux temps
        // d'attente sans rien apporter. En contrepartie, si l'un des deux
        // echoue, Promise.all rejette et on affiche une seule erreur pour
        // l'ecran entier : c'est le comportement voulu, un dashboard a moitie
        // charge serait plus trompeur qu'utile.
        const [stats, userList] = await Promise.all([
          api.get("/admin/stats"),
          api.get("/admin/users"),
        ]);

        if (cancelled) {
          return;
        }

        setTotalUsers(stats.totalUsers);
        setUsers(userList);
      } catch (fetchError) {
        if (!cancelled) {
          setError(fetchError.message);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchDashboard();

    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="p-8">
        <p className="text-sm text-[#434655]">Chargement...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="p-8">
      <h1 className="mb-6 text-2xl font-semibold text-[#1B1B1B]">Administration</h1>

      <div className="mb-8 inline-block rounded-lg border border-[#E2E2E2] px-6 py-4">
        <p className="text-sm text-[#434655]">Comptes inscrits</p>
        <p className="mt-1 text-3xl font-semibold text-[#174ED8]">{totalUsers}</p>
      </div>

      <h2 className="mb-3 text-lg font-semibold text-[#1B1B1B]">Utilisateurs</h2>

      {users.length === 0 ? (
        <p className="text-sm text-[#434655]">Aucun compte inscrit pour l'instant.</p>
      ) : (
        // vrai <table> et non une grille de div : ce sont des donnees
        // tabulaires, et un lecteur d'ecran a besoin des <th scope="col"> pour
        // annoncer a quelle colonne appartient chaque cellule
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-[#E2E2E2]">
              <th scope="col" className="py-2 font-medium text-[#1B1B1B]">
                Email
              </th>
              <th scope="col" className="py-2 font-medium text-[#1B1B1B]">
                Inscrit le
              </th>
            </tr>
          </thead>

          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-b border-[#E2E2E2]">
                <td className="py-2 text-[#434655]">{user.email}</td>
                <td className="py-2 text-[#434655]">{formatSignupDate(user.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
