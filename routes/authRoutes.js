import express from "express";
import {
  signup,
  login,
  getMe,
  updateUser,
  deleteUser,
} from "../controllers/authController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);
router.get("/me", authMiddleware, getMe);
router.put("/user", authMiddleware, updateUser);
router.delete("/user", authMiddleware, deleteUser);

export default router;