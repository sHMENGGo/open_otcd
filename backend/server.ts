import express from 'express'; 
import type { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { Pool } from 'pg'; // PostgreSQL client

// Load environment variables (for your remote DB URL)
dotenv.config()

async function checkConnection() {
  try {
    const client = await pool.connect()
    console.log("✅ Database connection successful")
    
    // Optional: Run a simple query to be sure
    const res = await client.query('SELECT NOW()')
    console.log("Server time:", res.rows[0].now)

    client.release()
  } catch (err) {
    console.error("❌ Database connection failed:", err)
  } finally {
    await pool.end()
  }
} checkConnection()


const app = express()

// Middleware
app.use(cors()) // Allows React to talk to this API
app.use(express.json()) // Parses incoming JSON requests

app.get('/', (req, res) => {
  res.send('Hello! The backend is officially running.')
})

// Start Server
app.listen(3001, () => {
  console.log(`🚀 Server ready at http://localhost:3001`)
})

// Create a PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})


