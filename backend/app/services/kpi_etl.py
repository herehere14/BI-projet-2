"""
Hourly ETL: pull fresh metrics from Snowflake (or another warehouse)
and upsert into the local Postgres database.
"""
from sqlalchemy.orm import Session
from sqlalchemy import select, insert, update


from app.core.celery_app import celery_app
from app.core.database import get_engine
from app.models import Kpi 
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
            existing_id = session.execute(
                select(Kpi.id).filter_by(
                    company_id=r["company_id"], metric=r["metric"], as_of=r["as_of"]
                )
            ).scalar_one_or_none()

            if existing_id:
                session.execute(
                    update(Kpi)
                    .where(Kpi.id == existing_id)
                    .values(value=r["value"])
                )
            else:
                session.execute(
                    insert(Kpi.__table__).values(
                        company_id=r["company_id"],
                        metric=r["metric"],
                        value=r["value"],
                        as_of=r["as_of"],
                    )
                )
            inserted += 1

        session.commit()
    return inserted
