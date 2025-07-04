from celery import Celery
from celery.schedules import crontab
from kombu import Queue
from app.core.settings import settings  # expects REDIS_URL in .env

celery_app = Celery(
    "bi-project",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL,
    include=[
        "app.services.kpi_etl",
        "app.workers.internal_analyser",
        "app.workers.external_fetcher",
    ],
)

# ──────────────── Queues ────────────────
celery_app.conf.task_queues = (
    Queue("default"),
    Queue("internal_ai"),
    Queue("external_news"),
)
celery_app.conf.task_default_queue = "default"

# ─────────────── Beat schedule ───────────────
celery_app.conf.beat_schedule = {
    "load-kpis-every-hour": {
        "task": "app.services.kpi_etl.run",
        "schedule": crontab(minute=0, hour="*"),
        "options": {"queue": "default"},
    },
    "fetch-external-news": {
        "task": "app.workers.external_fetcher.fetch",
        "schedule": 900,  # every 15 min
        "options": {"queue": "external_news"},
    },
}

celery_app.conf.timezone = "UTC"
