import User from "../model/user.model.js";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

// User signup
export const signup = async (req, res) => {
    try {
        const { fullname, email_id, password } = req.body;
        
        if (!fullname || !email_id || !password) {
            return res.status(400).json({ message: "All fields are required" });
        }

        const existingUser = await User.findOne({ email_id });
        if (existingUser) {
            return res.status(400).json({ message: "User already exists" });
        }

        const hashpassword = await bcrypt.hash(password, 10);
        const createdUser = new User({
            fullname,
            email_id,
            password: hashpassword,
        });

        await createdUser.save();

        // Return user data in the same format as login endpoint
        res.status(201).json({
            message: "User created successfully",
            user: {
                _id: createdUser._id,
                fullname: createdUser.fullname,
                email_id: createdUser.email_id
            }
        });
    } catch (error) {
        console.error("Error:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
};

// User login
export const login = async (req, res) => {
    try {
        const { email_id, password } = req.body;
        
        if (!email_id || !password) {
            return res.status(400).json({ message: "All fields are required" });
        }

        const user = await User.findOne({ email_id });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        res.status(200).json({
            message: "Login successful",
            user: {
                _id: user._id,
                fullname: user.fullname,
                email_id: user.email_id
            }
        });
    } catch (error) {
        console.error("Error:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
};

// Create a transporter for sending emails
const transporter = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    }
});

// Store reset tokens temporarily (in production, use a database)
const passwordResetTokens = new Map();

// Forgot password
export const forgotPassword = async (req, res) => {
    try {
        const { email_id } = req.body;
        
        if (!email_id) {
            return res.status(400).json({ message: "Email is required" });
        }

        const user = await User.findOne({ email_id });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Generate a reset token
        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetTokenExpiry = Date.now() + 3600000; // 1 hour from now

        // Store the token (in production, save this to the database)
        passwordResetTokens.set(email_id, {
            token: resetToken,
            expiry: resetTokenExpiry
        });

        // Create reset URL
        const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}&email=${email_id}`;

        // Send email
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email_id,
            subject: 'Password Reset Request',
            html: `
                <h1>Password Reset</h1>
                <p>You requested a password reset. Click the link below to reset your password:</p>
                <a href="${resetUrl}" style="display: inline-block; padding: 10px 20px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px;">Reset Password</a>
                <p>This link will expire in 1 hour.</p>
                <p>If you didn't request this, please ignore this email.</p>
            `
        };

        await transporter.sendMail(mailOptions);

        res.status(200).json({ 
            success: true, 
            message: "Password reset link sent to your email",
            // Include the reset URL in development for testing
            ...(process.env.NODE_ENV === 'development' && { resetUrl })
        });
    } catch (error) {
        console.error("Error:", error.message);
        res.status(500).json({ message: "Failed to send reset email" });
    }
};

// Verify reset token
export const verifyResetToken = (req, res) => {
    try {
        const { token, email } = req.query;
        
        if (!token || !email) {
            return res.status(400).json({ message: "Token and email are required" });
        }

        const resetData = passwordResetTokens.get(email);
        
        if (!resetData || resetData.token !== token) {
            return res.status(400).json({ valid: false, message: "Invalid token" });
        }

        if (Date.now() > resetData.expiry) {
            passwordResetTokens.delete(email);
            return res.status(400).json({ valid: false, message: "Token has expired" });
        }

        res.status(200).json({ valid: true });
    } catch (error) {
        console.error("Error:", error.message);
        res.status(500).json({ message: "Error verifying token" });
    }
};

// Reset password
export const resetPassword = async (req, res) => {
    try {
        const { email_id, token, password } = req.body;
        
        if (!email_id || !token || !password) {
            return res.status(400).json({ message: "All fields are required" });
        }

        const resetData = passwordResetTokens.get(email_id);
        
        if (!resetData || resetData.token !== token) {
            return res.status(400).json({ message: "Invalid token" });
        }

        if (Date.now() > resetData.expiry) {
            passwordResetTokens.delete(email_id);
            return res.status(400).json({ message: "Token has expired" });
        }

        const user = await User.findOne({ email_id });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Hash the new password
        const hashpassword = await bcrypt.hash(password, 10);
        
        // Update user's password
        user.password = hashpassword;
        await user.save();

        // Remove the used token
        passwordResetTokens.delete(email_id);

        res.status(200).json({ success: true, message: "Password has been reset successfully" });
    } catch (error) {
        console.error("Error:", error.message);
        res.status(500).json({ message: "Failed to reset password" });
    }
};

// Test endpoint for debugging
export const testEndpoint = (req, res) => {
    try {
        console.log("Test endpoint called with:", req.body);
        res.status(200).json({ 
            success: true, 
            message: "Test endpoint working", 
            receivedData: req.body 
        });
    } catch (error) {
        console.error("Test endpoint error:", error);
        res.status(500).json({ message: "Test endpoint error" });
    }
};
