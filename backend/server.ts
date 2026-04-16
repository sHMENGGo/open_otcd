import express from 'express'
import type { Request, Response } from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { Pool } from 'pg'; // PostgreSQL client
import { PrismaClient } from './generated/prisma/client'
import { prisma } from './lib/prisma'
import {getNews, parseThreatFilter, parseLimit, parsePage} from './services/news-service';
dotenv.config()

const app = express()

// Middleware
app.use(cors({origin:"http://localhost:3000", credentials: true})) // Allows React to talk to this API
app.use(cors()) // Allows React to talk to this API
app.use(express.json()) // Parses incoming JSON requests

app.get('/', (req, res) => {res.send('Hello! The backend is officially running.')})

// ==========================================================================================

const port = Number(process.env.PORT ?? 3001);

app.get('/api/news', async (req: Request, res: Response) => {
  const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';
  const threatFilter = parseThreatFilter(req.query.threat);
  const pageSize = parseLimit(req.query.pageSize ?? req.query.limit);
  const page = parsePage(req.query.page)

// Test the database connection
try {
    const result = await getNews({ search, threatFilter, page, pageSize });
    res.json(result);
  } catch (error) {
    console.error("Error fetching news:", error);
    res.status(500).json({ message: 'Failed to fetch scraped news.' });
  }
})

// ==========================================================================================

const test = async () => {
  try {
    const result = await prisma.latvia_entity_addresses.findFirst()

    console.log("✅ Prisma query successful:", result)
  } catch (err) {
    console.error("❌ Prisma query failed:", err)
  }
}
test()


