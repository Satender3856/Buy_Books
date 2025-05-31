import express from 'express';
import { getBooks } from '../controller/book.controller.js';

const router = express.Router();

// Define the route for getting books
router.get("/", getBooks);

// Export the router
export default router;
