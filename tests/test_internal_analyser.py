import uuid
from types import SimpleNamespace
from datetime import datetime, timedelta

from sqlalchemy import create_engine
from sqlalchemy.orm import Session

from backend.app.models import Company, Kpi, KpiType
from backend.app.core.database import Base
from backend.app.workers import internal_analyser


def setup_engine():
    engine = create_engine("sqlite:///:memory:", future=True)
    Base.metadata.create_all(engine)
    return engine


def populate_data(engine, company_uuid):
    with Session(engine) as sess:
        sess.add(Company(id=company_uuid, owner_id=uuid.uuid4(), name="ACME"))
        now = datetime.utcnow()
        sess.add_all([
            Kpi(company_id=company_uuid, metric="sales", value=100, as_of=now, type=KpiType.FINANCIAL),
            Kpi(company_id=company_uuid, metric="sales", value=80, as_of=now - timedelta(days=1), type=KpiType.FINANCIAL),
        ])
        sess.commit()


def fake_openai(content="ok"):
    return SimpleNamespace(choices=[SimpleNamespace(message=SimpleNamespace(content=content))])


def test_generate_report(monkeypatch):
    engine = setup_engine()
    company_uuid = uuid.uuid4()
    populate_data(engine, company_uuid)

    with engine.connect() as conn:
        monkeypatch.setattr(internal_analyser, "openai", SimpleNamespace(ChatCompletion=SimpleNamespace(create=lambda **_: fake_openai("resp"))))
        result = internal_analyser.generate_report(conn, str(company_uuid))
    assert "resp" in result


def test_analyse_publishes(monkeypatch):
    engine = setup_engine()
    company_uuid = uuid.uuid4()
    populate_data(engine, company_uuid)

    monkeypatch.setattr(internal_analyser, "get_engine", lambda: engine)
    monkeypatch.setattr(internal_analyser, "openai", SimpleNamespace(ChatCompletion=SimpleNamespace(create=lambda **_: fake_openai("resp"))))
    published = {}
    def fake_publish(cid, text, from_cache=False):
        published["id"] = cid
        published["text"] = text
    monkeypatch.setattr(internal_analyser, "publish_ai_answer", fake_publish)

    internal_analyser.analyse(str(company_uuid))

    assert published["id"] == company_uuid
    assert "resp" in published["text"]