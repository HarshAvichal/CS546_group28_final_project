import { v2 as cloudinary } from "cloudinary";
import multer from "multer";
import dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

// Configure Cloudinary with environment variables
cloudinary.config({
  cloud_name: "dd8wpotys",
  api_key: "486234119426538",
  api_secret: "5A3iGsBrw8X9jkOdDWCSwdVsQjU",
});

export default cloudinary;
