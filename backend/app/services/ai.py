"""
Lightweight façade that fires a Celery task and broadcasts
the finished AI answer over Redis so dashboard WebSockets can pick it up.
"""
import json
import redis
import logging
from typing import Optional, Dict, Any
from datetime import datetime, timezone, timedelta
from dataclasses import dataclass, asdict

from app.core.celery_app import celery_app
from app.core.settings import settings

# Redis configuration
_PUB_CHANNEL = "ai-sync.response"
_TASK_STATUS_PREFIX = "ai-task-status:"
_ANALYSIS_CACHE_PREFIX = "ai-analysis-cache:"
_CACHE_TTL = 3600  # 1 hour cache for recent analyses

_redis = redis.Redis.from_url(settings.REDIS_URL, decode_responses=True)

# Configure logging
logger = logging.getLogger(__name__)


@dataclass
class AITaskStatus:
    """Track AI analysis task status and metadata."""
    task_id: str
    company_id: int
    status: str  # 'pending', 'processing', 'completed', 'failed'
    created_at: str
    updated_at: str
    error_message: Optional[str] = None
    retry_count: int = 0


def ask_ai_sync(company_id: int) -> str:
    """
    Kick off analysis in the background and return the Celery task_id.
    
    Enhanced with:
    - Task status tracking
    - Deduplication of concurrent requests
    - Priority queue support
    - Better error handling
    """
    try:
        # Check if there's already a recent analysis in progress
        existing_task = _get_active_task(company_id)
        if existing_task:
            logger.info(f"Reusing existing task {existing_task} for company {company_id}")
            return existing_task
        
        # Check cache for very recent results (within last 5 minutes)
        cached_result = _get_cached_analysis(company_id, max_age_seconds=300)
        if cached_result:
            # Re-publish cached result for immediate dashboard update
            publish_ai_answer(company_id, cached_result, from_cache=True)
            logger.info(f"Served cached analysis for company {company_id}")
            # Still trigger a new analysis for fresh data
        
        # Send task with enhanced metadata
        task = celery_app.send_task(
            "app.workers.internal_analyser.analyse",
            args=[company_id],
            queue="internal_ai",
            priority=_get_task_priority(company_id),  # Higher priority for premium customers
            expires=300,  # Task expires after 5 minutes if not started
        )
        
        # Track task status
        _set_task_status(company_id, task.id, "pending")
        
        logger.info(f"Started AI analysis task {task.id} for company {company_id}")
        return task.id
        
    except Exception as e:
        logger.error(f"Failed to start AI analysis for company {company_id}: {str(e)}")
        # Return a pseudo task ID that indicates failure
        error_task_id = f"error-{company_id}-{int(datetime.now(timezone.utc).timestamp())}"
        _set_task_status(company_id, error_task_id, "failed", error_message=str(e))
        return error_task_id


def publish_ai_answer(company_id: int, answer: str, from_cache: bool = False) -> None:
    """
    Called by the Celery worker once it has the OpenAI response.
    
    Enhanced with:
    - Metadata enrichment
    - Caching for performance
    - Multiple channel support
    - Error handling
    """
    try:
        # Prepare enriched message
        message_data = {
            "company_id": company_id,
            "answer": answer,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "from_cache": from_cache,
            "version": "2.0",  # API version for client compatibility
        }
        
        # Cache the result for future requests
        if not from_cache:
            _cache_analysis(company_id, answer)
        
        # Publish to main channel
        message = json.dumps(message_data)
        published = _redis.publish(_PUB_CHANNEL, message)
        
        # Also publish to company-specific channel for targeted updates
        company_channel = f"{_PUB_CHANNEL}.company.{company_id}"
        _redis.publish(company_channel, message)
        
        # Update task status
        _update_task_completion(company_id, "completed")
        
        logger.info(
            f"Published AI answer for company {company_id} to {published} subscribers"
            f"{' (from cache)' if from_cache else ''}"
        )
        
    except Exception as e:
        logger.error(f"Failed to publish AI answer for company {company_id}: {str(e)}")
        _update_task_completion(company_id, "failed", error_message=str(e))

async def ask_ai_query(query: str, company_id: int | None = None) -> Dict[str, Any]:
    """Directly query OpenAI for ad-hoc or company-specific analysis."""
    try:
        if company_id is not None:
            from app.workers.internal_analyser import generate_report

            summary = generate_report(company_id)

        else:
            import openai

            if settings.OPENAI_API_KEY:
                openai.api_key = settings.OPENAI_API_KEY

                resp = await openai.ChatCompletion.acreate(
                    model=settings.OPENAI_MODEL_4O,
                    messages=[
                        {"role": "system", "content": "You are a helpful business analyst."},
                        {"role": "user", "content": query},
                    ],
                    temperature=0.3,
                    max_tokens=300,
                )
                summary = resp.choices[0].message.content.strip()
            else:
                summary = "OpenAI API key not configured." \
                    " Response is generated locally."
                
    except Exception as exc:  # pragma: no cover - network failures etc.
        logger.error("ask_ai_query failed: %s", exc)
        summary = "AI service unavailable."

    # Minimal demo forecast data
    today = datetime.now(timezone.utc)
    dates = [
        (today + timedelta(days=i)).strftime("%Y-%m-%d")
        for i in range(30)
    ]
    baseline = [1000 + i * 5 for i in range(30)]
    forecast = [v * 1.02 for v in baseline]
    lower = [v * 0.98 for v in baseline]
    upper = [v * 1.06 for v in baseline]

    actions = [
        {
            "title": "Improve Marketing", 
            "subtitle": "Focus on new customer acquisition", 
            "cost": 5000, 
            "roi": 1.2, 
            "cta": "Launch campaign"
        },
        {
            "title": "Optimize Inventory", 
            "subtitle": "Reduce slow-moving stock", 
            "cost": 2000, 
            "roi": 1.5, 
            "cta": "Review SKUs"
        },
        {
            "title": "Upsell Existing Clients", 
            "subtitle": "Introduce premium tier", 
            "cost": 1000, 
            "roi": 1.8, 
            "cta": "Create offer"
        },
    ]

    return {
        "impact_summary": summary,
        "forecast": {
            "dates": dates,
            "baseline": baseline,
            "forecast": forecast,
            "lower": lower,
            "upper": upper,
        },
        "actions": actions,
    }


