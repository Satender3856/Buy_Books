import express from 'express'
import dotenv from 'dotenv'
import mongoose from 'mongoose'
import bookrouter from './route/book.route.js'
import cors from 'cors'
import userRoute from "./route/user.route.js"

dotenv.config() // Load environment variables from .env file

const app = express()
const PORT = process.env.PORT || 4000;
const URI = process.env.MONGO_URI;

// Middleware for CORS
app.use(cors());

// Middleware for JSON parsing
app.use(express.json());

// Connect to MongoDB
mongoose.connect(URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log('Connected to MongoDB')
}).catch((error) => {
  console.error('Error connecting to MongoDB:', error)
  process.exit(1)
});

// Define routes API Calls
app.use("/api/book", bookrouter);
app.use("/api/user", userRoute);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ message: 'Server is running' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
  console.log(`API available at: http://localhost:${PORT}/api/user/signup`)
})
