import User from "../models/User.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

export const signup = async (req, res, next) => {
  try {
    const { firstName, lastName, email, password, role } = req.body;

    if (!firstName || !lastName || !email || !password || !role) {
      return res.status(400).json({ message: "All fields are required." });
    }

    if (!/^[a-zA-Z]+$/.test(firstName.trim())) {
      return res
        .status(400)
        .json({ message: "First name must contain only letters." });
    }
    if (!/^[a-zA-Z]+$/.test(lastName.trim())) {
      return res
        .status(400)
        .json({ message: "Last name must contain only letters." });
    }

    const emailTrimmed = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@gmail\.com$/; // Accept only emails ending with @gmail.com
    if (!emailRegex.test(emailTrimmed)) {
      return res
        .status(400)
        .json({ message: "Invalid email. Only Gmail addresses are allowed." });
    }

    const validRoles = ["organizer", "participant"];
    if (!validRoles.includes(role.toLowerCase())) {
      return res.status(400).json({
        message:
          "Invalid role. Role must be either 'organizer' or 'participant'.",
      });
    }

    const passwordRegex =
      /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({
        message:
          "Password must be at least 8 characters long, include an uppercase letter, a lowercase letter, a number, and a special character.",
      });
    }

    const existingUser = await User.findOne({ email: emailTrimmed });
    if (existingUser) {
      return res.status(409).json({ message: "Email is already registered." });
    }

    const newUser = new User({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: emailTrimmed, // Email already trimmed and lowercased
      password, // Pass the raw password; the model's pre-save hook will hash it
      role: role.toLowerCase(),
    });

    await newUser.save();

    const token = jwt.sign(
      { id: newUser._id, role: newUser.role },
      process.env.JWT_SECRET,
      {
        expiresIn: "1h",
      }
    );

    res
      .status(201)
      .json({
        message: "User registered successfully.",
        token,
        role: role,
        firstName: firstName,
        lastName: lastName,
      });
  } catch (error) {
    console.error("Error during signup:", error);
    next(error); // Pass error to centralized error handler
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      console.error("Email or password is missing.");
      return res
        .status(400)
        .json({ message: "Email and password are required." });
    }

    const user = await User.findOne({ email: email.trim().toLowerCase() });

    if (!user) {
      return res.status(404).json({
        message: "Cannot log in. User does not exist. Please sign up first.",
      });
    }

    const isPasswordValid = await bcrypt.compare(
      password.trim(),
      user.password
    );

    if (!isPasswordValid) {
      return res.status(400).json({ message: "Invalid email or password." });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      {
        expiresIn: "1h",
      }
    );
    res
      .status(200)
      .json({
        message: "Login successful",
        token,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
      });
  } catch (error) {
    console.error("Error during login:", error);
    next(error);
  }
};

export const logout = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: "Authentication token missing" });
    }

    try {
      jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      return res.status(401).json({ message: "Invalid or expired token" });
    }

    return res
      .status(200)
      .json({ success: true, message: "Logged out successfully" });
  } catch (error) {
    console.error("Error during logout:", error);
    next(error);
  }
};
