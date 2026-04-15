import { pool } from '../lib/db';

type GetNewsParams = {
    search: string,
    threatFilter: 'all' | 'threat' | 'safe'
    page: number;
    pageSize: number;
}

export type ThreatFilter = 'all' | 'threat' | 'safe';

export const parseThreatFilter = (value: unknown): ThreatFilter => {
  if (value === 'threat') {
    return 'threat';
  }

  if (value === 'safe') {
    return 'safe';
  }

  return 'all';
};

export  const parseLimit = (value: unknown) => {
  const parsed = Number(value);

  if (Number.isNaN(parsed)) {
    return 50;
  }

  return Math.min(Math.max(parsed, 1), 100);
};

export const parsePage = (value: unknown) => {
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

export async function getNews(params: GetNewsParams,) {
    const {search, threatFilter, page, pageSize} = params;
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
    
        return{
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
        };
      } catch (error) {
        throw new Error('Failed to fetch scraped news.');
      }

}