# ─────────────────────────────────────────────────────────────
# Helper functions for enhanced functionality
# ─────────────────────────────────────────────────────────────

def _get_active_task(company_id: int) -> Optional[str]:
    """Check if there's already an active task for this company."""
    status_key = f"{_TASK_STATUS_PREFIX}{company_id}"
    status_data = _redis.get(status_key)
    
    if status_data:
        try:
            status = json.loads(status_data)
            if status.get("status") in ["pending", "processing"]:
                # Check if task is not stale (older than 5 minutes)
                created_at = datetime.fromisoformat(status["created_at"])
                age = (datetime.now(timezone.utc) - created_at).total_seconds()
                if age < 300:  # 5 minutes
                    return status.get("task_id")
        except (json.JSONDecodeError, KeyError, ValueError):
            pass
    
    return None


def _get_cached_analysis(company_id: int, max_age_seconds: int = 300) -> Optional[str]:
    """Retrieve cached analysis if it's recent enough."""
    cache_key = f"{_ANALYSIS_CACHE_PREFIX}{company_id}"
    cached_data = _redis.get(cache_key)
    
    if cached_data:
        try:
            cache_entry = json.loads(cached_data)
            cached_at = datetime.fromisoformat(cache_entry["timestamp"])
            age = (datetime.now(timezone.utc) - cached_at).total_seconds()
            
            if age <= max_age_seconds:
                return cache_entry["answer"]
        except (json.JSONDecodeError, KeyError, ValueError):
            pass
    
    return None


def _cache_analysis(company_id: int, answer: str) -> None:
    """Cache the analysis result with timestamp."""
    cache_key = f"{_ANALYSIS_CACHE_PREFIX}{company_id}"
    cache_data = {
        "answer": answer,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "company_id": company_id
    }
    
    _redis.setex(
        cache_key,
        _CACHE_TTL,
        json.dumps(cache_data)
    )


def _set_task_status(
    company_id: int, 
    task_id: str, 
    status: str,
    error_message: Optional[str] = None
) -> None:
    """Set the status of an AI analysis task."""
    status_key = f"{_TASK_STATUS_PREFIX}{company_id}"
    now = datetime.now(timezone.utc).isoformat()
    
    task_status = AITaskStatus(
        task_id=task_id,
        company_id=company_id,
        status=status,
        created_at=now,
        updated_at=now,
        error_message=error_message
    )
    
    _redis.setex(
        status_key,
        600,  # 10 minute TTL for status tracking
        json.dumps(asdict(task_status))
    )


def _update_task_completion(
    company_id: int, 
    status: str,
    error_message: Optional[str] = None
) -> None:
    """Update task status when completed or failed."""
    status_key = f"{_TASK_STATUS_PREFIX}{company_id}"
    status_data = _redis.get(status_key)
    
    if status_data:
        try:
            task_status = json.loads(status_data)
            task_status["status"] = status
            task_status["updated_at"] = datetime.now(timezone.utc).isoformat()
            if error_message:
                task_status["error_message"] = error_message
            
            _redis.setex(status_key, 600, json.dumps(task_status))
        except (json.JSONDecodeError, KeyError):
            pass


def _get_task_priority(company_id: int) -> int:
    """
    Determine task priority based on company tier or other factors.
    Higher number = higher priority (Celery convention).
    """
    # TODO: Integrate with your company tier/subscription system
    # For now, return default priority
    return 5  # Medium priority (scale: 0-10)


# ─────────────────────────────────────────────────────────────
# Additional utility functions for monitoring and debugging
# ─────────────────────────────────────────────────────────────

def get_task_status(company_id: int) -> Optional[Dict[str, Any]]:
    """
    Get the current status of an AI analysis task.
    Useful for API endpoints to check task progress.
    """
    status_key = f"{_TASK_STATUS_PREFIX}{company_id}"
    status_data = _redis.get(status_key)
    
    if status_data:
        try:
            return json.loads(status_data)
        except json.JSONDecodeError:
            return None
    
    return None


def get_active_subscriber_count() -> int:
    """Get the number of active subscribers to the AI channel."""
    try:
        # Use PUBSUB NUMSUB to get subscriber count
        result = _redis.execute_command('PUBSUB', 'NUMSUB', _PUB_CHANNEL)
        # Result is [channel_name, subscriber_count]
        if len(result) >= 2:
            return int(result[1])
    except Exception as e:
        logger.error(f"Failed to get subscriber count: {str(e)}")
    
    return 0