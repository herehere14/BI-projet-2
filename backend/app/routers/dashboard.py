from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect, status, Query, HTTPException
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from sqlalchemy import and_, func
from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta, timezone
import logging

from app.core.database import get_db
from app.models import Kpi, News, Company
from app.services.ai import ask_ai_sync, get_task_status
from app.utils.broadcaster import manager, redis_task

# Configure logging
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/dashboard", tags=["dashboard"])

# ─────────── REST endpoints ───────────

@router.get("/kpis/latest")
def latest_kpis(
    company_id: int,
    limit: Optional[int] = Query(50, description="Maximum number of KPIs to return"),
    metrics: Optional[List[str]] = Query(None, description="Filter by specific metric names"),
    db: Session = Depends(get_db)
):
    """
    Get latest KPI values for a company.
    
    Enhanced with:
    - Metric filtering
    - Configurable limit
    - Value change calculation
    - Data validation
    """
    # Validate company exists
    company = db.query(Company).filter_by(id=company_id).first()
    if not company:
        raise HTTPException(status_code=404, detail=f"Company {company_id} not found")
    
    # Build query
    query = db.query(Kpi).filter_by(company_id=company_id)
    
    # Apply metric filter if provided
    if metrics:
        query = query.filter(Kpi.metric.in_(metrics))
    
    # Get latest KPIs
    latest_kpis = (
        query
        .order_by(Kpi.as_of.desc())
        .limit(limit)
        .all()
    )
    
    # Get previous values for change calculation
    kpi_data = []
    for kpi in latest_kpis:
        # Find previous value for this metric
        previous = (
            db.query(Kpi)
            .filter(
                and_(
                    Kpi.company_id == company_id,
                    Kpi.metric == kpi.metric,
                    Kpi.as_of < kpi.as_of
                )
            )
            .order_by(Kpi.as_of.desc())
            .first()
        )
        
        kpi_info = {
            "metric": kpi.metric,
            "value": kpi.value,
            "as_of": kpi.as_of.isoformat() if hasattr(kpi.as_of, 'isoformat') else str(kpi.as_of),
            "data_type": _infer_data_type(kpi.value)
        }
        
        # Calculate change if previous value exists
        if previous and isinstance(kpi.value, (int, float)) and isinstance(previous.value, (int, float)):
            if previous.value != 0:
                change_pct = ((kpi.value - previous.value) / previous.value) * 100
                kpi_info["change_percentage"] = round(change_pct, 2)
                kpi_info["change_value"] = kpi.value - previous.value
                kpi_info["previous_value"] = previous.value
                kpi_info["previous_as_of"] = previous.as_of.isoformat() if hasattr(previous.as_of, 'isoformat') else str(previous.as_of)
        
        kpi_data.append(kpi_info)
    
    return {
        "company_id": company_id,
        "company_name": company.name,
        "kpi_count": len(kpi_data),
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "kpis": kpi_data
    }


@router.post("/ai/recommendation", status_code=status.HTTP_202_ACCEPTED)
def ai_recommendation(
    company_id: int,
    force_refresh: bool = Query(False, description="Force new analysis even if recent one exists"),
    db: Session = Depends(get_db)
):
    """
    Request AI-powered business recommendations.
    
    Enhanced with:
    - Force refresh option
    - Task status in response
    - Company validation
    - Rate limiting info
    """
    # Validate company exists
    company = db.query(Company).filter_by(id=company_id).first()
    if not company:
        raise HTTPException(status_code=404, detail=f"Company {company_id} not found")
    
    # Check current task status
    current_status = get_task_status(company_id)
    
    # If there's an active task and not forcing refresh, return existing task
    if current_status and current_status.get("status") in ["pending", "processing"] and not force_refresh:
        return {
            "task_id": current_status.get("task_id"),
            "status": current_status.get("status"),
            "message": "Analysis already in progress",
            "created_at": current_status.get("created_at"),
            "company_name": company.name
        }
    
    # Start new analysis
    task_id = ask_ai_sync(company_id)
    
    # Check if it's an error task
    if task_id.startswith("error-"):
        raise HTTPException(
            status_code=503,
            detail="AI service temporarily unavailable. Please try again later."
        )
    
    return {
        "task_id": task_id,
        "status": "accepted",
        "message": "Analysis started successfully",
        "company_id": company_id,
        "company_name": company.name,
        "estimated_completion": "15-30 seconds",
        "websocket_channel": f"/dashboard/ws"
    }


@router.get("/ai/status/{company_id}")
def get_ai_status(company_id: int, db: Session = Depends(get_db)):
    """
    Check the status of an AI analysis task.
    
    New endpoint for polling task status without WebSocket.
    """
    status_info = get_task_status(company_id)
    
    if not status_info:
        return {
            "company_id": company_id,
            "status": "not_found",
            "message": "No active or recent analysis found"
        }
    
    return {
        "company_id": company_id,
        "task_id": status_info.get("task_id"),
        "status": status_info.get("status"),
        "created_at": status_info.get("created_at"),
        "updated_at": status_info.get("updated_at"),
        "error_message": status_info.get("error_message")
    }


