"""
AI Service - answers visitor questions using AI

Critical, per the client's requirement:
- The AI uses only local PDF files from UNESCO
- It must not use the internet
- If there isn't enough source material, it must reply
  "I don't have enough information to answer that."

Technique: RAG (Retrieval-Augmented Generation)
1. Search the local PDF files for text relevant to the question
2. Send only those texts to the LLM as context
3. The LLM answers based on that context only
"""
from typing import List, Tuple
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.other import AIDocument


def search_documents(db: Session, site_id: int, question: str) -> List[AIDocument]:
    """
    Search the local PDF files for documents related to the question.
    Simple version: returns all files attached to the site.
    Advanced version: use full-text search or vector search.
    """
    documents = db.query(AIDocument).filter(
        AIDocument.site_id == site_id
    ).all()
    return documents


def generate_answer_mock(question: str, context: str) -> str:
    """
    Mock for the AI - returns a simple answer.
    In production: use Ollama (local LLM) or the OpenAI API.
    """
    if not context:
        return "I don't have enough information in the local sources to answer that question."

    # In the mock, return a simple answer that shows the context is being used
    return (
        f"Based on the local UNESCO sources: {context[:200]}... "
        f"(This is a mock answer - a real LLM is used in production)"
    )


def ask_ai(db: Session, site_id: int, question: str) -> Tuple[str, List[str]]:
    """
    Main entry point: ask the AI a question about a specific site.

    Returns:
        tuple (answer, sources) - the answer plus the list of sources used
    """
    # 1. Search the local sources
    documents = search_documents(db, site_id, question)

    if not documents:
        return (
            "I don't have enough information in the local sources to answer that question.",
            []
        )

    # 2. Concatenate the texts as context
    context = "\n\n".join([doc.content or "" for doc in documents if doc.content])
    sources = [doc.filename for doc in documents]

    # 3. Send it to the LLM
    if settings.AI_PROVIDER == "mock":
        answer = generate_answer_mock(question, context)
    else:
        # This is where we would use Ollama or OpenAI
        # from openai import OpenAI
        # client = OpenAI(api_key=settings.OPENAI_API_KEY)
        # response = client.chat.completions.create(...)
        answer = generate_answer_mock(question, context)

    return answer, sources
