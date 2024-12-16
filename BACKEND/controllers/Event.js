import Event from "../models/Event.js";
import RSVP from "../models/Rsvp.js";
import User from "../models/User.js";
import mongoose from "mongoose";
import { sendEmail } from "../utils/emailSender.js";
import cloudinary from "../utils/cloudinary.js";

// Create Event
export const createEvent = async (req, res, next) => {
  try {
    const { title, description, date, startTime, endTime, type, location } =
      req.body;

    // Only organizers can create events
    if (req.user.role !== "organizer") {
      return res
        .status(403)
        .json({ message: "Only organizers can create events." });
    }

    // Validate required fields
    if (!title || !date || !startTime || !endTime || !type) {
      return res.status(400).json({
        message: "Title, date, startTime, endTime, and type are required.",
      });
    }

    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      return res.status(400).json({
        message: "Invalid date format. Use YYYY-MM-DD (e.g., 2024-12-31).",
      });
    }

    // Normalize time input
    const normalizeTime = (time) => {
      const [hours, minutes] = time.split(":").map(Number);
      if (
        isNaN(hours) ||
        isNaN(minutes) ||
        hours < 0 ||
        hours > 23 ||
        minutes < 0 ||
        minutes > 59
      ) {
        throw new Error(
          `Invalid time format: ${time}. Use HH:mm (e.g., 13:00 or 1:00).`
        );
      }
      return `${hours.toString().padStart(2, "0")}:${minutes
        .toString()
        .padStart(2, "0")}`;
    };

    let normalizedStartTime, normalizedEndTime;

    try {
      normalizedStartTime = normalizeTime(startTime);
      normalizedEndTime = normalizeTime(endTime);
    } catch (error) {
      return res.status(400).json({ message: error.message });
    }

    // Logical validation: startTime < endTime
    if (normalizedStartTime >= normalizedEndTime) {
      return res
        .status(400)
        .json({ message: "End time must be after start time." });
    }

    const currentDateTime = new Date();
    const eventStartDateTime = new Date(`${date}T${normalizedStartTime}`);

    // Check if the event is in the past
    if (eventStartDateTime < currentDateTime) {
      return res
        .status(400)
        .json({ message: "Cannot create an event in the past." });
    }

    // Validate type
    if (!["online", "in-person"].includes(type)) {
      return res.status(400).json({
        message: "Invalid event type. Must be 'online' or 'in-person'.",
      });
    }

    // Automatically generate a Jitsi link if the event is online and no link is provided
    let eventLocation = location;
    if (type === "online") {
      if (!location) {
        const roomName = `EventEase-${Date.now()}-${Math.random()
          .toString(36)
          .substring(2, 15)}`;
        eventLocation = `https://meet.jit.si/${roomName}`;
      } else if (!location.startsWith("https://meet.jit.si/")) {
        return res.status(400).json({
          message: "For online events, location must be a valid Jitsi link.",
        });
      }
    }

    // Check for conflicting events
    const conflict = await Event.findOne({
      organizerId: req.user.id,
      date,
      $or: [
        { startTime: { $lt: normalizedEndTime, $gte: normalizedStartTime } },
        { endTime: { $gt: normalizedStartTime, $lte: normalizedEndTime } },
        {
          startTime: { $lte: normalizedStartTime },
          endTime: { $gte: normalizedEndTime },
        },
      ],
    });

    if (conflict) {
      return res.status(400).json({
        message: `You already have another event (${conflict.title}) scheduled on ${conflict.date} from ${conflict.startTime} to ${conflict.endTime}.`,
      });
    }

    const thumbnailResponse = await cloudinary.uploader.upload(req.file.path, {
      public_id: "thumbnail",
    });

    // Create the event
    const event = new Event({
      title,
      description,
      date,
      startTime: normalizedStartTime,
      endTime: normalizedEndTime,
      type,
      location: eventLocation,
      organizerId: req.user.id,
      thumbnail: thumbnailResponse.secure_url,
      status: "upcoming", // Explicitly set the default status
    });

    await event.save();
    res.status(201).json({ message: "Event created successfully", event });
  } catch (error) {
    console.error("Error creating event:", error);
    next(error); // Pass error to centralized error handler
  }
};

