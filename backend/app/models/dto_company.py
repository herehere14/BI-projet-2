from pydantic import BaseModel, Field
class CompanyCreate(BaseModel):
    name: str | None = Field(None, max_length=256)

    biz_type: str = Field(..., max_length=128)
    description: str
    snowflake_dsn: str | None = None

from uuid import UUID


class CompanyOut(CompanyCreate):
    id: UUID
    class Config: orm_mode = True