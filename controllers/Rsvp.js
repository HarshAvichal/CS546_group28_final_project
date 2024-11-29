import RSVP from '../models/Rsvp.js';
import Event from '../models/Event.js';
import User from '../models/User.js';
import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid'; 
import { sendEmail } from '../utils/emailSender.js';

// RSVP for an Event
export const rsvpEvent = async (req, res, next) => {
    try {
        const { eventId } = req.params;

        // Validate eventId
        if (!mongoose.Types.ObjectId.isValid(eventId)) {
            return res.status(400).json({ message: "Invalid event ID" });
        }

        const event = await Event.findById(eventId);
        if (!event) {
            return res.status(404).json({ message: "Event not found" });
        }

        // Check if RSVP is allowed
        const currentDateTime = new Date();
        const eventStartDateTime = new Date(`${event.date}T${event.startTime}`);

        // Prevent RSVP for live or completed events
        if (currentDateTime >= eventStartDateTime) {
            return res.status(400).json({
                message: "RSVP is not allowed after the event has started or completed.",
            });
        }

        // Check if the user has an active RSVP for this event
        const existingRSVP = await RSVP.findOne({ eventId, participantId: req.user.id, status: "active" });
        if (existingRSVP) {
            return res.status(400).json({ message: "You have already RSVP'd for this event." });
        }

        // Create a new RSVP or update an existing canceled RSVP
        let rsvp = await RSVP.findOne({ eventId, participantId: req.user.id });
        if (rsvp) {
            rsvp.status = "active";
            rsvp.ticket = event.type === "in-person" ? uuidv4() : null;
            rsvp.joinedAt = currentDateTime;
        } else {
            rsvp = new RSVP({
                eventId,
                participantId: req.user.id,
                ticket: event.type === "in-person" ? uuidv4() : null, // Generate a ticket for in-person events
                joinedAt: currentDateTime,
            });
        }

        await rsvp.save();

        // Add the participant to the event's RSVP list
        if (!event.rsvpList.some((entry) => entry.participantId.toString() === req.user.id)) {
            event.rsvpList.push({ participantId: req.user.id, status: "active" });
            await event.save();
        }

        // Send confirmation email
        const participant = await User.findById(req.user.id);
        if (participant) {
            const emailContent = `
                <p>Dear ${participant.firstName},</p>
                <p>You have successfully registered for the event <strong>${event.title}</strong>.</p>
                <p><strong>Event Details:</strong></p>
                <ul>
                    <li>Date: ${event.date}</li>
                    <li>Time: ${event.startTime} - ${event.endTime} (EST)</li>
                    <li>Type: ${event.type === "online" ? "Online" : "In-person"}</li>
                    ${
                        event.type === "online"
                            ? `<li>Link: <a href="${event.location}">Join the event</a></li>`
                            : `<li>Location: ${event.location}</li><li>Your Ticket: Available in the portal under 'My Events'</li>`
                    }
                </ul>
                <p>Thank you for registering! We look forward to seeing you at the event.</p>
            `;

            await sendEmail(
                participant.email,
                `RSVP Confirmation: ${event.title}`,
                emailContent
            );
        }

        res.status(201).json({ message: "RSVP successful", ticket: rsvp.ticket });
    } catch (error) {
        console.error("Error during RSVP:", error);
        next(error);
    }
};

// Cancel RSVP for an Event
export const cancelRSVP = async (req, res, next) => {
    try {
        const { eventId } = req.params;

        // Validate eventId
        if (!mongoose.Types.ObjectId.isValid(eventId)) {
            return res.status(400).json({ message: "Invalid event ID." });
        }

        // Fetch the event
        const event = await Event.findById(eventId);
        if (!event) {
            return res.status(404).json({ message: "Event not found." });
        }

        // Prevent RSVP cancellation for live or completed events
        const currentDateTime = new Date();
        const eventStartDateTime = new Date(`${event.date}T${event.startTime}`);
        const eventEndDateTime = new Date(`${event.date}T${event.endTime}`);

        if (currentDateTime >= eventStartDateTime && currentDateTime <= eventEndDateTime) {
            return res.status(400).json({
                message: "RSVP cannot be canceled while the event is live.",
            });
        }
        if (currentDateTime >= eventEndDateTime) {
            return res.status(400).json({
                message: "RSVP cannot be canceled for an event that has already ended.",
            });
        }

        // Check if the user has an active RSVP for this event
        const rsvp = await RSVP.findOne({
            eventId,
            participantId: req.user.id,
            status: "active",
        });
        if (!rsvp) {
            return res.status(400).json({
                message: "You have not RSVP'd for this event or your RSVP is already canceled.",
            });
        }

        // Mark RSVP as canceled
        rsvp.status = "canceled";
        rsvp.ticket = null;
        await rsvp.save();

        // Remove the participant from the event's RSVP list
        event.rsvpList = event.rsvpList.filter(
            (entry) => entry.participantId.toString() !== req.user.id
        );
        await event.save();

        // Send cancellation email
        const participant = await User.findById(req.user.id);
        if (participant) {
            await sendEmail(
                participant.email,
                `RSVP Canceled: ${event.title}`,
                `<p>Dear ${participant.firstName},</p>
                 <p>You have successfully canceled your RSVP for the event <strong>${event.title}</strong>.</p>
                 <p><strong>Event Details:</strong></p>
                 <ul>
                     <li>Date: ${event.date}</li>
                     <li>Time: ${event.startTime} - ${event.endTime} (EST)</li>
                 </ul>
                 <p>We hope to see you at our future events.</p>`
            );
        }

        res.status(200).json({ message: "RSVP canceled successfully." });
    } catch (error) {
        console.error("Error during RSVP cancellation:", error);
        next(error); // Pass error to centralized error handler
    }
};

