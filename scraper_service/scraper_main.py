from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timezone
from email.utils import parsedate_to_datetime
import feedparser
import html
import os
import psycopg
import re
import requests
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

REQUEST_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/122.0.0.0 Safari/537.36"
    ),
    "Accept": "application/rss+xml, application/xml, text/xml;q=0.9, */*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
    "Cache-Control": "no-cache",
    "Pragma": "no-cache",
}
HTTP_SESSION = requests.Session()
HTTP_SESSION.headers.update(REQUEST_HEADERS)

DIRECT_THREAT_PATTERN = re.compile(
    r"\b("
    r"ransomware|phishing|malware|spyware|"
    r"data breach|breached|cyberattack|cyber attack|cybercrime|cyber crime|"
    r"hacker|hackers|hacked|hacking|"
    r"online scam|online scams|text scam|text scams|sms scam|sms scams|"
    r"gcash scam|gcash account|e-wallet scam|ewallet scam|"
    r"identity theft|credential theft|account takeover|"
    r"website defaced|defaced website|defacement|defaced|"
    r"dict breach|npc breach|data leak|leaked data"
    r")\b",
    re.IGNORECASE,
)

CYBER_CONTEXT_PATTERN = re.compile(
    r"\b("
    r"cyber|online|digital|account|accounts|wallet|e-wallet|ewallet|"
    r"gcash|maya|bank app|mobile banking|website|system|database|server|"
    r"phishing|ransomware|malware|hacker|hack|data|breach|otp"
    r")\b",
    re.IGNORECASE,
)

CYBER_INCIDENT_PATTERN = re.compile(
    r"\b("
    r"scam|scams|fraud|attack|attacks|breach|breached|hack|hacked|hacking|"
    r"leak|leaked|theft|stolen|defaced|defacement|arrest|arrested|charged|"
    r"warning|warns|alert|alerts"
    r")\b",
    re.IGNORECASE,
)


def fetch_feed(source_name, feed_url):
    try:
        response = HTTP_SESSION.get(feed_url, timeout=10)
        response.raise_for_status()
        return source_name, feedparser.parse(response.content)
    except requests.HTTPError as error:
        if error.response is None or error.response.status_code != 403:
            raise

        # Some feeds reject Requests but still work with feedparser's URL fetch path.
        feed = feedparser.parse(feed_url, request_headers=REQUEST_HEADERS)
        if feed.bozo and not getattr(feed, "entries", None):
            raise

        return source_name, feed


def is_threat_title(title):
    normalized_title = title.lower()

    if DIRECT_THREAT_PATTERN.search(normalized_title):
        return True

    return (
        CYBER_CONTEXT_PATTERN.search(normalized_title) is not None
        and CYBER_INCIDENT_PATTERN.search(normalized_title) is not None
    )


def normalize_published_date(article):
    parsed_time = (
        article.get("published_parsed")
        or article.get("updated_parsed")
        or article.get("date_parsed")
    )

    if parsed_time:
        return datetime(*parsed_time[:6], tzinfo=timezone.utc).isoformat()

    raw_date = article.get("date", article.get("pubDate", article.get("published")))
    if not raw_date:
        return None

    cleaned_date = html.unescape(raw_date).strip()

    try:
        parsed_datetime = parsedate_to_datetime(cleaned_date)
        if parsed_datetime.tzinfo is None:
            parsed_datetime = parsed_datetime.replace(tzinfo=timezone.utc)
        return parsed_datetime.astimezone(timezone.utc).isoformat()
    except (TypeError, ValueError):
        return cleaned_date


def normalize_existing_published_dates(conn):
    with conn.cursor() as cur:
        cur.execute(
            """
            SELECT link, published_date
            FROM scraper_service.news_article
            WHERE published_date IS NOT NULL
            """
        )
        rows = cur.fetchall()

        updates = []
        for link, published_date in rows:
            if published_date is None:
                continue

            published_value = str(published_date).strip()
            if not published_value or "T" in published_value:
                continue

            try:
                parsed_datetime = parsedate_to_datetime(published_value)
                if parsed_datetime.tzinfo is None:
                    parsed_datetime = parsed_datetime.replace(tzinfo=timezone.utc)
                normalized_value = parsed_datetime.astimezone(timezone.utc).isoformat()
            except (TypeError, ValueError):
                continue

            updates.append((normalized_value, link))

        if updates:
            cur.executemany(
                """
                UPDATE scraper_service.news_article
                SET published_date = %s
                WHERE link = %s
                """,
                updates,
            )
            print(f"Normalized {len(updates)} existing published_date values.")

def news_scraper():
    rss_feeds = {
        "GMA News": "https://data.gmanetwork.com/gno/rss/news/feed.xml",
        "Inquirer": "https://www.inquirer.net/fullfeed",
        "Philstar": "https://www.philstar.com/rss/headlines",
        "Manila Bulletin": "https://mb.com.ph/rss",
        "ABS-CBN News": "https://news.abs-cbn.com/feed",
        "BusinessWorld": "https://www.bworldonline.com/feed/",
        "Rappler": "https://www.rappler.com/rss",
        "PhilNews": "http://philnews.ph/rss",
        "Manila Times": "https://www.manilatimes.net/news/feed/",
        "TV 5": "https://interaksyon.philstar.com/rss"
    }
    
    DATABASE_URL = os.getenv("DATABASE_URL")

    print("Attempting to connect to the Raspberry Pi database...") 
    
    try:
        with psycopg.connect(DATABASE_URL) as conn:
            print("Successfully connected to the database!") 
            normalize_existing_published_dates(conn)
            
            with conn.cursor() as cur:
                with ThreadPoolExecutor(max_workers=min(5, len(rss_feeds))) as executor:
                    future_to_source = {
                        executor.submit(fetch_feed, source_name, feed_url): source_name
                        for source_name, feed_url in rss_feeds.items()
                    }

                    for future in as_completed(future_to_source):
                        source_name = future_to_source[future]

                        try:
                            fetched_source_name, feed = future.result()
                            print(f"Downloaded news from: {fetched_source_name}...")

                            if not feed.entries:
                                print(f"Warning: No entries found for feed {source_name}")
                                continue

                            articles_to_insert = []

                            for article in feed.entries:
                                link = html.unescape(article.link)

                                # Clean up the title and date
                                title_raw = html.unescape(article.title)
                                published = normalize_published_date(article)
                                is_threat = is_threat_title(title_raw)
                                articles_to_insert.append(
                                    (title_raw, link, published, is_threat, source_name)
                                )

                            if not articles_to_insert:
                                continue

                            # Batch inserts reduce database round-trips significantly.
                            cur.executemany(
                                """
                                INSERT INTO scraper_service.news_article (title, link, published_date, is_threat, source) 
                                VALUES (%s, %s, %s, %s, %s)
                                ON CONFLICT (link) DO NOTHING
                                """,
                                articles_to_insert,
                            )
                            print(
                                f"Prepared {len(articles_to_insert)} articles from {source_name} for insert."
                            )

                        except Exception as e:
                            conn.rollback()
                            print(f"Error processing {source_name}: {e}")
                        
            # Commit the transaction (save the data to the Pi)
            conn.commit()
            print("Database transaction committed successfully!")

    except Exception as db_error:
        print(f"CRITICAL DATABASE ERROR: {db_error}")

    print("Scraping cycle completely finished.")
