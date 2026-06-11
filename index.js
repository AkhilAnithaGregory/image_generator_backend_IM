import dotenv from "dotenv";
dotenv.config();

import fs from "fs";
import cors from "cors";
import express from "express";
import multer from "multer";
import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import commitRoutes from "./routes/commitRoutes.js";
import inviteRoutes from "./routes/inviteRoutes.js";
import pullRequestRoutes from "./routes/pullRequestRoutes.js";
import projectRoutes from "./routes/projectRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import branchRoutes from "./routes/branchRoutes.js";
import generationRoutes from "./routes/generationRoutes.js";

//connectDB();

const app = express();
app.use(cors());

//Routes
app.use("/auth", authRoutes);
app.use("/commit", commitRoutes);
app.use("/invite", inviteRoutes);
app.use("/pull", pullRequestRoutes);
app.use("/project", projectRoutes);
app.use("/notify", notificationRoutes);
app.use("/branch", branchRoutes);
app.use("/generate", generationRoutes);

// TEST ROUTE
app.get("/hi", async (req, res) => {
    res.send("Hello from backend!");
});

app.listen(process.env.PORT, () => {
    console.log(`Server running on port ${process.env.PORT}`);
});