// Get All Events for Organizer (Upcoming)
export const getOrganizerUpcomingEvents = async (req, res, next) => {
  try {
    const currentDateTime = new Date();
    const { type, page = 1, limit = 200 } = req.query; // Extract query parameters with defaults

    // Normalize the type filter (case-insensitive)
    const normalizedType = type ? type.toLowerCase() : null;

    const query = {
      organizerId: req.user.id,
      $or: [
        { date: { $gt: currentDateTime.toISOString().split("T")[0] } }, // Future dates
        {
          date: currentDateTime.toISOString().split("T")[0], // Today
          startTime: { $gte: currentDateTime.toTimeString().split(" ")[0] },
        },
      ],
    };

    if (normalizedType) {
      query.type = normalizedType;
    }

    const totalItems = await Event.countDocuments(query); // Total number of matching events
    const events = await Event.find(
      query,
      "title description date startTime endTime type status thumbnail location"
    ) // Project minimal fields
      .sort({ date: 1, startTime: 1 }) // Sort by date and startTime
      .skip((page - 1) * limit) // Skip documents for pagination
      .limit(parseInt(limit)); // Limit the number of documents

    res.status(200).json({
      metadata: {
        totalItems,
        totalPages: Math.ceil(totalItems / limit),
        currentPage: parseInt(page),
        itemsPerPage: parseInt(limit),
      },
      events,
    });
  } catch (error) {
    console.error("Error fetching organizer's upcoming events:", error);
    next(error); // Pass error to centralized error handler
  }
};

// Get All Events for Organizer (completed)
export const getOrganizerCompletedEvents = async (req, res, next) => {
  try {
    const currentDateTime = new Date();
    const { type, page = 1, limit = 10 } = req.query; // Extract query parameters with defaults

    // Normalize the type filter (case-insensitive)
    const normalizedType = type ? type.toLowerCase() : null;

    const query = {
      organizerId: req.user.id,
      $or: [
        { date: { $lt: currentDateTime.toISOString().split("T")[0] } }, // Past dates
        {
          date: currentDateTime.toISOString().split("T")[0], // Today
          endTime: { $lt: currentDateTime.toTimeString().split(" ")[0] },
        },
      ],
    };

    if (normalizedType) {
      query.type = normalizedType;
    }

    await Event.updateMany(
      { ...query, status: { $ne: "completed" } }, // Only update if status is not already "completed"
      { $set: { status: "completed" } }
    );

    const totalItems = await Event.countDocuments(query); // Total number of matching events
    const events = await Event.find(
      query,
      "title date startTime endTime type status"
    ) // Project minimal fields
      .sort({ date: -1, endTime: -1 }) // Sort by date and endTime
      .skip((page - 1) * limit) // Skip documents for pagination
      .limit(parseInt(limit)); // Limit the number of documents

    res.status(200).json({
      metadata: {
        totalItems,
        totalPages: Math.ceil(totalItems / limit),
        currentPage: parseInt(page),
        itemsPerPage: parseInt(limit),
      },
      events,
    });
  } catch (error) {
    console.error("Error fetching organizer's completed events:", error);
    next(error); // Pass error to centralized error handler
  }
};


// Live Events
export const getOrganizerLiveEvents = async (req, res, next) => {
  try {
    const currentDateTime = new Date(); // Current date and time
    const currentDate = currentDateTime.toISOString().split("T")[0]; // Current date in YYYY-MM-DD
    const currentTime = currentDateTime.toTimeString().split(" ")[0]; // Current time in HH:MM:SS

    await Event.updateMany(
      {
        organizerId: req.user.id,
        status: { $ne: "live" }, // Exclude already "live" events
        date: currentDate, // Events happening today
        startTime: { $lte: currentTime }, // Start time has passed
        endTime: { $gte: currentTime }, // End time has not yet passed
      },
      { $set: { status: "live" } }
    );

    // Fetch live events created by the organizer
    const liveEvents = await Event.find(
      {
        organizerId: req.user.id,
        status: "live",
      },
      "title date startTime endTime type thumbnail location status description" // Select only necessary fields
    ).sort({ date: 1, startTime: 1 }); // Sort by date and startTime

    if (liveEvents.length === 0) {
      return res
        .status(200)
        .json({ message: "No live events found.", liveEvents: [] });
    }

    res.status(200).json({ liveEvents });
  } catch (error) {
    console.error("Error fetching live events for organizer:", error);
    next(error); // Pass the error to the centralized error handler
  }
};

