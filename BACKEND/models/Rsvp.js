import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

const rsvpSchema = new mongoose.Schema({
    eventId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Event",
        required: true
    },
    participantId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    feedback: {
        type: String,
        trim: true,
        default: null
    },
    status: {
        type: String,
        enum: ["active", "canceled"], // Tracks if RSVP is active or canceled
        default: "active"
    },
    ticket: {
        type: String,
        default: null // Ticket for in-person events
    },
    joinedAt: {
        type: Date,
        default: Date.now
    },
    feedbackSubmittedAt: {
        type: Date,
        default: null
    }
}, {
    timestamps: true
});

export default mongoose.model('RSVP', rsvpSchema);
