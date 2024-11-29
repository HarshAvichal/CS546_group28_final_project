import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const userSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: true,
        trim: true,
    },
    lastName: {
        type: String,
        required: true,
        trim: true,
    },
    email: {
        type: String,
        required: true,
        unique: true, // Ensures no duplicate emails in the database
        trim: true,
    },
    role: {
        type: String,
        enum: ['organizer', 'participant'], // Allowed roles
        required: true,
    },
    password: {
        type: String,
        required: true,
    },
}, {
    timestamps: true, // Automatically adds `createdAt` and `updatedAt` fields
});

// Pre-save hook to normalize email to lowercase
userSchema.pre('save', async function (next) {
    try {
        // Normalize email to lowercase
        if (this.isModified('email')) {
            this.email = this.email.toLowerCase();
        }

        // Hash password only if it's modified
        if (this.isModified('password')) {
            this.password = await bcrypt.hash(this.password, 10);
        }

        next(); // Proceed to save the document
    } catch (error) {
        next(error); // Pass errors to the next middleware
    }
});

export default mongoose.model('User', userSchema);
