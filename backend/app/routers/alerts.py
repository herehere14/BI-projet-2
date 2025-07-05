# backend/app/routers/alerts.py
from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from ..core.database import get_db
from ..models.dto import Alert
from .auth import current_user_id         # <- same helper

router = APIRouter(prefix="/alerts", tags=["alerts"])


@router.get("/", response_model=list[Alert])
async def list_alerts(
    db: AsyncSession = Depends(get_db),
    user_id: UUID = Depends(current_user_id),
):
    
    """Return the most recent alerts.

    ``user_id`` is resolved via :func:`current_user_id` to ensure the caller is
    authenticated, but the current demo schema does not associate alerts with a
    user yet. The parameter is therefore unused for now.
    """

    res = await db.execute(
        text(
            """
            SELECT *
            FROM alerts
            ORDER BY ts DESC
            LIMIT 50
            """
        )

    )
    return [Alert(**row) for row in res.mappings()]
