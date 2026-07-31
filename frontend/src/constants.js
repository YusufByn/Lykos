// Petites constantes partagees par plusieurs fichiers du frontend : les cles
// de localStorage utilisees par AuthContext et api.js, et les libelles
// d'interface (READING_STATUS_LABELS) utilises par StatusSelector.jsx,
// BookForm.jsx et BookDetail.jsx. Centralisees ici pour n'avoir qu'une seule
// source de verite dans chaque cas : avant, la meme chaine de cle etait
// dupliquee dans deux fichiers, et la meme table de libelles dans trois,
// avec le risque qu'une modification dans l'un et pas les autres
// desynchronise tout.

export const TOKEN_STORAGE_KEY = "lykos_token";
export const USER_STORAGE_KEY = "lykos_user";

// libelles francais des 4 statuts de lecture. Le schema partage
// (@lykos/shared) ne porte que les valeurs techniques de READING_STATUSES
// (to_read, reading, read, abandoned) : les libelles sont un choix
// d'interface, ils n'ont pas leur place dans un schema de validation.
// Centralises ici plutot que redeclares dans StatusSelector.jsx,
// BookForm.jsx et BookDetail.jsx : un statut ajoute demain n'obligerait a
// modifier qu'un seul fichier, et un oubli dans l'un des trois produirait
// un undefined a l'ecran sans erreur si la table restait dupliquee.
export const READING_STATUS_LABELS = {
  to_read: "À lire",
  reading: "En cours",
  read: "Lu",
  abandoned: "Abandonné",
};
