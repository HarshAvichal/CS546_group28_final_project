import express from "express";
import {
    createEvent,
    getOrganizerUpcomingEvents,    // Fetch upcoming events for the organizer
    getOrganizerCompletedEvents,   // Fetch completed events for the organizer
    getOrganizerLiveEvents,        // Fetch live events for the organizer
    getParticipantUpcomingEvents,  // Fetch all upcoming events for participants
    getParticipantCompletedEvents, // Fetch all completed events for participants
    getParticipantMyEvents,        // Fetch RSVP’d (my) events for participants
    getEventDetails,
    deleteEvent,
    updateEvent,
    searchEvents,
} from "../controllers/Event.js";
import { auth, isOrganizer, isParticipant } from "../middlewares/auth.js";
import { upload } from "../utils/cloudinary.js";

const router = express.Router();

// Organizer routes
router.post("/create", auth, isOrganizer, upload.single("thumbnail"), createEvent); 
router.get("/organizer/upcoming", auth, isOrganizer, getOrganizerUpcomingEvents); // Fetch upcoming events
router.get("/organizer/completed", auth, isOrganizer, getOrganizerCompletedEvents); // Fetch completed events
router.get("/organizer/live", auth, isOrganizer, getOrganizerLiveEvents); // Fetch live events
router.patch("/:id", auth, isOrganizer, upload.single("thumbnail"), updateEvent);

// Participant routes
router.get("/participant/upcoming", auth, isParticipant, getParticipantUpcomingEvents); // Fetch all upcoming events
router.get("/participant/completed", auth, isParticipant, getParticipantCompletedEvents); // Fetch all completed events
router.get("/participant/my-events", auth, isParticipant, getParticipantMyEvents); // Fetch RSVP’d (my) events
router.get("/details/:id", auth, getEventDetails); // Fetch event details

// General routes
router.delete("/:id", auth, isOrganizer, deleteEvent); // Delete an event
router.get("/search", searchEvents); // Search for events by filters (no auth required)

export default router;
