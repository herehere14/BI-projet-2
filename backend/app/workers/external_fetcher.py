"""
15-minute job that asks ChatGPT-4o for macro/industry intel
and stores the results as news items.

• Requires OPENAI_API_KEY in .env
• Runs via Celery beat (see celery_app.py)
"""
from __future__ import annotations

import json
import logging
from datetime import datetime, timezone, timedelta
from typing import List, Dict, Optional
import hashlib

import openai
from sqlalchemy.orm import Session
from sqlalchemy import and_, func

from app.core.celery_app import celery_app
from app.core.settings import settings
from app.core.database import get_engine, News  # existing News ORM

# ──────────────────────────────────────────────────────────
openai.api_key = settings.OPENAI_API_KEY
_MODEL = "gpt-4o-mini"
_ITEMS = 5  # how many intel bullets to request
_TEMPERATURE = 0.3
_MAX_RETRIES = 2

# Enhanced prompt for more actionable intelligence
_SYSTEM_PROMPT = """You are an elite business intelligence analyst specializing in global market trends and their business implications.

Your expertise includes:
- Macroeconomic analysis and forecasting
- Geopolitical risk assessment
- Industry disruption patterns
- Supply chain dynamics
- Regulatory changes and compliance
- Technology trends impacting business
- Consumer behavior shifts
- Financial market movements

You provide intelligence that is:
1. Time-sensitive and relevant to the last 24 hours
2. Actionable with clear business implications
3. Quantified whenever possible
4. Forward-looking with risk/opportunity assessment"""

_USER_PROMPT = f"""Analyze the most significant global business developments from the past 24 hours.

Provide {_ITEMS} critical intelligence items that globally-focused businesses need to know RIGHT NOW.

For each event, structure your response as a JSON object with these fields:

• "title" - Compelling headline (≤ 120 chars) that captures the urgency
• "summary" - Concise description with key data points (≤ 200 chars)
• "recommendation" - Specific action businesses should take within 48 hours
• "impact_level" - "critical" | "high" | "medium" (based on potential business impact)
• "sectors_affected" - Array of 1-3 most affected business sectors
• "opportunity_risk" - "opportunity" | "risk" | "both"
• "geo_regions" - Array of affected regions: ["global"] | ["north_america", "europe", "asia_pacific", etc.]

Focus on:
- Central bank decisions and monetary policy changes
- Major supply chain disruptions or improvements
- Significant regulatory announcements
- Geopolitical events affecting trade
- Technology breakthroughs with immediate business applications
- Consumer sentiment shifts backed by data
- Commodity price movements above 5%
- Major M&A activity or market consolidations

Respond ONLY with a valid JSON array. Example:
[
  {{
    "title": "Fed Signals Earlier Rate Cuts Than Expected",
    "summary": "Federal Reserve hints at Q2 rate cuts following softer inflation data at 2.1%, markets surge 3.2%",
    "recommendation": "Lock in current financing rates before policy shift; consider growth investments in rate-sensitive sectors",
    "impact_level": "critical",
    "sectors_affected": ["financial_services", "real_estate", "technology"],
    "opportunity_risk": "opportunity",
    "geo_regions": ["global"]
  }}
]"""


# ──────────────────────────────────────────────────────────
def _generate_content_hash(title: str, summary: str) -> str:
    """Generate a hash to detect similar content even with slight variations."""
    content = f"{title.lower().strip()}{summary.lower().strip()}"
    return hashlib.md5(content.encode()).hexdigest()[:16]


