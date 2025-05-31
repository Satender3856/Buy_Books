import express from "express";
import { 
    signup, 
    login, 
    forgotPassword, 
    verifyResetToken, 
    resetPassword,
    testEndpoint
} from "../controller/user.controller.js";

const router = express.Router();

// Define the route for user signup and login
router.post("/signup", signup);
router.post("/login", login);

// Password reset routes
router.post("/forgot-password", forgotPassword);
router.get("/verify-reset-token", verifyResetToken);
router.post("/reset-password", resetPassword);

// Test endpoint
router.post("/test-endpoint", testEndpoint);

// Export the router
export default router;
