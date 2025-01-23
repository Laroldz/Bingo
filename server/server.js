import express from 'express';
import cors from 'cors';
import privateRoutes from './routes/privateRoutes.js';
import dotenv from 'dotenv';

// ESM requires a workaround to use __dirname
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config(); // Load environment variables from .env file

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Mount API Routes
app.use(privateRoutes);

// Serve the React app (production build) from client/dist
app.use(express.static(path.join(__dirname, '../client/dist')));

// Catch-all route for the React SPA
// If no API routes match, serve index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/dist', 'index.html'));
});

// Start Server
const PORT = process.env.PORT || 3000;  // Use the PORT environment variable or default to 3000
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
