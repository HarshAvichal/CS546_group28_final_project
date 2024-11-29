import cron from "node-cron";
import Event from "../models/Event.js";
import RSVP from "../models/Rsvp.js";
import User from "../models/User.js";
import { sendEmail } from "./emailSender.js";

// Function to schedule reminder emails
export const scheduleReminders = () => {
    // Run the job every hour to check for events happening 24 hours later
    cron.schedule("0 * * * *", async () => {
        console.log(`[${new Date().toISOString()}] Checking for upcoming events to send reminders...`);

        try {
            const now = new Date();
            const reminderTimeStart = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours from now
            const reminderTimeEnd = new Date(reminderTimeStart.getTime() + 60 * 60 * 1000); // 24-25 hours from now

            // Fetch online events happening 24 hours later
            const events = await Event.find({
                type: "online", // Filter for online events
                date: reminderTimeStart.toISOString().split("T")[0],
                startTime: {
                    $gte: reminderTimeStart.toTimeString().split(" ")[0],
                    $lt: reminderTimeEnd.toTimeString().split(" ")[0],
                },
            });

            for (const event of events) {
                // Fetch RSVP details with participant information
                const rsvpDetails = await RSVP.find({ eventId: event._id, status: "active" }).populate("participantId");

                for (const rsvp of rsvpDetails) {
                    const participant = rsvp.participantId;

                    if (participant) {
                        let retries = 3;
                        while (retries > 0) {
                            try {
                                await sendEmail(
                                    participant.email,
                                    `Reminder: Upcoming Event "${event.title}"`,
                                    `<p>Dear ${participant.firstName},</p>
                                     <p>This is a reminder for the upcoming event <strong>${event.title}</strong>.</p>
                                     <p><strong>Event Details:</strong></p>
                                     <ul>
                                         <li>Date: ${event.date}</li>
                                         <li>Time: ${event.startTime} - ${event.endTime} (EST)</li>
                                     </ul>
                                     <p>Join using the link: <a href="${event.location}">${event.location}</a></p>
                                     <p>We look forward to seeing you there!</p>`
                                );

                                console.log(`Reminder email sent to ${participant.email} for event: ${event.title}`);
                                break; // Exit retry loop if successful
                            } catch (emailError) {
                                retries--;
                                console.error(`Failed to send email to ${participant.email}. Retries left: ${retries}`, emailError.message);
                            }
                        }
                    }
                }
            }
        } catch (error) {
            console.error(`[${new Date().toISOString()}] Error sending reminder emails:`, error.message);
        }
    });

    // Run the job every minute to notify participants when events start
    cron.schedule("* * * * *", async () => {
        console.log(`[${new Date().toISOString()}] Checking for live events to notify participants...`);

        try {
            const now = new Date();
            const currentDate = now.toISOString().split("T")[0];
            const currentTime = now.toTimeString().split(" ")[0];

            // Fetch events that are starting now and have not ended
            const events = await Event.find({
                date: currentDate,
                startTime: { $lte: currentTime },
                endTime: { $gte: currentTime }, // Ensure the event is still live
                status: "upcoming", // Only notify for upcoming events
            });

            for (const event of events) {
                // Fetch RSVP'd participants
                const rsvpDetails = await RSVP.find({ eventId: event._id, status: "active" }).populate("participantId");

                for (const rsvp of rsvpDetails) {
                    const participant = rsvp.participantId;

                    if (participant) {
                        let retries = 3;
                        while (retries > 0) {
                            try {
                                await sendEmail(
                                    participant.email,
                                    `Event Now Live: ${event.title}`,
                                    `<p>Dear ${participant.firstName},</p>
                                     <p>The event <strong>${event.title}</strong> is now live!</p>
                                     <p>We hope you enjoy the event!</p>`
                                );

                                console.log(`Live event notification sent to ${participant.email} for event: ${event.title}`);
                                break; // Exit retry loop if successful
                            } catch (emailError) {
                                retries--;
                                console.error(`Failed to send live event notification to ${participant.email}. Retries left: ${retries}`, emailError.message);
                            }
                        }
                    }
                }

                // Update the event's status to "live" to prevent duplicate notifications
                event.status = "live";
                await event.save();
            }
        } catch (error) {
            console.error(`[${new Date().toISOString()}] Error sending live event notifications:`, error.message);
        }
    });

    // Run the job every minute to move live events to completed
    cron.schedule("* * * * *", async () => {
        console.log(`[${new Date().toISOString()}] Checking for live events to mark as completed...`);

        try {
            const now = new Date();
            const currentDate = now.toISOString().split("T")[0];
            const currentTime = now.toTimeString().split(" ")[0];

            // Fetch live events that have ended
            const liveEvents = await Event.find({
                date: currentDate,
                endTime: { $lt: currentTime },
                status: "live",
            });

            for (const event of liveEvents) {
                // Update the event's status to "completed"
                event.status = "completed";
                await event.save();

                console.log(`Event "${event.title}" has been marked as completed.`);
            }
        } catch (error) {
            console.error(`[${new Date().toISOString()}] Error updating live events to completed:`, error.message);
        }
    });
};
