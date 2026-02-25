# FastAPI + LangGraph (Dummy Agent)

This project provides a minimal FastAPI service wired to a LangGraph graph. It uses OpenAI if `OPENAI_API_KEY` is set; otherwise it falls back to a dummy agent (no external LLM calls).

## Setup

```bash
uv venv --python 3.12
source .venv/bin/activate
uv pip install -e .
```

## Run

```bash
uvicorn app.main:app --reload
```

## Configure OpenAI (optional)

```bash
export OPENAI_API_KEY="your_key"
export OPENAI_MODEL="gpt-5"
```

## Test

```bash
curl -X POST http://127.0.0.1:8000/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"Hello"}'
```