// Get All Events for Participants (Upcoming)
export const getParticipantUpcomingEvents = async (req, res, next) => {
  try {
    const currentDateTime = new Date();
    const { type, page = 1, limit = 10 } = req.query; // Extract query parameters with defaults

    // Normalize the type filter (case-insensitive)
    const normalizedType = type ? type.toLowerCase() : null;

    const query = {
      $or: [
        { date: { $gt: currentDateTime.toISOString().split("T")[0] } }, // Future dates
        {
          date: currentDateTime.toISOString().split("T")[0], // Today
          startTime: { $gte: currentDateTime.toTimeString().split(" ")[0] },
        },
      ],
    };

    // Apply type filter if provided
    if (normalizedType) {
      query.type = normalizedType;
    }

    const totalItems = await Event.countDocuments(query); // Total number of matching events
    const events = await Event.find(
      query,
      "title date startTime endTime type status"
    ) // Project minimal fields
      .sort({ date: 1, startTime: 1 }) // Sort by date and startTime
      .skip((page - 1) * limit) // Skip documents for pagination
      .limit(parseInt(limit)); // Limit the number of documents

    res.status(200).json({
      metadata: {
        totalItems,
        totalPages: Math.ceil(totalItems / limit),
        currentPage: parseInt(page),
        itemsPerPage: parseInt(limit),
      },
      events,
    });
  } catch (error) {
    console.error("Error fetching participant's upcoming events:", error);
    next(error); // Pass error to centralized error handler
  }
};

// Get All Events for Participants (Completed)
export const getParticipantCompletedEvents = async (req, res, next) => {
  try {
    const currentDateTime = new Date();
    const { type, page = 1, limit = 10 } = req.query; // Extract query parameters with defaults

    // Normalize the type filter (case-insensitive)
    const normalizedType = type ? type.toLowerCase() : null;

    // Query to find completed events (past events or events ending today)
    const query = {
      $or: [
        { date: { $lt: currentDateTime.toISOString().split("T")[0] } }, // Past dates
        {
          date: currentDateTime.toISOString().split("T")[0], // Today
          endTime: { $lt: currentDateTime.toTimeString().split(" ")[0] }, // Time already passed
        },
      ],
    };

    // Apply type filter if provided
    if (normalizedType) {
      query.type = normalizedType;
    }

    // Update status to "completed" for matching events
    await Event.updateMany(
      { ...query, status: { $ne: "completed" } }, // Only update if status is not already "completed"
      { $set: { status: "completed" } }
    );

    // Fetch updated list of completed events
    const totalItems = await Event.countDocuments(query); // Total number of matching events
    const events = await Event.find(
      query,
      "title date startTime endTime type status" // Project only relevant fields
    )
      .sort({ date: -1, endTime: -1 }) // Sort by date and endTime
      .skip((page - 1) * limit) // Skip for pagination
      .limit(parseInt(limit)); // Limit the number of documents

    res.status(200).json({
      metadata: {
        totalItems,
        totalPages: Math.ceil(totalItems / limit),
        currentPage: parseInt(page),
        itemsPerPage: parseInt(limit),
      },
      events,
    });
  } catch (error) {
    console.error("Error fetching participant's completed events:", error);
    next(error); // Pass error to centralized error handler
  }
};

