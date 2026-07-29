// Routes de la bibliotheque (table book).
// Toutes ces routes necessitent d'etre connecte (voir auth.middleware.js).

import { Router } from "express";
import {
  addBook,
  getBookDetails,
  getLibrary,
  removeBook,
  updateBookDetails,
} from "../controllers/book.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const bookRouter = Router();

// on applique le middleware d'auth une seule fois sur tout le router,
// comme pour les autres entites de l'application
bookRouter.use(authMiddleware);

// liste des livres de l'utilisateur connecte (avec filtres en query string) : GET /api/books
bookRouter.get("/", getLibrary);

// detail d'un livre : GET /api/books/:id
bookRouter.get("/:id", getBookDetails);

// ajout d'un livre : POST /api/books
bookRouter.post("/", addBook);

// modification partielle d'un livre : PATCH /api/books/:id
bookRouter.patch("/:id", updateBookDetails);

// suppression d'un livre : DELETE /api/books/:id
bookRouter.delete("/:id", removeBook);

export default bookRouter;
