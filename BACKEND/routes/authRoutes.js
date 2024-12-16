import express from "express";
import { signup, login, logout  } from "../controllers/Auth.js";
import { auth } from "../middlewares/auth.js";

const router = express.Router();

// Authentication routes
router.post("/signup", signup); // User signup
router.post("/login", login); 
router.post("/logout", auth, logout);   // User login

export default router;