def _ask_openai(retry: int = 0) -> List[Dict]:
    """Call ChatGPT and parse the JSON array with retry logic."""
    try:
        resp = openai.ChatCompletion.create(
            model=_MODEL,
            messages=[
                {"role": "system", "content": _SYSTEM_PROMPT},
                {"role": "user", "content": _USER_PROMPT},
            ],
            temperature=_TEMPERATURE,
            max_tokens=800,  # Increased for richer content
            presence_penalty=0.3,  # Encourage diverse topics
            frequency_penalty=0.2,  # Reduce repetition
        )

        content = resp.choices[0].message.content.strip()
        
        # Clean up potential markdown code blocks
        if content.startswith("```json"):
            content = content[7:]
        if content.endswith("```"):
            content = content[:-3]
        content = content.strip()
        
        data = json.loads(content)
        if not isinstance(data, list):
            raise ValueError("Expected list at top level")
        
        # Validate each item has required fields
        for item in data:
            if not all(key in item for key in ["title", "summary", "recommendation"]):
                raise ValueError("Missing required fields in item")
                
        return data
        
    except (ValueError, json.JSONDecodeError, KeyError) as exc:
        logging.error("OpenAI parsing error (attempt %d): %s", retry + 1, exc)
        if retry < _MAX_RETRIES:
            return _ask_openai(retry + 1)
        return []
    except Exception as exc:
        logging.error("OpenAI API error: %s", exc)
        return []


def _format_news_description(item: Dict) -> str:
    """Format the news description with all available intelligence."""
    parts = [item.get("summary", "").strip()]
    
    if item.get("recommendation"):
        parts.append(f"\n\n💡 **Action Required**: {item['recommendation']}")
    
    if item.get("impact_level"):
        emoji = {"critical": "🔴", "high": "🟠", "medium": "🟡"}.get(item["impact_level"], "⚪")
        parts.append(f"\n\n{emoji} **Impact Level**: {item['impact_level'].capitalize()}")
    
    if item.get("sectors_affected"):
        sectors = ", ".join(s.replace("_", " ").title() for s in item["sectors_affected"])
        parts.append(f"\n📊 **Sectors**: {sectors}")
    
    if item.get("opportunity_risk"):
        or_emoji = {"opportunity": "📈", "risk": "📉", "both": "⚖️"}.get(item["opportunity_risk"], "")
        parts.append(f"\n{or_emoji} **Type**: {item['opportunity_risk'].capitalize()}")
    
    if item.get("geo_regions"):
        regions = ", ".join(r.replace("_", " ").title() for r in item["geo_regions"])
        parts.append(f"\n🌍 **Regions**: {regions}")
    
    return "".join(parts)


@celery_app.task(name="app.workers.external_fetcher.fetch")
def fetch() -> int:
    """
    Generate intel with OpenAI and store new items.
    Returns number of rows inserted.
    """
    items = _ask_openai()
    if not items:
        logging.warning("No intel items generated")
        return 0

    stored = 0
    now = datetime.now(timezone.utc)
    
    # Look back 48 hours for duplicate detection
    cutoff_time = now - timedelta(hours=48)

    with Session(get_engine()) as sess:
        # Get recent news for duplicate detection
        recent_hashes = set(
            sess.query(News.description)
            .filter(
                and_(
                    News.source == "OpenAI",
                    News.published_at >= cutoff_time
                )
            )
            .all()
        )
        
        for item in items:
            title = item.get("title", "").strip()[:120]  # Enforce length limit
            summary = item.get("summary", "").strip()[:200]
            
            if not title:
                continue
                
            # Check for duplicate content using hash
            content_hash = _generate_content_hash(title, summary)
            
            # Skip if we've seen similar content recently
            existing = sess.query(News).filter(
                and_(
                    News.source == "OpenAI",
                    func.lower(News.title).contains(title.lower()[:50]),
                    News.published_at >= cutoff_time
                )
            ).first()
            
            if existing:
                logging.debug("Skipping duplicate: %s", title[:50])
                continue
            
            # Create rich description
            description = _format_news_description(item)
            
            # Add metadata tags for better searchability
            tags = []
            if item.get("impact_level") == "critical":
                tags.append("[CRITICAL]")
            if item.get("opportunity_risk") == "opportunity":
                tags.append("[OPPORTUNITY]")
            elif item.get("opportunity_risk") == "risk":
                tags.append("[RISK]")
                
            if tags:
                title = f"{' '.join(tags)} {title}"[:120]

            news = News(
                title=title,
                url="",  # no external link—AI generated
                source="OpenAI",
                published_at=now,
                description=description,
            )
            sess.add(news)
            stored += 1

        sess.commit()

    logging.info("AI intel: saved %s new items out of %s generated", stored, len(items))
    return stored