// Get All Events for Participants (Upcoming + Completed (rsvp'd))
export const getParticipantMyEvents = async (req, res, next) => {
  try {
    const currentDateTime = new Date();
    const { type } = req.query; // Extract the type filter from query parameters

    // Normalize the type filter (case-insensitive)
    const normalizedType = type ? type.toLowerCase() : null;

    // Fetch active RSVPs for the participant
    const myRSVPs = await RSVP.find({
      participantId: req.user.id,
      status: "active",
    }).populate("eventId");

    // Separate upcoming, live, and completed events
    const myUpcomingEvents = [];
    const myLiveEvents = [];
    const myCompletedEvents = [];

    myRSVPs.forEach((rsvp) => {
      const event = rsvp.eventId;
      if (event) {
        const eventStartDateTime = new Date(`${event.date}T${event.startTime}`);
        const eventEndDateTime = new Date(`${event.date}T${event.endTime}`);

        if (currentDateTime < eventStartDateTime) {
          if (!normalizedType || event.type === normalizedType) {
            myUpcomingEvents.push({
              id: event._id,
              title: event.title,
              date: event.date,
              startTime: event.startTime,
              endTime: event.endTime,
              type: event.type,
              status: "upcoming",
            });
          }
        } else if (
          currentDateTime >= eventStartDateTime &&
          currentDateTime <= eventEndDateTime
        ) {
          myLiveEvents.push({
            id: event._id,
            title: event.title,
            date: event.date,
            startTime: event.startTime,
            endTime: event.endTime,
            type: event.type,
            status: "live",
          });
        } else if (currentDateTime > eventEndDateTime) {
          if (!normalizedType || event.type === normalizedType) {
            myCompletedEvents.push({
              id: event._id,
              title: event.title,
              date: event.date,
              startTime: event.startTime,
              endTime: event.endTime,
              type: event.type,
              status: "completed",
            });
          }
        }
      }
    });

    res.status(200).json({
      myEvents: {
        upcoming: myUpcomingEvents,
        live: myLiveEvents,
        completed: myCompletedEvents,
      },
    });
  } catch (error) {
    console.error("Error fetching participant's events:", error);
    next(error); // Pass error to centralized error handler
  }
};

// Get Event Details (Jitsi Link Visibility for Participants)
export const getEventDetails = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Validate event ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid event ID." });
    }

    // Fetch the event and populate relevant details
    const event = await Event.findById(id)
      .populate("organizerId", "firstName lastName email") // Populate organizer details
      .populate("feedbackList.participantId", "firstName lastName") // Populate feedback participant names
      .exec();

    if (!event) {
      return res.status(404).json({ message: "Event not found." });
    }

    const currentDate = new Date();
    const currentDateString = currentDate.toISOString().split("T")[0];
    const currentTimeString = currentDate.toTimeString().split(" ")[0];

    // Count active RSVPs (registrations)
    const activeRSVPs = event.rsvpList.filter(
      (rsvp) => rsvp.status === "active"
    );
    const registrationCount = activeRSVPs.length;

    // Format feedback list with participant names
    const formattedFeedbackList = event.feedbackList
      .map((feedback) => {
        if (feedback.participantId) {
          return {
            participantName: `${feedback.participantId.firstName} ${feedback.participantId.lastName}`,
            feedback: feedback.feedback,
            createdAt: feedback.createdAt,
          };
        }
        return null; // Skip feedback entries without valid participantId
      })
      .filter((feedback) => feedback !== null);

    // Prepare the response object
    const response = event.toObject();
    response.registrationCount = registrationCount; // Add registration count to the response
    response.thumbnail = event.thumbnail
      ? event.thumbnail.replace("/upload/", "/upload/w_300,h_200,c_fill/")
      : "https://via.placeholder.com/300x200?text=No+Thumbnail";
    response.feedbackList = formattedFeedbackList; // Replace feedback list with formatted version

    if (req.user.role === "organizer") {
      // Fetch RSVP details for organizers
      const rsvpDetails = await RSVP.find({
        eventId: id,
        status: "active",
      }).populate("participantId", "firstName lastName email");
      response.rsvpList = rsvpDetails.map((rsvp) => ({
        participantName: `${rsvp.participantId.firstName} ${rsvp.participantId.lastName}`,
        email: rsvp.participantId.email,
        ticketUUID: rsvp.ticket || "N/A",
        joinedAt: rsvp.joinedAt.toLocaleString(),
      }));
    } else if (req.user.role === "participant") {
      // Control visibility of the Jitsi link for participants
      const participantRSVP = activeRSVPs.find(
        (rsvp) => rsvp.participantId.toString() === req.user.id
      );

      if (!participantRSVP) {
        // If participant has not RSVP'd
        response.location = "To get the link, you need to RSVP first.";
      } else if (
        event.type === "online" &&
        currentDate <
          new Date(event.date + "T" + event.startTime).getTime() -
            24 * 60 * 60 * 1000
      ) {
        // If RSVP'd but the event is more than 24 hours away
        response.location = "Link will be visible 24 hours before the event.";
      } else if (event.type === "online") {
        // If RSVP'd and within 24 hours of the event start time
        response.location = event.location;
      } else if (event.type === "in-person") {
        response.location =
          "Please refer to your ticket for event location details.";
      }

      // If the event is completed
      if (
        event.date < currentDateString ||
        (event.date === currentDateString && event.endTime < currentTimeString)
      ) {
        response.location = "This event has already ended.";
      }
    }

    res.status(200).json({ event: response });
  } catch (error) {
    console.error("Error fetching event details:", error);
    next(error); // Pass error to centralized error handler
  }
};

