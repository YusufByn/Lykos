// Cles de localStorage utilisees par AuthContext et api.js.
// Centralisees ici pour n'avoir qu'une seule source de verite :
// avant, la meme chaine etait dupliquee dans les deux fichiers, avec
// le risque qu'une modification dans l'un et pas l'autre desynchronise tout.

export const TOKEN_STORAGE_KEY = "lykos_token";
export const USER_STORAGE_KEY = "lykos_user";
