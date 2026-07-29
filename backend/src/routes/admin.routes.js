// Routes de l'espace administrateur.
// Toutes ces routes necessitent d'etre connecte ET d'avoir le role admin.

import { Router } from "express";
import { getStats, getUsers } from "../controllers/admin.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { adminMiddleware } from "../middlewares/role.middleware.js";

const adminRouter = Router();

// on chaine les deux middlewares sur tout le router : d'abord verifier le token,
// puis verifier que le role de l'utilisateur est bien admin
adminRouter.use(authMiddleware, adminMiddleware);

// liste des utilisateurs (email, date d'inscription) : GET /api/admin/users
adminRouter.get("/users", getUsers);

// nombre total d'utilisateurs inscrits : GET /api/admin/stats
adminRouter.get("/stats", getStats);

export default adminRouter;
