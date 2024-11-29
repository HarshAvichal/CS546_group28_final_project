import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Create a reusable transporter object using the default SMTP transport
const transporter = nodemailer.createTransport({
    service: 'gmail', // Using Gmail
    auth: {
        user: process.env.EMAIL_USER, // Your Gmail address
        pass: process.env.EMAIL_PASS  // Your Gmail app password
    }
});

// Function to send emails
export const sendEmail = async (to, subject, htmlContent) => {
    try {
        const mailOptions = {
            from: `"EventEase Team" <${process.env.EMAIL_USER}>`, // Sender address
            to, // Recipient address
            subject, // Subject line
            html: htmlContent // Email content in HTML
        };

        // Send email
        await transporter.sendMail(mailOptions);

        console.log(`Email sent to ${to}`);
        return { success: true, message: "Email sent successfully" };
    } catch (error) {
        console.error("Error sending email:", error);
        return { success: false, message: "Error sending email", error };
    }
};
