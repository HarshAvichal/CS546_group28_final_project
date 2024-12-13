import express from "express";
import dotenv from "dotenv";
import path from "path";
import dbConnect from "./config/db.js";
import authRoutes from "./routes/authRoutes.js"; // Routes for authentication (login/signup)
import eventRoutes from "./routes/eventRoutes.js"; // Routes for event management
import rsvpRoutes from "./routes/rsvpRoutes.js"; // Routes for RSVP functionality
import { scheduleReminders } from "./utils/notificationScheduler.js";
import { errorHandler } from './middlewares/errorHandler.js';

// Initialize express and dotenv
dotenv.config();
const app = express();

// Middleware to parse JSON
app.use(express.json());

app.use(errorHandler);

// Connect to the database
dbConnect();


// Default PORT
const PORT = process.env.PORT || 3000;

const __dirname = path.resolve();
app.use(express.static(path.join(__dirname, "../Frontend")));

// Welcome route (default endpoint)
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "../Frontend", "login.html"));
});

// Use Routes
app.use("/api/v1/auth", authRoutes); // Authentication routes
app.use("/api/v1/events", eventRoutes); // Event-related routes
app.use("/api/v1/rsvp", rsvpRoutes); // RSVP-related routes


// Start reminder scheduler
scheduleReminders();


// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