@router.get("/news")
def latest_news(
    limit: int = Query(20, ge=1, le=100, description="Number of news items to return"),
    source: Optional[str] = Query(None, description="Filter by news source"),
    hours: Optional[int] = Query(None, ge=1, le=168, description="Get news from last N hours"),
    search: Optional[str] = Query(None, description="Search in title and description"),
    impact_level: Optional[str] = Query(None, regex="^(critical|high|medium)$", description="Filter by impact level"),
    db: Session = Depends(get_db)
):
    """
    Get latest business intelligence and news.
    
    Enhanced with:
    - Source filtering
    - Time-based filtering
    - Search functionality
    - Impact level filtering
    - Pagination support
    """
    query = db.query(News)
    
    # Apply filters
    if source:
        query = query.filter(News.source == source)
    
    if hours:
        cutoff_time = datetime.now(timezone.utc) - timedelta(hours=hours)
        query = query.filter(News.published_at >= cutoff_time)
    
    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            db.or_(
                News.title.ilike(search_pattern),
                News.description.ilike(search_pattern)
            )
        )
    
    if impact_level:
        # Filter by impact level in title (for AI-generated news)
        if impact_level == "critical":
            query = query.filter(News.title.contains("[CRITICAL]"))
        elif impact_level == "high":
            query = query.filter(News.title.contains("[HIGH]"))
        elif impact_level == "medium":
            query = query.filter(News.title.contains("[MEDIUM]"))
    
    # Get total count before limiting
    total_count = query.count()
    
    # Apply ordering and limit
    news_items = query.order_by(News.published_at.desc()).limit(limit).all()
    
    # Format response
    formatted_news = []
    for n in news_items:
        news_data = {
            "id": n.id,
            "title": n.title,
            "url": n.url or "",
            "source": n.source,
            "published_at": n.published_at.isoformat() if hasattr(n.published_at, 'isoformat') else str(n.published_at),
            "description": n.description or ""
        }
        
        # Extract impact level and type from AI-generated news
        if n.source == "OpenAI":
            if "[CRITICAL]" in n.title:
                news_data["impact_level"] = "critical"
            elif "[HIGH]" in n.title:
                news_data["impact_level"] = "high"
            elif "[MEDIUM]" in n.title:
                news_data["impact_level"] = "medium"
            
            if "[OPPORTUNITY]" in n.title:
                news_data["opportunity_type"] = "opportunity"
            elif "[RISK]" in n.title:
                news_data["opportunity_type"] = "risk"
        
        formatted_news.append(news_data)
    
    # Get news sources summary
    sources_summary = (
        db.query(News.source, func.count(News.id).label('count'))
        .group_by(News.source)
        .all()
    )
    
    return {
        "items": formatted_news,
        "count": len(formatted_news),
        "total_count": total_count,
        "limit": limit,
        "sources": {source: count for source, count in sources_summary},
        "timestamp": datetime.now(timezone.utc).isoformat()
    }


@router.get("/stats")
def get_dashboard_stats(company_id: Optional[int] = None, db: Session = Depends(get_db)):
    """
    Get dashboard statistics and system health.
    
    New endpoint for monitoring dashboard usage and health.
    """
    stats = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "websocket": manager.get_stats(),
        "database": {}
    }
    
    # Add company-specific stats if provided
    if company_id:
        # KPI statistics
        kpi_count = db.query(func.count(Kpi.id)).filter_by(company_id=company_id).scalar()
        latest_kpi = db.query(func.max(Kpi.as_of)).filter_by(company_id=company_id).scalar()
        
        stats["database"]["company_stats"] = {
            "company_id": company_id,
            "total_kpis": kpi_count,
            "latest_kpi_update": latest_kpi.isoformat() if latest_kpi and hasattr(latest_kpi, 'isoformat') else str(latest_kpi) if latest_kpi else None
        }
    
    # Global statistics
    total_companies = db.query(func.count(Company.id)).scalar()
    total_kpis = db.query(func.count(Kpi.id)).scalar()
    total_news = db.query(func.count(News.id)).scalar()
    recent_news = db.query(func.count(News.id)).filter(
        News.published_at >= datetime.now(timezone.utc) - timedelta(hours=24)
    ).scalar()
    
    stats["database"]["global_stats"] = {
        "total_companies": total_companies,
        "total_kpis": total_kpis,
        "total_news": total_news,
        "news_last_24h": recent_news
    }
    
    return stats


# ─────────── WebSocket ───────────

@router.websocket("/ws")
async def dashboard_ws(
    ws: WebSocket,
    client_id: Optional[str] = Query(None, description="Optional client identifier"),
    company_id: Optional[int] = Query(None, description="Subscribe to specific company on connection")
):
    """
    WebSocket endpoint for real-time dashboard updates.
    
    Enhanced with:
    - Client identification
    - Automatic company subscription
    - Message handling
    - Graceful error handling
    """
    await manager.connect(ws, client_id=client_id)
    
    # Start background tasks if not already running
    await manager.start_background_tasks()
    
    # Auto-subscribe to company if provided
    if company_id:
        await manager.subscribe_to_company(ws, company_id)
    
    try:
        while True:
            # Receive and handle client messages
            message = await ws.receive_text()
            await manager.handle_client_message(ws, message)
            
    except WebSocketDisconnect:
        logger.info(f"WebSocket disconnected: client_id={client_id}")
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
    finally:
        manager.disconnect(ws)


# ─────────── Helper Functions ───────────

def _infer_data_type(value: Any) -> str:
    """Infer the data type of a KPI value for better frontend handling."""
    if isinstance(value, bool):
        return "boolean"
    elif isinstance(value, int):
        return "integer"
    elif isinstance(value, float):
        return "decimal"
    elif isinstance(value, str):
        # Check if it's a percentage
        if value.endswith('%'):
            return "percentage"
        # Check if it's currency
        elif value.startswith('$') or value.startswith('€') or value.startswith('£'):
            return "currency"
        else:
            return "string"
    else:
        return "unknown"