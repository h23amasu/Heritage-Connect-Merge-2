FROM python:3.12-slim

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
# Railway: demo-läge utan PostgreSQL tills Variables sätts i dashboard
ENV GEOFENCING_DEMO_MODE=true
ENV AUTO_CREATE_DB_TABLES=true
ENV DATABASE_URL=sqlite:///./heritage_connect.db
ENV DEBUG=false

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .
RUN chmod +x scripts/railway-start.sh

EXPOSE 8000

CMD ["scripts/railway-start.sh"]
