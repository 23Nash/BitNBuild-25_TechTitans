from transformers import AutoTokenizer, AutoModelForSequenceClassification
import torch
import torch.nn.functional as F
import numpy as np

# MODEL_NAME = "cardiffnlp/twitter-roberta-base-sentiment-latest"
tokenizer = AutoTokenizer.from_pretrained("./local_model")
model = AutoModelForSequenceClassification.from_pretrained("./local_model")

# Neutral keywords
NEUTRAL_KEYWORDS = ["okay", "fine", "average", "not bad", "nothing special", "decent", "so-so"]

# def adjust_neutral_keywords(text, top_class, probs, margin, top_prob, conf_thresh=0.75):
#     """
#     Decide if prediction should be forced to neutral using keywords and thresholds.
#     """
#     # Margin or confidence-based neutral
#     if top_prob < conf_thresh or margin < 0.45:
#         # Check for neutral keywords
#         text_lower = text.lower()
#         if any(k in text_lower for k in NEUTRAL_KEYWORDS):
#             return "neutral"
#         # Optionally also force neutral for ambiguous cases without keywords
#         return "neutral"
#     return top_class

def adjust_neutral_keywords(text, top_class, probs, margin, top_prob, conf_thresh=0.75):
    """
    Decide if prediction should be forced to neutral using keywords and thresholds.
    """
    # Margin or confidence-based neutral
    if top_prob < conf_thresh or margin < 0.45:
        # Check for neutral keywords in the text itself
        text_lower = text.lower()
        if any(k in text_lower for k in NEUTRAL_KEYWORDS):
            return "neutral"
        # Optionally also force neutral for ambiguous cases without keywords
        return "neutral"
    
    # Additional keyword check even if thresholds are passed
    text_lower = text.lower()
    if any(k in text_lower for k in NEUTRAL_KEYWORDS):
        return "neutral"
    
    return top_class

def predict_sentiment_batched(texts, threshold_margin=0.45, confidence_threshold=0.75):
    """
    Batched sentiment prediction with improved neutral detection.
    Returns: list of dicts with predicted_label, model_label, probs, margin, top_prob, entropy
    """
    # Tokenize batch
    inputs = tokenizer(texts, return_tensors="pt", truncation=True, padding=True)
    
    # Model prediction
    with torch.no_grad():
        outputs = model(**inputs)
        logits = outputs.logits
        probs_batch = F.softmax(logits, dim=-1).cpu().numpy()
    
    results = []
    labels = model.config.id2label
    
    for text, probs in zip(texts, probs_batch):
        # Top two classes and margin
        top_idx = int(np.argmax(probs))
        second_idx = int(np.argsort(probs)[-2])
        top_prob = probs[top_idx]
        second_prob = probs[second_idx]
        margin = top_prob - second_prob
        
        # Entropy (uncertainty measure)
        entropy = -np.sum(probs * np.log(probs + 1e-10))
        
        # Probabilities dict
        label_probs = {labels[i]: float(probs[i]) for i in range(len(probs))}
        
        # Initial top class
        top_class = labels[top_idx]
        
        # Apply neutral adjustment
        predicted_label = adjust_neutral_keywords(
            text, top_class, label_probs, margin, top_prob, conf_thresh=confidence_threshold
        )
        
        # Confidence calculation
        if predicted_label == "neutral":
            confidence = round(1 - top_prob if top_prob > 0.5 else margin, 4)
        else:
            confidence = round(float(top_prob), 4)
        
        # results.append({
        #     "text": text,
        #     "predicted_label": predicted_label,
        #     "model_label": top_class,
        #     "confidence": confidence,
        #     "top_prob": round(float(top_prob), 4),
        #     "second_prob": round(float(second_prob), 4),
        #     "margin": round(float(margin), 4),
        #     "entropy": round(float(entropy), 4),
        #     "probs": label_probs
        # })

        results.append({
            "text": text,
            "predicted_label": predicted_label
        })

    
    return results

# Example usage
sample_texts = [
    "Amazing battery life and great design!",
    "It's okay, nothing special but does the job.",
    "Terrible product, broke after 2 days.",
    "Love the colors and the feel of this product, very premium!",
    "Average product, not bad but not great either."
]

enhanced_preds = predict_sentiment_batched(sample_texts)
for p in enhanced_preds:
    print(p)
