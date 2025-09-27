from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
from classify3 import predict_sentiment_batched

# -------------------------------
# FastAPI setup
# -------------------------------
app = FastAPI(title="Sentiment Analysis API")

# Allow all origins for demo; in production restrict to your frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -------------------------------
# Request models
# -------------------------------
class TextItem(BaseModel):
    text: str

class TextBatch(BaseModel):
    texts: List[str]

# -------------------------------
# API endpoints
# -------------------------------
@app.get("/")
def read_root():
    return {"message": "Sentiment Analysis API is running!"}

@app.post("/predict")
def predict_single(item: TextItem):
    result = predict_sentiment_batched([item.text])[0]
    return result

@app.post("/predict_batch")
def predict_batch(batch: TextBatch):
    results = predict_sentiment_batched(batch.texts)
    return {"results": results}
