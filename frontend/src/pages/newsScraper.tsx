import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import NewsCard from '../component/news-card';

type NewsItem = {
  title: string;
  link: string;
  published_date: string | null;
  is_threat: boolean;
  source: string;
};

type MarqueeItem = {
  title: string;
  link: string;
  source: string;
};

type NewsResponse = {
  items: NewsItem[];
  stats: {
    total: number;
    threatCount: number;
    safeCount: number;
    sourceCount: number;
  };
  totalCount: number;
  marqueeItems: MarqueeItem[];
  pagination: {
    page: number;
    pageSize: number;
    totalPages: number;
  };
};

type ThreatFilter = 'all' | 'threat' | 'safe';

const API_BASE_URL = import.meta.env.DATABASE_URL ?? 'http://localhost:3001';
const ITEMS_PER_PAGE = 10;

const filterOptions: Array<{ label: string; value: ThreatFilter }> = [
  { label: 'All news', value: 'all' },
  { label: 'Threat only', value: 'threat' },
  { label: 'Safe only', value: 'safe' },
];

export default function NewsScraper() {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [threatFilter, setThreatFilter] = useState<ThreatFilter>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [data, setData] = useState<NewsResponse>({
    items: [],
    stats: {
      total: 0,
      threatCount: 0,
      safeCount: 0,
      sourceCount: 0,
    },
    totalCount: 0,
    marqueeItems: [],
    pagination: {
      page: 1,
      pageSize: ITEMS_PER_PAGE,
      totalPages: 1,
    },
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 300);

    return () => window.clearTimeout(timeoutId);
  }, [search]);

  useEffect(() => {
    const controller = new AbortController();

    const loadNews = async () => {
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({
          page: String(currentPage),
          pageSize: String(ITEMS_PER_PAGE),
        });

        if (debouncedSearch) {
          params.set('search', debouncedSearch);
        }

        if (threatFilter !== 'all') {
          params.set('threat', threatFilter);
        }

        const response = await fetch(`${API_BASE_URL}/api/news?${params.toString()}`, {
          signal: controller.signal,
        });

        if (!response.ok) {
          console.error("Error loading news feed:", response.statusText, response.status, response.body);
          throw new Error('Unable to load news feed.');
        }

        const result = (await response.json()) as NewsResponse;
        setData(result);
      } catch (fetchError) {
        if (fetchError instanceof DOMException && fetchError.name === 'AbortError') {
          return;
        }

        setError('Unable to load scraped news right now.');
      } finally {
        setLoading(false);
      }
    };

    void loadNews();

    return () => controller.abort();
  }, [currentPage, debouncedSearch, threatFilter]);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, threatFilter]);

  const marqueeText = useMemo(() => {
    if (data.marqueeItems.length === 0) {
      return ['No cyber threats'];
    }

    return data.marqueeItems.map(
      (item) => `${item.source}: ${item.title}`,
    );
  }, [data.marqueeItems]);

  const hasThreatHeadlines = data.marqueeItems.length > 0;
  const totalPages = data.pagination.totalPages;
  const pageStart = data.totalCount === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1;
  const pageEnd = Math.min(currentPage * ITEMS_PER_PAGE, data.totalCount);

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <div
        className={`sticky top-0 z-20 border-b backdrop-blur ${
          hasThreatHeadlines
            ? 'border-red-500/20 bg-red-950/80'
            : 'border-emerald-500/20 bg-emerald-950/80'
        }`}
      >
        <div className="mx-auto flex max-w-7xl items-center gap-4 overflow-hidden px-4 py-3">
          <span
            className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] ${
              hasThreatHeadlines
                ? 'bg-red-500/20 text-red-300'
                : 'bg-emerald-500/20 text-emerald-300'
            }`}
          >
            {hasThreatHeadlines ? 'Threat Watch' : 'Status Clear'}
          </span>
          <div className="overflow-hidden">
            <div
              className={`flex min-w-max gap-8 text-sm ${
                hasThreatHeadlines
                  ? 'marquee-track text-red-100'
                  : 'text-emerald-100'
              }`}
            >
              {[...marqueeText, ...marqueeText].map((headline, index) => (
                <span key={`${headline}-${index}`} className="whitespace-nowrap">
                  {headline}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <main className="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-8">
        <section className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-neutral-900/70 p-6 text-left shadow-2xl shadow-black/20 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <p className="text-sm uppercase tracking-[0.3em] text-cyan-300">News Intelligence</p>
            <h1 className="text-4xl font-bold text-white">Scraped News Monitor</h1>
            <p className="max-w-2xl text-sm text-neutral-400">
              News Scraper using RSS feeds from various sources such as GMA News, ABS-CBN, Philstar etc.., . 
            </p>
          </div>

          <div className="flex gap-3">
            <Link
              to="/home"
              className="rounded-full border border-white/10 px-4 py-2 text-sm font-medium text-neutral-200 transition hover:border-cyan-400 hover:text-cyan-200"
            >
              Back to home
            </Link>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatusCard label="Total articles" value={data.stats.total} accent="cyan" />
          <StatusCard label="Threat articles" value={data.stats.threatCount} accent="red" />
          <StatusCard label="Safe articles" value={data.stats.safeCount} accent="emerald" />
          <StatusCard label="Sources tracked" value={data.stats.sourceCount} accent="violet" />
        </section>

        <section className="rounded-3xl border border-white/10 bg-neutral-900/70 p-6 text-left shadow-xl shadow-black/20">
          <div className="mb-4 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-2xl font-semibold">Filters</h2>
              <p className="text-sm text-neutral-400">
                Search by title or source, then narrow the view by threat status.
              </p>
            </div>

            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              type="text"
              placeholder="Search title or source..."
              className="w-full rounded-full border border-white/10 bg-neutral-950 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400 lg:max-w-sm"
            />
          </div>

          <div className="flex flex-wrap gap-3">
            {filterOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setThreatFilter(option.value)}
                className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                  threatFilter === option.value
                    ? 'border-cyan-400 bg-cyan-500/10 text-cyan-200'
                    : 'border-white/10 bg-neutral-950 text-neutral-300 hover:border-cyan-400/50'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </section>

        {loading && <p className="text-sm text-neutral-400">Loading scraped news...</p>}
        {error && <p className="text-sm text-red-300">{error}</p>}

        {!loading && !error && (
          <>
            <section className="rounded-3xl border border-white/10 bg-neutral-900/70 p-6 text-left shadow-xl shadow-black/20">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h2 className="text-2xl font-semibold">Paginated Results</h2>
                  <p className="text-sm text-neutral-400">
                    Showing {pageStart}-{pageEnd} of {data.totalCount} filtered articles.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setCurrentPage((page) => Math.max(page - 1, 1))}
                    disabled={currentPage === 1}
                    className="rounded-full border border-white/10 px-4 py-2 text-sm font-medium text-neutral-200 transition hover:border-cyan-400 hover:text-cyan-200 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Previous
                  </button>
                  <span className="rounded-full border border-cyan-400/20 bg-cyan-500/10 px-4 py-2 text-sm font-medium text-cyan-200">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    type="button"
                    onClick={() => setCurrentPage((page) => Math.min(page + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="rounded-full border border-white/10 px-4 py-2 text-sm font-medium text-neutral-200 transition hover:border-cyan-400 hover:text-cyan-200 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              </div>
            </section>

            <section className="grid gap-5 lg:grid-cols-2 xl:grid-cols-3">
              {data.items.map((item) => (
                <NewsCard
                  key={item.link}
                  title={item.title}
                  source={item.source}
                  publishedDate={item.published_date}
                  isThreat={item.is_threat}
                  link={item.link}
                />
              ))}
            </section>

            {data.totalCount === 0 && (
              <div className="rounded-3xl border border-dashed border-white/10 bg-neutral-900/60 p-10 text-neutral-400">
                No articles matched the current filters.
              </div>
            )}

            <section className="rounded-3xl border border-white/10 bg-neutral-900/70 p-6 text-left shadow-xl shadow-black/20">
              <div className="mb-4 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h2 className="text-2xl font-semibold">News Table</h2>
                  <p className="text-sm text-neutral-400">
                  Tabular view for scanning source, date, and status quickly.
                  </p>
                </div>

                <div className="rounded-full border border-white/10 bg-neutral-950 px-4 py-2 text-sm text-neutral-300">
                  10 rows per page
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full border-separate border-spacing-y-2 text-sm">
                  <thead>
                    <tr className="text-left text-neutral-400">
                      <th className="px-4 py-2">Status</th>
                      <th className="px-4 py-2">Title</th>
                      <th className="px-4 py-2">Source</th>
                      <th className="px-4 py-2">Published</th>
                      <th className="px-4 py-2">Link</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.items.map((item) => (
                      <tr key={`row-${item.link}`} className="rounded-2xl bg-neutral-950">
                        <td className="rounded-l-2xl px-4 py-3">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${
                              item.is_threat
                                ? 'bg-red-500/20 text-red-300'
                                : 'bg-emerald-500/20 text-emerald-300'
                            }`}
                          >
                            {item.is_threat ? 'Threat' : 'Safe'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-white">{item.title}</td>
                        <td className="px-4 py-3 text-neutral-300">{item.source}</td>
                        <td className="px-4 py-3 text-neutral-400">{item.published_date ?? 'Unknown date'}</td>
                        <td className="rounded-r-2xl px-4 py-3">
                          <a
                            href={item.link}
                            target="_blank"
                            rel="noreferrer"
                            className="text-cyan-300 transition hover:text-cyan-200"
                          >
                            Open
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}

type StatusCardProps = {
  label: string;
  value: number;
  accent: 'cyan' | 'red' | 'emerald' | 'violet';
};

function StatusCard({ label, value, accent }: StatusCardProps) {
  const accentClassNames = {
    cyan: 'border-cyan-400/20 bg-cyan-500/10 text-cyan-200',
    red: 'border-red-400/20 bg-red-500/10 text-red-200',
    emerald: 'border-emerald-400/20 bg-emerald-500/10 text-emerald-200',
    violet: 'border-violet-400/20 bg-violet-500/10 text-violet-200',
  };

  return (
    <article className="rounded-2xl border border-white/10 bg-neutral-900/70 p-5 text-left shadow-lg shadow-black/20">
      <p className="mb-3 text-sm text-neutral-400">{label}</p>
      <div className={`inline-flex rounded-full border px-4 py-2 text-2xl font-bold ${accentClassNames[accent]}`}>
        {value}
      </div>
    </article>
  );
}
