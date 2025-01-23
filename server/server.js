// server.js
import express from 'express';
import cors from 'cors';
import privateRoutes from './routes/privateRoutes.js';
import dotenv from 'dotenv';

dotenv.config(); // Load environment variables from .env file

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Mount Routes
app.use(privateRoutes); // Routes are mounted at the root path

// Catch-all for undefined routes
app.use((req, res, next) => {
  res.status(404).send('Route not found');
});

// Start Server
const PORT = process.env.PORT || 3000;  // Use the PORT environment variable or default to 3000
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});