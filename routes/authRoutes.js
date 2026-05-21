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
// CURRENT USER
router.get("/me", authMiddleware, getMe);

router.put(
    "/update-user",
    authMiddleware,
    updateUser
);

router.delete(
    "/delete-user",
    authMiddleware,
    deleteUser
);

export default router;