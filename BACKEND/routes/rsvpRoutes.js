import express from "express";
import { rsvpEvent, cancelRSVP, submitFeedback, getTicket, countParticipants, } from "../controllers/Rsvp.js";
import { auth, isParticipant } from "../middlewares/auth.js";

const router = express.Router();

// RSVP routes
router.post("/:eventId", auth, isParticipant, rsvpEvent); // RSVP to an event
router.post("/:eventId/cancel", auth, isParticipant, cancelRSVP); // Cancel RSVP
router.post("/:eventId/feedback", auth, isParticipant, submitFeedback); // Submit feedback for a completed event
router.get("/:eventId/ticket", auth, isParticipant, getTicket); // Fetch ticket for in-person event
router.get("/:eventId/count", auth, countParticipants); // Get count of participants for the event

export default router;
