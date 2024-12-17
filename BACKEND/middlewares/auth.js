import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

export const auth = (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(" ")[1];

        if (!token) {
            return res.status(401).json({ message: "Authentication token is missing or malformed." });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;

        next();
    } catch (error) {
        console.error("Authentication error:", error);
        
        if (error.name === "TokenExpiredError") {
            return res.status(401).json({ message: "Authentication token has expired. Please log in again." });
        } else if (error.name === "JsonWebTokenError") {
            return res.status(401).json({ message: "Invalid authentication token." });
        } else {
            return res.status(500).json({ message: "An unexpected error occurred during authentication." });
        }
    }
};

export const isOrganizer = (req, res, next) => {
    try {
        if (req.user.role !== "organizer") {
            return res.status(403).json({ message: "Access restricted to organizers only." });
        }
        next();
    } catch (error) {
        console.error("Authorization error for organizer:", error);
        next(error);
    }
};

export const isParticipant = (req, res, next) => {
    try {
        if (req.user.role !== "participant") {
            return res.status(403).json({ message: "Access restricted to participants only." });
        }
        next();
    } catch (error) {
        console.error("Authorization error for participant:", error);
        next(error);
    }
};
