from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base

class Dialect(Base):
    __tablename__ = "dialects"

    code: Mapped[str] = mapped_column(String(30), primary_key=True)
    language: Mapped[str] = mapped_column(String(50), nullable=False)
    state: Mapped[str] = mapped_column(String(50), nullable=False)
    display_name_local: Mapped[str] = mapped_column(String(100), nullable=False)
    display_name_en: Mapped[str] = mapped_column(String(100), nullable=False)
