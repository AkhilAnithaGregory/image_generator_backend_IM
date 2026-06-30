import express from "express";
import * as auth from "../controllers/authController.js"
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/signup", auth.signup);
router.post("/login", auth.login);
router.get("/me", authMiddleware, auth.getMe);
router.put("/user", authMiddleware, auth.updateUser);
router.delete("/user", authMiddleware, auth.deleteUser);

export default router;