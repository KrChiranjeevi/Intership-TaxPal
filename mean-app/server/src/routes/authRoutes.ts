import express from "express";
import { signup, login } from "../controllers/authController.js"; 

const router = express.Router();

// Register the signup controller function to handle both /signup and /register
router.post("/signup", signup);
router.post("/register", signup); // ✅ ADDED: To match the frontend's API call

// Route for user login
router.post("/login", login);

export default router;
