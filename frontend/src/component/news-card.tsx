type NewsCardProps = {
  title: string;
  source: string;
  publishedDate: string | null;
  isThreat: boolean;
  link: string;
};

const formatPublishedDate = (publishedDate: string | null) => {
  if (!publishedDate) {
    return 'Unknown date';
  }

  const parsedDate = new Date(publishedDate);
  if (Number.isNaN(parsedDate.getTime())) {
    return publishedDate;
  }

  return parsedDate.toLocaleString();
};

export default function NewsCard({
  title,
  source,
  publishedDate,
  isThreat,
  link,
}: NewsCardProps) {
  return (
    <article className="rounded-2xl border border-white/10 bg-neutral-900 p-5 text-left shadow-lg shadow-black/20">
      <div className="mb-4 flex items-start justify-between gap-3">
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${
            isThreat
              ? 'bg-red-500/20 text-red-300'
              : 'bg-emerald-500/20 text-emerald-300'
          }`}
        >
          {isThreat ? 'Threat' : 'Monitored'}
        </span>
        <span className="text-xs text-neutral-400">{formatPublishedDate(publishedDate)}</span>
      </div>

      <h2 className="mb-3 text-xl font-semibold text-white">{title}</h2>
      <p className="mb-4 text-sm text-neutral-400">Source: {source}</p>

      <a
        href={link}
        target="_blank"
        rel="noreferrer"
        className="inline-flex rounded-full border border-cyan-400/40 px-4 py-2 text-sm font-medium text-cyan-300 transition hover:border-cyan-300 hover:text-cyan-200"
      >
        Read article
      </a>
    </article>
  );
}
