"""
Router: AI Chat
Handles user questions to the AI.

Note: the AI uses only local sources (UNESCO PDFs).
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.other import AIQuery
from app.schemas import AIQuestion, AIAnswer
from app.services.ai_service import ask_ai

router = APIRouter(prefix="/api/ai", tags=["AI"])


@router.post("/ask", response_model=AIAnswer)
def ask_question(question: AIQuestion, db: Session = Depends(get_db)):
    """
    Ställ en fråga till AI:n om ett världsarv.
    Ask the AI a question about a heritage site.

    The AI uses only local sources (UNESCO PDFs).
    """
    answer, sources = ask_ai(db, question.site_id, question.question)

    # Log the question and answer
    log = AIQuery(
        user_id=question.user_id,
        site_id=question.site_id,
        question=question.question,
        answer=answer,
    )
    db.add(log)
    db.commit()

    return AIAnswer(answer=answer, sources=sources)


@router.get("/history/{user_id}")
def get_user_history(user_id: int, db: Session = Depends(get_db)):
    """
    Hämtar användarens tidigare frågor.
    Returns the user's question history.
    """
    queries = db.query(AIQuery).filter(
        AIQuery.user_id == user_id
    ).order_by(AIQuery.created_at.desc()).all()
    return queries
