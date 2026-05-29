"""
Secondary models: SMS logs, AI documents, Newspapers
"""
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.sql import func

from app.core.database import Base


class SMSLog(Base):
    """Log of every SMS that has been sent"""
    __tablename__ = "sms_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    site_id = Column(Integer, ForeignKey("world_heritage_sites.id"))
    message = Column(Text, nullable=False)
    sent_at = Column(DateTime(timezone=True), server_default=func.now())
    status = Column(String(20), default="sent")  # sent, failed, pending


class AIDocument(Base):
    """
    UNESCO PDF files used by the AI to answer questions.
    Per the client's requirement: the AI uses only these local files, not the internet.
    """
    __tablename__ = "ai_documents"

    id = Column(Integer, primary_key=True, index=True)
    site_id = Column(Integer, ForeignKey("world_heritage_sites.id"))
    filename = Column(String(255), nullable=False)
    content = Column(Text)  # Text extracted from the PDF
    uploaded_at = Column(DateTime(timezone=True), server_default=func.now())


class AIQuery(Base):
    """Log of user questions sent to the AI"""
    __tablename__ = "ai_queries"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    site_id = Column(Integer, ForeignKey("world_heritage_sites.id"))
    question = Column(Text, nullable=False)
    answer = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Newspaper(Base):
    """
    Newspapers table - each newspaper can use the service with its own settings
    (colors, logo, language) per the client's requirement.
    """
    __tablename__ = "newspapers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    language = Column(String(10), default="sv")
    primary_color = Column(String(7), default="#0072BC")  # UNESCO blue
    logo_url = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
