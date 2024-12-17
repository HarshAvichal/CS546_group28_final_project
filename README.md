# Project title
EventEase

## Description
The easy,seamleass and powerfull space where individuals and event planners get along to effortlessly organize, manage and execute successful events.
Even if its small gathering or large scale coorporate conference, the goal is to streamline the entire event planning process smoothly from every aspect of the event- from initial planning to final execution.

## Features
### For Organizers
• Event Creation: Organizers can create and edit events with details like title, description, date,
time, type (online/in-person), and location.
• Dashboard: View and manage all upcoming, live, and completed events.
• Event Monitoring: Track RSVPs and participant engagement via attendee lists.
• Video Call Integration: Automatically generate Jitsi links for virtual events.
### For Participants
• Event Discovery: Browse and search for upcoming events using the type filter.
• RSVP & Registration: Register for events and receive reminders via notifications.
• Event Access: Get access to video call links for virtual events 24 hours before the event.

## Installation Instructions
### Prerequisites
NodeJS and npm installed.
MongoDB installed running locally on mongo://127.0.0.1:27017
Install all the dependencies using 'npm i'.

### steps
clone repository: git clone https://github.com/HarshAvichal/CS546_group28_final_project.git
                  cd CS546_group28_final_project/BACKEND
Install dependencies: 'npm i'
Set up environment variables: Create a .env file in the root directory and add the following
                              DB_URI mongodb://localhost:27017/EventEase
                              JWT_SECRET = Xd6$*2m82!@3fAS@&98S^df234lk90^FSdff34
                              PORT = 3000
                              EMAIL_USER = eventease.team@gmail.com
                              EMAIL_PASS = Event@123
                              CLOUDINARY_CLOUD_NAME = da6kpwqmh
                              CLOUDINARY_API_KEY = 729469184148217
                              CLOUDINARY_API_SECRET = 2HA4kd183Gk8ock0HJDFnt4g9ioc

Run the seed file: node seed.js
Start the server: npm run dev
production mode: npm start 
Visit application on: http://localhost:3000

## API Documentation
### Authentication Routes:
• POST /api/v1/auth/signup: Organizer/Participant sign-up.
• POST /api/v1/auth/login: Organizer/Participant login.
### Event Routes:
• GET /api/v1/events/organizer/upcoming: Fetch upcoming events for organizers.
• GET /api/v1/events/participant/upcoming: Fetch upcoming events for participants.
• POST /api/v1/events/create: Create a new event.
• PUT /api/v1/events/:id: Update event details.
• DELETE /api/v1/events/:id: Delete an event.
### RSVP & Feedback Routes:
• POST /api/v1/events/:eventId/rsvp: RSVP to an event.
• PUT /api/v1/events/:eventId/cancel-rsvp: Cancel RSVP.
• POST /api/v1/events/:eventId/feedback: Submit event feedback.
### General Routes:
• GET /api/v1/events/details/:id: View event details, RSVP list, and feedback.
• GET /api/v1/events/search: Search for events.

## Environment variables:
Ensure the following are configured in your .env file:
MONGO_URI: MongoDB connection string
JWT_SECRET: Secret key for JWT authentication
PORT: Port to run the server(default:3000)
EMAIL_USER: Email service username
EMAIL_PASS: Email service password
CLOUDINARY_CLOUD_NAME: cloudinary account cloud name
CLOUDINARY_API_KEY: cloudianry API key

## Additional notes
MongoDB: The project assumes a local MongoDB instance running at mongo://127.0.0.1:27017/EventEase.
Uploads Folder: The uploads/ folder contains a defaultthumbnail.jpeg placeholder image for events.
