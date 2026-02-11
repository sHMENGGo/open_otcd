import express from 'express'; 
import type { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Load environment variables (for your remote DB URL)
dotenv.config();

const app = express();

// Middleware
app.use(cors()); // Allows React to talk to this API
app.use(express.json()); // Parses incoming JSON requests

app.get('/', (req, res) => {
  res.send('Hello! The backend is officially running.');
});

// Start Server
app.listen(3001, () => {
  console.log(`🚀 Server ready at http://localhost:3001`);
});

