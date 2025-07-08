from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
import io
import pandas as pd
import datetime as dt
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from ..core.database import get_db
from ..models.company import Company
from ..models.kpi import Kpi, KpiType
from .auth import current_user_id

router = APIRouter(prefix="/ingest", tags=["ingest"])

@router.post("/file")
async def ingest_file(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(current_user_id),
):
    ext = file.filename.rsplit(".", 1)[-1].lower()
    raw = await file.read()
    if ext in ("csv", "txt"):
        df = pd.read_csv(io.BytesIO(raw))
    elif ext in ("parquet", "pq"):
        df = pd.read_parquet(io.BytesIO(raw))
    elif ext in ("xlsx", "xls"):
        df = pd.read_excel(io.BytesIO(raw))
    else:
        raise HTTPException(415, "Unsupported filetype")

    # Very simple mapping: expect KPI columns
    required = {"label", "value"}
    if not required.issubset(df.columns):
        raise HTTPException(400, f"File must contain columns: {required}")

    company_id = await db.scalar(
        select(Company.id).where(Company.owner_id == user_id)
    )
    if not company_id:
        raise HTTPException(status_code=404, detail="Company not found")

    now = dt.datetime.utcnow()
    for _, row in df.iterrows():
        await db.execute(
            Kpi.__table__.insert().values(
                company_id=company_id,
                metric=row.label,
                value=row.value,
                as_of=now,
                type=KpiType.OPERATIONAL,
            )
        )
    await db.commit()
    return {"rows": len(df)}
