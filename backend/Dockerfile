# ShopLiveBharat backend — deterministic build (bypasses Railpack layer-cache
# issues so new dependencies like cloudinary always install).
FROM python:3.12-slim

WORKDIR /app

# System deps kept minimal. Install Python deps first for layer caching that
# correctly invalidates whenever requirements.txt changes.
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip \
    && pip install --no-cache-dir -r requirements.txt

# App source
COPY . .

# Railway provides $PORT at runtime.
ENV PORT=8000
CMD ["sh", "-c", "uvicorn server:app --host 0.0.0.0 --port ${PORT:-8000}"]
