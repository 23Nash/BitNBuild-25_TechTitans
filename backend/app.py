from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
from classify3 import predict_sentiment_batched
from rake_keywords import extract_positive_negative_keywords

# -------------------------------
# FastAPI setup
# -------------------------------
app = FastAPI(title="Sentiment Analysis API")

# Allow all origins for demo; in production restrict to your frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://www.amazon.in", "https://www.flipkart.com", "*"],
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

# @app.post("/predict_batch")
# def predict_batch(batch: TextBatch):
#     results = predict_sentiment_batched(batch.texts)
#     return {"results": results}


@app.post("/predict_batch")
def predict_batch(batch: TextBatch):
    # Get sentiment predictions
    results = predict_sentiment_batched(batch.texts)
    
    # Separate reviews by sentiment
    positive_reviews = []
    negative_reviews = []
    neutral_reviews = []
    
    for i, result in enumerate(results):
        text = batch.texts[i]
        label = result.get('predicted_label', '')
        
        if label == 'positive':
            positive_reviews.append(text)
        elif label == 'negative':
            negative_reviews.append(text)
        elif label == 'neutral':
            neutral_reviews.append(text)
    
    # Count sentiments
    sentiment_counts = {
        'positive': len(positive_reviews),
        'negative': len(negative_reviews),
        'neutral': len(neutral_reviews),
        'total': len(batch.texts)
    }
    
    # Extract keywords for pros and cons
    pros_cons = {'pros': [], 'cons': []}
    
    if positive_reviews or negative_reviews:
        keywords = extract_positive_negative_keywords(
            positive_reviews, 
            negative_reviews, 
            top_k=5
        )
        pros_cons['pros'] = keywords.get('positive', [])
        pros_cons['cons'] = keywords.get('negative', [])
    
    return {
        "results": results,
        "sentiment_counts": sentiment_counts,
        "pros_cons": pros_cons
    }
    