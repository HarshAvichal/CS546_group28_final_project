import express from "express";
import { signup, login, logout  } from "../controllers/Auth.js";
import { auth } from "../middlewares/auth.js";

const router = express.Router();

// Authentication routes
router.post("/signup", signup); // User signup
router.post("/login", login); // User login
router.post("/logout", auth, logout);   

export default router;
