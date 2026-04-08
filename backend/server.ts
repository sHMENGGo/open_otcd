import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import type { Request, Response } from 'express';
import { Pool } from 'pg';

dotenv.config();

const app = express();
const port = Number(process.env.PORT ?? 3001);
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

type ThreatFilter = 'all' | 'threat' | 'safe';

const parseThreatFilter = (value: unknown): ThreatFilter => {
  if (value === 'threat') {
    return 'threat';
  }

  if (value === 'safe') {
    return 'safe';
  }

  return 'all';
};

const parseLimit = (value: unknown) => {
  const parsed = Number(value);

  if (Number.isNaN(parsed)) {
    return 50;
  }

  return Math.min(Math.max(parsed, 1), 100);
};

const parsePage = (value: unknown) => {
  const parsed = Number(value);

  if (Number.isNaN(parsed)) {
    return 1;
  }

  return Math.max(parsed, 1);
};

const publishedDateOrderSql = `
  ORDER BY
    CASE
      WHEN published_date ~ '^\\d{4}-\\d{2}-\\d{2}T'
      THEN published_date::timestamptz
      WHEN published_date ~ '^[A-Za-z]{3},\\s+\\d{1,2}\\s+[A-Za-z]{3}\\s+\\d{4}\\s+\\d{2}:\\d{2}:\\d{2}'
      THEN published_date::timestamptz
      WHEN published_date ~ '^\\d{4}-\\d{2}-\\d{2}$'
      THEN published_date::timestamptz
      ELSE NULL
    END DESC NULLS LAST,
    published_date DESC NULLS LAST,
    title ASC
`;

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
  const offset = (page - 1) * pageSize;
  const whereClauses: string[] = [];
  const values: Array<string | boolean | number> = [];

  if (search) {
    values.push(`%${search}%`);
    whereClauses.push(`(title ILIKE $${values.length} OR source ILIKE $${values.length})`);
  }

  if (threatFilter === 'threat') {
    values.push(true);
    whereClauses.push(`is_threat = $${values.length}`);
  }

  if (threatFilter === 'safe') {
    values.push(false);
    whereClauses.push(`is_threat = $${values.length}`);
  }

  const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

  try {
    const filteredCountQuery = `
      SELECT COUNT(*)::int AS total_count
      FROM scraper_service.news_article
      ${whereSql}
    `;

    const [articlesResult, statsResult, marqueeResult, filteredCountResult] = await Promise.all([
      pool.query(
        `
          SELECT title, link, published_date, is_threat, source
          FROM scraper_service.news_article
          ${whereSql}
          ${publishedDateOrderSql}
          LIMIT $${values.length + 1}
          OFFSET $${values.length + 2}
        `,
        [...values, pageSize, offset],
      ),
      pool.query(`
        SELECT
          COUNT(*)::int AS total,
          COUNT(*) FILTER (WHERE is_threat)::int AS threat_count,
          COUNT(*) FILTER (WHERE NOT is_threat)::int AS safe_count,
          COUNT(DISTINCT source)::int AS source_count
        FROM scraper_service.news_article
      `),
      pool.query(
        `
          SELECT title, link, source
          FROM scraper_service.news_article
          WHERE is_threat = TRUE
          ${publishedDateOrderSql}
          LIMIT 10
        `,
      ),
      pool.query(filteredCountQuery, values),
    ]);

    const totalCount = filteredCountResult.rows[0]?.total_count ?? 0;
    const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

    res.json({
      items: articlesResult.rows,
      stats: {
        total: statsResult.rows[0]?.total ?? 0,
        threatCount: statsResult.rows[0]?.threat_count ?? 0,
        safeCount: statsResult.rows[0]?.safe_count ?? 0,
        sourceCount: statsResult.rows[0]?.source_count ?? 0,
      },
      totalCount,
      marqueeItems: marqueeResult.rows,
      pagination: {
        page,
        pageSize,
        totalPages,
      },
      filters: {
        search,
        threat: threatFilter,
        pageSize,
      },
    });
  } catch (error) {
    console.error('❌ Failed to fetch scraped news:', error);
    res.status(500).json({ message: 'Failed to fetch scraped news.' });
  }
});

app.listen(port, () => {
  console.log(`🚀 Server ready at http://localhost:${port}`);
});