// Delete Event (Notify Participants)
export const deleteEvent = async (req, res, next) => {
  try {
    const { id } = req.params;

    // 1. Validate Event ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid event ID." });
    }

    // 2. Fetch the Event
    const event = await Event.findById(id);
    if (!event) {
      return res.status(404).json({ message: "Event not found." });
    }

    // 3. Verify Organizer Authorization
    if (event.organizerId.toString() !== req.user.id) {
      return res.status(403).json({
        message: "Access denied. Only the organizer can delete this event.",
      });
    }

    // 4. Prevent Deletion of Completed Events
    const currentTime = new Date();
    const eventEndDateTime = new Date(`${event.date}T${event.endTime}`);
    if (currentTime > eventEndDateTime) {
      return res
        .status(400)
        .json({ message: "Completed events cannot be deleted." });
    }

    // 5. Notify Participants of Event Cancellation
    if (event.rsvpList.length > 0) {
      for (const rsvpEntry of event.rsvpList) {
        const participant = await User.findById(rsvpEntry.participantId);
        if (participant) {
          // Send cancellation email
          setTimeout(() => {
            sendEmail(
              participant.email,
              `Event Cancellation: ${event.title}`,
              `<p>Dear ${participant.firstName},</p>
                             <p>We regret to inform you that the event <strong>${event.title}</strong>, scheduled for 
                             <strong>${event.date}</strong> from <strong>${event.startTime}</strong> to <strong>${event.endTime}</strong>, 
                             has been canceled by the organizer.</p>
                             <p>We apologize for the inconvenience caused.</p>`
            );
          }, 0);
        }
      }
    }

    // 6. Remove RSVPs Associated with the Event
    await RSVP.deleteMany({ eventId: id });

    // 7. Delete the Event
    await Event.findByIdAndDelete(id);

    res.status(200).json({
      message:
        "Event deleted successfully, and all RSVPs for the event have been removed.",
    });
  } catch (error) {
    console.error("Error deleting event:", error);
    next(error); // Pass error to centralized error handler
  }
};

// Search Events by Filters (Category and Type)
export const searchEvents = async (req, res, next) => {
  try {
    const { type } = req.query;

    // Initialize query object
    const query = {};

    // 1. Filter by Type
    if (type) {
      const validTypes = ["online", "in-person"];
      if (!validTypes.includes(type)) {
        return res.status(400).json({
          message:
            "Invalid event type. Allowed values are 'online' or 'in-person'.",
        });
      }
      query.type = type;
    }

    // 2. Fetch and Sort Events
    const events = await Event.find(query).sort({ date: 1, startTime: 1 }); // Sort by date, then startTime (ascending)

    res.status(200).json({ events });
  } catch (error) {
    console.error("Error searching events:", error);
    next(error); // Pass error to centralized error handler
  }
};

