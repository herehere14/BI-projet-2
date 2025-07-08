"""Helpers to read KPI data from Snowflake."""

import os
from typing import List, Dict

import pandas as pd
import snowflake.connector
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_engine
from app.models import Company


def fetch_table(dsn: str, query: str) -> pd.DataFrame:
    """Execute ``query`` using the given DSN and return a ``DataFrame``."""

    ctx = snowflake.connector.connect(**snowflake.connector.parse_account(dsn))
    try:
        cur = ctx.cursor().execute(query)
        return cur.fetch_pandas_all()
    finally:
        ctx.close()


def query_kpis() -> List[Dict]:
    """Return KPI rows from Snowflake as a list of dictionaries."""

    query = "SELECT company_id, metric, value, as_of FROM kpi"
    rows: List[Dict] = []

    def _load(dsn: str, company_id=None) -> None:
        df = fetch_table(dsn, query)
        for r in df.to_dict("records"):
            rows.append(
                {
                    "company_id": r.get("company_id", company_id),
                    "metric": r["metric"],
                    "value": r["value"],
                    "as_of": r["as_of"],
                }
            )

    env_dsn = os.getenv("SNOWFLAKE_DSN")
    if env_dsn:
        _load(env_dsn)
        return rows

    engine = get_engine()
    with Session(engine) as sess:
        for cid, dsn in sess.execute(
            select(Company.id, Company.snowflake_dsn).where(Company.snowflake_dsn.is_not(None))
        ):
            if dsn:
                _load(dsn, str(cid))

    return rows