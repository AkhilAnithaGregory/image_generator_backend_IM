import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import Project from "../models/Project.js";
import Branch from "../models/Branch.js";
import Commit from "../models/Commit.js";
import Invite from "../models/Invite.js";
import PullRequest from "../models/PullRequest.js";
import Notification from "../models/Notification.js";

export const signup = async (req, res) => {
    try {
        const { username, email, password } = req.body;

        console.log("aaaa", username, email, password)

        if (!username || !email || !password) {
            return res.status(400).json({
                message: "All fields are required",
            });
        }

        const existingUser = await User.findOne({ email });

        if (existingUser) {
            return res.status(400).json({
                message: "Email already exists",
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await User.create({
            username,
            email,
            password: hashedPassword,
        });

        const token = jwt.sign(
            {
                id: user._id,
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "7d",
            }
        );

        res.status(201).json({
            message: "Signup successful",
            token,

            user: {
                id: user._id,
                username: user.username,
                email: user.email,
            },
        });
    } catch (error) {
        console.log(error);

        res.status(500).json({
            message: "Server error",
        });
    }
};
export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                message: "Email and password required",
            });
        }

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(400).json({
                message: "Invalid credentials",
            });
        }

        const isMatch = await bcrypt.compare(
            password,
            user.password
        );

        if (!isMatch) {
            return res.status(400).json({
                message: "Invalid credentials",
            });
        }

        const token = jwt.sign(
            {
                id: user._id,
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "7d",
            }
        );

        res.status(200).json({
            message: "Login successful",
            token,

            user: {
                id: user._id,
                username: user.username,
                email: user.email,
            },
        });
    } catch (error) {
        console.log(error);

        res.status(500).json({
            message: "Server error",
        });
    }
};
export const getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select(
            "-password"
        );

        res.status(200).json(user);
    } catch (error) {
        console.log(error);

        res.status(500).json({
            message: "Server error",
        });
    }
};
export const updateUser = async (req, res) => {
    try {
        const {
            username,
            oldPassword,
            newPassword,
            email,
        } = req.body;

        if (email) {
            return res.status(400).json({
                message:
                    "Email cannot be updated",
            });
        }

        const user = await User.findById(
            req.user.id
        );

        if (!user) {
            return res.status(404).json({
                message: "User not found",
            });
        }

        if (username) {
            user.username = username;
        }

        if (oldPassword || newPassword) {

            if (
                !oldPassword ||
                !newPassword
            ) {
                return res.status(400).json({
                    message:
                        "Old password and new password are required",
                });
            }

            const isMatch =
                await bcrypt.compare(
                    oldPassword,
                    user.password
                );

            if (!isMatch) {
                return res.status(400).json({
                    message:
                        "Old password is incorrect",
                });
            }

            const hashedPassword =
                await bcrypt.hash(
                    newPassword,
                    10
                );

            user.password =
                hashedPassword;
        }

        await user.save();

        res.status(200).json({
            message:
                "User updated successfully",

            user: {
                id: user._id,
                username: user.username,
                email: user.email,
            },
        });
    } catch (error) {
        console.log(error);

        res.status(500).json({
            message: "Server error",
        });
    }
};
export const deleteUser = async (req, res) => {
    try {
        const userId = req.user.id;

        await Project.deleteMany({
            owner: userId,
        });

        await Branch.deleteMany({
            owner: userId,
        });

        await Commit.deleteMany({
            createdBy: userId,
        });

        await Invite.deleteMany({
            $or: [
                { fromUser: userId },
                { toUser: userId },
            ],
        });

        await PullRequest.deleteMany({
            createdBy: userId,
        });

        await Notification.deleteMany({
            $or: [
                { sender: userId },
                { receiver: userId },
            ],
        });

        await Project.updateMany(
            {},
            {
                $pull: {
                    collaborators: {
                        user: userId,
                    },
                },
            }
        );

        await User.findByIdAndDelete(
            userId
        );

        res.status(200).json({
            message:
                "User deleted successfully",
        });
    } catch (error) {
        res.status(500).json({
            message: "Server error",
        });
    }
};