// Submit Feedback
export const submitFeedback = async (req, res, next) => {
    try {
      const { eventId } = req.params;
      const { feedback } = req.body;
  
      // Validate eventId
      if (!mongoose.Types.ObjectId.isValid(eventId)) {
        return res.status(400).json({ message: "Invalid event ID" });
      }
  
      // Check if event exists
      const event = await Event.findById(eventId);
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }
  
      // Ensure event is completed
      const currentDateTime = new Date();
      const eventEndDateTime = new Date(`${event.date}T${event.endTime}`);
      if (currentDateTime <= eventEndDateTime) {
        return res.status(400).json({ message: "Event not completed yet" });
      }
  
      // Check if participant RSVP'd for this event
      const rsvp = await RSVP.findOne({ eventId, participantId: req.user.id, status: "active" });
      if (!rsvp) {
        return res.status(400).json({ message: "You did not RSVP for this event" });
      }
  
      // Validate feedback input
      if (!feedback || feedback.trim() === "") {
        return res.status(400).json({ message: "Feedback cannot be empty" });
      }
  
      // Save feedback in RSVP
      rsvp.feedback = feedback.trim();
      rsvp.feedbackSubmittedAt = new Date();
      await rsvp.save();
  
      // Also add feedback to Event's feedbackList
      const feedbackEntry = {
        participantId: req.user.id,
        feedback: feedback.trim(),
      };
  
      // Update feedbackList array in the Event model
      event.feedbackList.push(feedbackEntry);
      await event.save();
  
      // Send a success response
      res.status(200).json({ message: "Feedback submitted successfully", feedback: feedbackEntry });
    } catch (error) {
      console.error("Error submitting feedback:", error);
      next(error); // Pass error to the centralized error handler
    }
  };

// Get Ticket for In-Person Event
export const getTicket = async (req, res, next) => {
    try {
        const { eventId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(eventId)) {
            return res.status(400).json({ message: "Invalid event ID." });
        }

        const event = await Event.findById(eventId);
        if (!event) {
            return res.status(404).json({ message: "Event not found." });
        }

        const currentDateTime = new Date();
        const eventEndDateTime = new Date(`${event.date}T${event.endTime}`);
        if (currentDateTime >= eventEndDateTime) {
            return res.status(400).json({ message: "Tickets are no longer accessible for past events." });
        }

        const rsvp = await RSVP.findOne({ eventId, participantId: req.user.id, status: "active" });
        if (!rsvp) {
            return res.status(404).json({ message: "No active RSVP found for this event." });
        }

        if (!rsvp.ticket) {
            return res.status(400).json({ message: "Ticket not available for this event." });
        }

        res.status(200).json({ ticket: rsvp.ticket });
    } catch (error) {
        console.error("Error fetching ticket:", error);
        next(error); // Pass error to centralized handler
    }
};

// Count Participants for an Event
export const countParticipants = async (req, res, next) => {
    try {
        const { eventId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(eventId)) {
            return res.status(400).json({ message: "Invalid event ID." });
        }

        const event = await Event.findById(eventId);
        if (!event) {
            return res.status(404).json({ message: "Event not found." });
        }

        const count = event.rsvpList.filter((entry) => entry.status === "active").length;

        res.status(200).json({ message: `Total participants: ${count}`, count });
    } catch (error) {
        console.error("Error counting participants:", error);
        next(error); // Pass error to centralized handler
    }
};
