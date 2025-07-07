"""
Turns latest KPIs into plain-English insights via OpenAI.
"""
import openai
import json
import uuid

from typing import List, Dict, Any
from datetime import datetime, timedelta
from sqlalchemy.orm import Session, load_only
from sqlalchemy import and_

from app.core.celery_app import celery_app
from app.core.settings import settings
from app.core.database import get_engine
from app.models import Kpi, Company, News
from app.services.ai import publish_ai_answer

openai.api_key = settings.OPENAI_API_KEY

def _recent_news(sess: Session, hours: int = 48, limit: int = 5) -> List[str]:
    """Return recent news headlines and summaries."""
    cutoff = datetime.utcnow() - timedelta(hours=hours)
    rows = (
        sess.query(News)
        .filter(News.published_at >= cutoff)
        .order_by(News.published_at.desc())
        .limit(limit)
        .all()
    )

    items = []
    for n in rows:
        summary = (n.description or "").strip()
        if summary:
            summary = summary.split("\n")[0][:150]
        items.append(f"{n.title} - {summary}")

    return items


@celery_app.task(name="app.workers.internal_analyser.analyse")
def analyse(company_id: str) -> None:
    engine = get_engine()
    
    # ── Pull most-recent KPI snapshot and historical data ─────────────────────
    company_uuid = uuid.UUID(company_id)

    with Session(engine) as sess:
        company: Company = sess.query(Company).get(company_uuid)
        
        # Get recent KPIs
        recent_kpis = (
            sess.query(Kpi)
            .options(load_only(Kpi.metric, Kpi.value, Kpi.as_of))
            
            .filter_by(company_id=company_uuid)
            .order_by(Kpi.as_of.desc())
            .limit(50)
            .all()
        )
        
        # Get historical KPIs for trend analysis (last 30 days)
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)
        historical_kpis = (
            sess.query(Kpi)
            .options(load_only(Kpi.metric, Kpi.value, Kpi.as_of))

            .filter(
                and_(
                    Kpi.company_id == company_uuid,
                    Kpi.as_of >= thirty_days_ago
                )
            )
            .order_by(Kpi.as_of.desc())
            .all()
        )
    
    # ── Prepare structured KPI data ─────────────────────────────────────────
    # Group KPIs by metric for trend analysis
    kpi_trends = {}
    for kpi in historical_kpis:
        if kpi.metric not in kpi_trends:
            kpi_trends[kpi.metric] = []
        kpi_trends[kpi.metric].append({
            'value': kpi.value,
            'date': kpi.as_of.strftime('%Y-%m-%d') if hasattr(kpi.as_of, 'strftime') else str(kpi.as_of)
        })
    
    # Format recent KPIs with context
    recent_kpi_dict = {}
    for kpi in recent_kpis[:20]:  # Focus on top 20 most recent
        recent_kpi_dict[kpi.metric] = kpi.value
    
    # Calculate basic trends
    trend_analysis = []
    for metric, values in kpi_trends.items():
        if len(values) >= 2:
            recent_val = values[0]['value']
            older_val = values[-1]['value']
            if isinstance(recent_val, (int, float)) and isinstance(older_val, (int, float)) and older_val != 0:
                change_pct = ((recent_val - older_val) / older_val) * 100
                trend_analysis.append(f"{metric}: {change_pct:+.1f}% change over period")
    
    # ── Prepare enhanced prompt ─────────────────────────────────────────
    system_prompt = """You are a senior business intelligence analyst with expertise in data-driven decision making. 
Your role is to analyze KPI data and provide actionable insights that directly impact business performance.

When analyzing data:
1. Identify patterns and anomalies in the metrics
2. Correlate different KPIs to find root causes
3. Provide specific, quantified recommendations
4. Consider industry benchmarks and seasonality
5. Focus on the highest-impact opportunities

Format your response as exactly 3 insights, each following this structure:
**Insight [1-3]: [Metric/Area Name]**
- Finding: [Specific observation with data points]
- Root Cause: [Why this is happening based on data correlation]
- Action: [Specific recommendation with expected impact]
- Priority: [High/Medium/Low based on potential impact]"""
    
    user_prompt = f"""Company: {company.name}
Industry: {getattr(company, 'industry', 'General Business')}
Analysis Period: Last 30 days

CURRENT KPI SNAPSHOT:
{json.dumps(recent_kpi_dict, indent=2)}

TREND ANALYSIS:
{chr(10).join(trend_analysis[:10]) if trend_analysis else 'No trend data available'}

Analyze these KPIs and provide 3 high-impact business insights. Focus on:
1. Metrics showing concerning trends or anomalies
2. Opportunities for quick wins (improvements achievable within 30 days)
3. Strategic recommendations for sustainable growth

Consider relationships between metrics (e.g., how marketing spend affects customer acquisition, how churn impacts revenue).
Prioritize insights that could have the greatest positive impact on the business."""
    
    # ── Ask OpenAI with enhanced parameters ─────────────────────────────────────────
    try:
        resp = openai.ChatCompletion.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            max_tokens=500,  # Increased for more detailed insights
            temperature=0.7,  # Balanced creativity and consistency
            presence_penalty=0.3,  # Encourage diverse insights
            frequency_penalty=0.2  # Reduce repetition
        )
        
        answer = resp.choices[0].message.content.strip()
        
        # ── Add metadata to the response ─────────────────────────────────────────
        enhanced_answer = f"""📊 **AI Business Intelligence Report**
*Generated: {datetime.utcnow().strftime('%Y-%m-%d %H:%M UTC')}*
*Analysis Period: {thirty_days_ago.strftime('%Y-%m-%d')} to {datetime.utcnow().strftime('%Y-%m-%d')}*

{answer}

---
*Based on analysis of {len(recent_kpis)} KPIs with {len(trend_analysis)} trending metrics*"""
        
    except Exception as e:
        # Fallback response if OpenAI fails
        enhanced_answer = f"""📊 **AI Analysis Temporarily Unavailable**

Quick KPI Summary for {company.name}:
- Total metrics tracked: {len(recent_kpis)}
- Metrics with trends: {len(trend_analysis)}

Recent KPIs:
{chr(10).join(f'- {k}: {v}' for k, v in list(recent_kpi_dict.items())[:10])}

Please check back shortly for AI-powered insights."""
    
    # ── Publish so dashboards get it instantly ────────────
    publish_ai_answer(company_uuid, enhanced_answer)


