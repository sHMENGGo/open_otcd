import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import type { Request, Response } from 'express';
import {getNews, parseThreatFilter, parseLimit, parsePage} from './services/news-service';

dotenv.config();

const app = express();
const port = Number(process.env.PORT ?? 3001);

app.use(cors());
app.use(express.json());

app.get('/', (_req: Request, res: Response) => {
  res.send('Hello! The backend is officially running.');
});

app.get('/api/news', async (req: Request, res: Response) => {
  const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';
  const threatFilter = parseThreatFilter(req.query.threat);
  const pageSize = parseLimit(req.query.pageSize ?? req.query.limit);
  const page = parsePage(req.query.page);

  try {
    const result = await getNews({ search, threatFilter, page, pageSize });
    res.json(result);
  } catch (error) {
    console.error("Error fetching news:", error);
    res.status(500).json({ message: 'Failed to fetch scraped news.' });
  }
});

app.listen(port, () => {
  console.log(`🚀 Server ready at http://localhost:${port}`);
});
