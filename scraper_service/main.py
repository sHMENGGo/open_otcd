import os
from contextlib import asynccontextmanager
from threading import Lock

from apscheduler.schedulers.background import BackgroundScheduler
from fastapi import BackgroundTasks, FastAPI

from scraper_main import news_scraper

SCRAPER_INTERVAL_MINUTES = int(os.getenv("SCRAPER_INTERVAL_MINUTES", "30"))
scrape_lock = Lock()
scheduler = BackgroundScheduler()


def run_scrape_job():
    if not scrape_lock.acquire(blocking=False):
        print("Scrape skipped because another run is already in progress.")
        return

    try:
        print("scraping..")
        news_scraper()
    finally:
        scrape_lock.release()


@asynccontextmanager
async def lifespan(app: FastAPI):
    scheduler.add_job(
        run_scrape_job,
        trigger="interval",
        minutes=SCRAPER_INTERVAL_MINUTES,
        id="news_scraper",
        max_instances=1,
        replace_existing=True,
    )
    scheduler.start()
    print(f"Scheduler started. Scraping every {SCRAPER_INTERVAL_MINUTES} minutes.")

    try:
        yield
    finally:
        scheduler.shutdown(wait=False)


app = FastAPI(title="News Scraper Microservices", lifespan=lifespan)

@app.get("/")
def health_check():
    return {
        "status": "healthy",
        "service": "scraper_service",
        "scrape_running": scrape_lock.locked(),
        "scrape_interval_minutes": SCRAPER_INTERVAL_MINUTES,
    }

@app.get("/scrape", status_code=202)
def run_scraper(background_tasks: BackgroundTasks):
    if scrape_lock.locked():
        return {"status": "busy", "message": "scrape already running"}

    background_tasks.add_task(run_scrape_job)
    return {"status": "accepted", "message": "scraping started in background"}