def generate_report(company_id: str) -> str:
    """Run the KPI analysis synchronously and return the AI text."""
    engine = get_engine()

    company_uuid = uuid.UUID(company_id)

    with Session(engine) as sess:
        company: Company = sess.query(Company).get(company_uuid)

        recent_kpis = (
            sess.query(Kpi)
            .options(load_only(Kpi.metric, Kpi.value, Kpi.as_of))

            .filter_by(company_id=company_uuid)
            .order_by(Kpi.as_of.desc())
            .limit(50)
            .all()
        )

        thirty_days_ago = datetime.utcnow() - timedelta(days=30)
        historical_kpis = (
            sess.query(Kpi)

            .options(load_only(Kpi.metric, Kpi.value, Kpi.as_of))

            .filter(
                and_(Kpi.company_id == company_uuid, Kpi.as_of >= thirty_days_ago)
            )
            .order_by(Kpi.as_of.desc())
            .all()
        )

        thirty_days_ago = datetime.utcnow() - timedelta(days=30)
        historical_kpis = (
            sess.query(Kpi)
            .options(load_only(Kpi.metric, Kpi.value, Kpi.as_of))

            .filter(
                and_(Kpi.company_id == company_id, Kpi.as_of >= thirty_days_ago)
            )
            .order_by(Kpi.as_of.desc())
            .all()
        )

    kpi_trends: Dict[str, List[Dict[str, Any]]] = {}
    for kpi in historical_kpis:
        kpi_trends.setdefault(kpi.metric, []).append(
            {
                "value": kpi.value,
                "date": kpi.as_of.strftime("%Y-%m-%d") if hasattr(kpi.as_of, "strftime") else str(kpi.as_of),
            }
        )

    recent_kpi_dict = {k.metric: k.value for k in recent_kpis[:20]}

    trend_analysis = []
    for metric, values in kpi_trends.items():
        if len(values) >= 2:
            recent_val = values[0]["value"]
            older_val = values[-1]["value"]
            if isinstance(recent_val, (int, float)) and isinstance(older_val, (int, float)) and older_val != 0:
                change_pct = ((recent_val - older_val) / older_val) * 100
                trend_analysis.append(f"{metric}: {change_pct:+.1f}% change over period")

    system_prompt = (
        "You are a senior business intelligence analyst with expertise in data-driven decision making."
    )

    user_prompt = f"""Company: {company.name}
Industry: {getattr(company, 'industry', 'General Business')}
Analysis Period: Last 30 days

CURRENT KPI SNAPSHOT:
{json.dumps(recent_kpi_dict, indent=2)}

TREND ANALYSIS:
{chr(10).join(trend_analysis[:10]) if trend_analysis else 'No trend data available'}

Provide a short summary of the most important insights."""

    try:
        resp = openai.ChatCompletion.create(
            model="gpt-4o-mini",
            messages=[{"role": "system", "content": system_prompt}, {"role": "user", "content": user_prompt}],
            max_tokens=300,
            temperature=0.7,
        )

        answer = resp.choices[0].message.content.strip()

        enhanced_answer = (
            f"📊 **AI Business Intelligence Report**\n\n{answer}\n\n"
            f"*Based on analysis of {len(recent_kpis)} KPIs with {len(trend_analysis)} trending metrics*"
        )
    except Exception:
        enhanced_answer = (
            "AI analysis unavailable. "
            + "Quick summary:\n"
            + "\n".join(f"- {k}: {v}" for k, v in recent_kpi_dict.items())
        )

    return enhanced_answer