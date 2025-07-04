"""
Hourly ETL: pull fresh metrics from Snowflake (or another warehouse)
and upsert into the local Postgres database.
"""
from datetime import datetime, timezone
from sqlalchemy.orm import Session

from app.core.celery_app import celery_app
from app.core.database import get_engine, Kpi  # assumes Kpi model
from app.services.snowflake_connector import query_kpis  # your own helper


@celery_app.task(name="app.services.kpi_etl.run")
def run() -> int:
    """
    Return the number of KPI rows written.
    """
    engine = get_engine()
    with Session(engine) as session:
        rows = query_kpis()  # List[dict]
        inserted = 0
        for r in rows:
            rec = (
                session.query(Kpi)
                .filter_by(company_id=r["company_id"], metric=r["metric"], as_of=r["as_of"])
                .first()
            )
            if not rec:
                rec = Kpi(
                    company_id=r["company_id"],
                    metric=r["metric"],
                    as_of=r["as_of"],
                )
                session.add(rec)

            rec.value = r["value"]
            rec.updated_at = datetime.now(timezone.utc)
            inserted += 1

        session.commit()
    return inserted
