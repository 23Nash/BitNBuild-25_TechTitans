"""
RAKE (Rapid Automatic Keyword Extraction) Implementation
Extracts meaningful multi-word phrases from text reviews
"""

import re
from typing import List
from rake_nltk import Rake

def setup_stopwords():
    """Setup stopwords with fallback options"""
    try:
        import nltk
        nltk.download('stopwords', quiet=True)
        from nltk.corpus import stopwords
        return list(stopwords.words('english'))
    except Exception:
        try:
            import spacy
            from spacy.lang.en.stop_words import STOP_WORDS
            return list(STOP_WORDS)
        except Exception:
            # Fallback basic stopwords
            return ['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'a', 'an']

def extract_keywords_rake(texts: List[str], top_k: int = 10) -> List[str]:
    """
    Extract meaningful multi-word phrases using RAKE algorithm
    
    Args:
        texts: List of review texts
        top_k: Number of top keywords to return
    
    Returns:
        List of extracted keyword phrases
    """
    try:
        # Filter out empty texts
        texts = [t for t in texts if t and t.strip()]
        if not texts:
            print("❌ No valid texts for RAKE")
            return []
        
        print(f"RAKE processing {len(texts)} texts")
        
        # Use original texts (with punctuation) for better phrase extraction
        # Add proper sentence separators
        combined_text = ". ".join(texts) + "."
        
        if not combined_text.strip():
            print("❌ Combined text is empty for RAKE")
            return []
        
        # Setup stopwords
        stopwords = setup_stopwords()
        
        # Initialize RAKE with optimized parameters
        rake = Rake(
            stopwords=stopwords,
            min_length=2,  # Minimum phrase length (2+ words)
            max_length=4   # Maximum phrase length (4 words max)
        )
        
        rake.extract_keywords_from_text(combined_text)
        ranked_phrases = rake.get_ranked_phrases_with_scores()
        
        if not ranked_phrases:
            print("❌ RAKE found no phrases")
            return []
        
        # Extract and clean phrases
        keywords = []
        for score, phrase in ranked_phrases[:top_k * 3]:  # Get more candidates for filtering
            # Clean up the phrase
            clean_phrase = phrase.strip()
            # Remove trailing dots and extra spaces
            clean_phrase = re.sub(r'\s*\.\.\s*', ' ', clean_phrase)
            clean_phrase = re.sub(r'\s+', ' ', clean_phrase).strip()
            
            # Filter criteria:
            # - Must be 2-4 words
            # - No remaining dots
            # - No duplicates
            word_count = len(clean_phrase.split())
            if (word_count >= 2 and word_count <= 4 and 
                '..' not in clean_phrase and 
                clean_phrase not in keywords):
                keywords.append(clean_phrase)
                
            if len(keywords) >= top_k:
                break
        
        print(f"✅ RAKE extracted: {keywords}")
        return keywords
        
    except Exception as e:
        print(f"❌ RAKE error: {e}")
        return []

def extract_positive_negative_keywords(positive_reviews: List[str], negative_reviews: List[str], top_k: int = 5) -> dict:
    """
    Extract keywords separately for positive and negative reviews
    
    Args:
        positive_reviews: List of positive review texts
        negative_reviews: List of negative review texts
        top_k: Number of keywords per category
    
    Returns:
        Dictionary with 'positive' and 'negative' keyword lists
    """
    result = {
        'positive': [],
        'negative': []
    }
    
    if positive_reviews:
        result['positive'] = extract_keywords_rake(positive_reviews, top_k)
    
    if negative_reviews:
        result['negative'] = extract_keywords_rake(negative_reviews, top_k)
    
    return result

# Example usage
if __name__ == "__main__":
    # Test data
    positive_reviews = [
        "The battery life is incredible, easily lasts for two full days.",
        "I love the display, it's bright, sharp, and vibrant.",
        "Build quality feels premium and very durable.",
        "Fast delivery and excellent packaging, no damages at all.",
        "Customer support was very helpful and resolved my issue quickly.",
        "Camera quality is amazing, photos are crisp and clear."
    ]
    
    negative_reviews = [
        "Battery drains too quickly when using apps intensively.",
        "Screen scratches easily, not very durable.",
        "Customer service was unresponsive and rude.",
        "The delivery was delayed by a week, very disappointing.",
        "Device heats up after prolonged use, uncomfortable to hold.",
        "Camera performance is poor in low light conditions."
    ]
    
    # Extract keywords
    print("=== RAKE Keyword Extraction ===")
    all_keywords = extract_keywords_rake(positive_reviews + negative_reviews, 10)
    print(f"All Keywords: {all_keywords}")
    
    print("\n=== Positive vs Negative Keywords ===")
    separated_keywords = extract_positive_negative_keywords(positive_reviews, negative_reviews, 5)
    print(f"Positive Keywords: {separated_keywords['positive']}")
    print(f"Negative Keywords: {separated_keywords['negative']}")