// For notification purpose
export const updateEvent = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, description, date, startTime, endTime, type, location } =
      req.body;

    // 1. Validate Event ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid event ID." });
    }

    // 2. Fetch the Event
    const event = await Event.findById(id);
    if (!event) {
      return res.status(404).json({ message: "Event not found." });
    }

    // 3. Ensure the Organizer is Authorized
    if (event.organizerId.toString() !== req.user.id) {
      return res.status(403).json({
        message: "Access denied. Only the organizer can update this event.",
      });
    }

    // 4. Prevent Updates to Live or Completed Events
    const currentDateTime = new Date();
    const eventStartDateTime = new Date(`${event.date}T${event.startTime}`);
    const eventEndDateTime = new Date(`${event.date}T${event.endTime}`);
    if (
      currentDateTime >= eventStartDateTime &&
      currentDateTime <= eventEndDateTime
    ) {
      return res
        .status(400)
        .json({ message: "Cannot update an event that is currently live." });
    }
    if (currentDateTime > eventEndDateTime) {
      return res
        .status(400)
        .json({ message: "Cannot update a completed event." });
    }

    // 5. Validate Event Type
    if (type) {
      const validTypes = ["online", "in-person"];
      if (!validTypes.includes(type)) {
        return res.status(400).json({
          message:
            "Invalid event type. Allowed values are 'online' or 'in-person'.",
        });
      }
    }

    // 6. Check for Conflicting Events
    if (date && startTime && endTime) {
      const conflict = await Event.findOne({
        organizerId: req.user.id,
        date,
        _id: { $ne: id }, // Exclude the current event
        $or: [
          { startTime: { $lt: endTime, $gte: startTime } },
          { endTime: { $gt: startTime, $lte: endTime } },
          { startTime: { $lte: startTime }, endTime: { $gte: endTime } },
        ],
      });
      if (conflict) {
        return res.status(400).json({
          message: `Conflict detected with another event (${conflict.title}) scheduled on ${conflict.date} from ${conflict.startTime} to ${conflict.endTime}.`,
        });
      }
    }

    // 7. Handle Thumbnail Updates
    if (req.file) {
      // Delete the old thumbnail from Cloudinary
      if (event.thumbnail && !event.thumbnail.includes("placeholder")) {
        const publicId = event.thumbnail.split("/").pop().split(".")[0];
        await cloudinary.v2.uploader.destroy(publicId);
      }

      // Assign the new thumbnail
      event.thumbnail = req.file.path.replace(
        "/upload/",
        "/upload/w_300,h_200,c_fill/"
      );
    }

    // 8. Update Event Details
    event.title = title || event.title;
    event.description = description || event.description;
    event.date = date || event.date;
    event.startTime = startTime || event.startTime;
    event.endTime = endTime || event.endTime;
    event.type = type || event.type;
    event.location = location || event.location;

    await event.save();

    // 9. Notify Participants About Updates
    const rsvps = await RSVP.find({ eventId: event._id, status: "active" });
    const participantEmails = [];
    for (const rsvp of rsvps) {
      try {
        const participant = await User.findById(rsvp.participantId);
        if (participant) {
          participantEmails.push(participant.email);
        }
      } catch (emailError) {
        console.error(
          `Failed to fetch participant (ID: ${rsvp.participantId}):`,
          emailError
        );
      }
    }

    if (participantEmails.length > 0) {
      // Batch notifications
      for (const rsvp of rsvps) {
        try {
          const participant = await User.findById(rsvp.participantId); // Fetch participant details
          if (participant) {
            await sendEmail(
              participant.email,
              `Update: Event "${event.title}" Details Changed`,
              `<p>Dear ${participant.firstName},</p>
                             <p>The event <strong>${event.title}</strong> has been updated. Please check the new details on the platform.</p>`
            );
            console.log(`Email sent to ${participant.email}`);
          }
        } catch (emailError) {
          console.error(
            `Failed to send email to participant (ID: ${rsvp.participantId}):`,
            emailError.message
          );
        }
      }
    }

    res.status(200).json({
      message: "Event updated successfully and participants notified.",
      event,
    });
  } catch (error) {
    console.error("Error updating event:", error);
    next(error); // Pass error to centralized error handler
  }
};
