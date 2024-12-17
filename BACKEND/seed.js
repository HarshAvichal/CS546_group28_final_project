import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';
import Event from './models/Event.js';
import RSVP from './models/Rsvp.js';

dotenv.config();

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const seedDatabase = async () => {
  try {
    // Clear existing data
    await User.deleteMany({});
    await Event.deleteMany({});
    await RSVP.deleteMany({});

    console.log('Database cleared.');

    // Users
    const users = await User.insertMany([
      {
        firstName: 'Harsh',
        lastName: 'Avichal',
        email: 'harshavichal@gmail.com',
        password: "$2b$10$mcdnqO3/FhrhZRRWU5LaxuRJzv.CgJTd9EVsM9HUyg5xbFlwvF/.G", // Replace with actual hashed password
        role: 'organizer',
      },
      {
            firstName: 'Rishi',
            lastName: 'patel',
            email: 'rishipatel@gmail.com',
            password: "$2b$10$aoPqokbjvx35h45PiU/ElOQBkE.JGxij96Lxz2aPgMLCqeB/mEFsS", // Replace with actual hashed password
            role: 'organizer',
      },
      {
        firstName: 'Dhwani',
        lastName: 'Rao',
        email: 'dhwanirao@gmail.com',
        password: "$2b$10$iIhbSkq9zyhDi8kOgAhYxeHPrCEWLn7oWmMVXCae76SBNJEJeg4bm", // Replace with actual hashed password
        role: 'participant',
      },
      {
        firstName: 'Hruthik',
        lastName: 'Lokesh',
        email: 'hruthiklokesh@gmail.com',
        password: "$2b$10$HjBP0dpGWMFGhOZpLn9mYOreE9QF.JRXS24LSP/RNF1i/0/0IyRS.", // Replace with actual hashed password
        role: 'participant',
      },
    ]);

    console.log('Users seeded.');

    // Events
    const events = await Event.insertMany([
      {
        title: 'Tech Meetup 2024',
        description: 'A meetup for tech enthusiasts to network and share ideas.',
        type: 'online',
        date: new Date('2024-12-20'),
        startTime: '14:00',
        endTime: '16:00',
        location: 'https://meet.jit.si/tech-meetup-2024', // Jitsi link
        thumbnail: 'uploads/default-thumbnail.jpeg', // Default thumbnail path
        organizer: users[0]._id,
      },
      {
        title: 'Hackathon 2024',
        description: 'A 48-hour hackathon for developers to showcase their skills.',
        type: 'in-person',
        date: new Date('2024-12-25'),
        startTime: '09:00',
        endTime: '17:00',
        location: '123 Event Street, Tech City',
        thumbnail: 'uploads/default-thumbnail.jpeg', // Default thumbnail path
        organizer: users[1]._id,
      },
    ]);

    console.log('Events seeded.');

    // RSVPs
    const rsvps = await RSVP.insertMany([
      {
        event: events[0]._id,
        participant: users[2]._id,
        ticket: 'RSVP-123456',
      },
      {
        event: events[1]._id,
        participant: users[3]._id,
        ticket: 'RSVP-789101',
      },
    ]);

    console.log('RSVPs seeded.');

    console.log('Database seeding completed successfully.');
    mongoose.connection.close();
  } catch (error) {
    console.error('Error seeding database:', error);
    mongoose.connection.close();
    process.exit(1);
  }
};

seedDatabase();
