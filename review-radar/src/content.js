// Review Radar - Content Script for Amazon and Flipkart
// Scrapes product reviews and classifies them by sentiment

class ReviewScraper {
    constructor() {
        this.reviews = {
            positive_reviews: [],
            negative_reviews: []
        };
        this.initializeScraper();
    }

    initializeScraper() {
        // Detect which site we're on
        const hostname = window.location.hostname;

        if (hostname.includes('amazon')) {
            this.scrapeSite = 'amazon';
            this.scrapeAmazonReviews();
        } else if (hostname.includes('flipkart')) {
            this.scrapeSite = 'flipkart';
            this.scrapeFlipkartReviews();
        } else {
            console.log('Review Radar: Unsupported site');
            return;
        }
    }

    // Amazon review scraping
    scrapeAmazonReviews() {
        console.log('Review Radar: Scanning Amazon reviews...');

        // Multiple selectors for Amazon reviews (they change frequently)
        const reviewSelectors = [
            '[data-hook="review"]',
            '.review',
            '.cr-original-review-text',
            '[data-hook="review-body"]'
        ];

        let reviews = [];

        // Try different selectors until we find reviews
        for (const selector of reviewSelectors) {
            const reviewElements = document.querySelectorAll(selector);
            if (reviewElements.length > 0) {
                reviews = Array.from(reviewElements);
                break;
            }
        }

        if (reviews.length === 0) {
            // Try to find the reviews section and wait for it to load
            this.waitForReviews(() => this.scrapeAmazonReviews());
            return;
        }

        reviews.forEach((reviewElement, index) => {
            try {
                const reviewData = this.extractAmazonReviewData(reviewElement);
                if (reviewData) {
                    this.classifyAndStoreReview(reviewData);
                }
            } catch (error) {
                console.log(`Review Radar: Error processing Amazon review ${index}:`, error);
            }
        });

        this.sendReviewsToPopup();
    }

    extractAmazonReviewData(reviewElement) {
        // Extract review text
        const textSelectors = [
            '[data-hook="review-body"] span',
            '.cr-original-review-text',
            '.reviewText',
            '[data-hook="review-body"]',
            '.review-text'
        ];

        let reviewText = '';
        for (const selector of textSelectors) {
            const textElement = reviewElement.querySelector(selector);
            if (textElement) {
                reviewText = textElement.textContent?.trim() || '';
                if (reviewText) break;
            }
        }

        // Extract rating
        const ratingSelectors = [
            '[data-hook="review-star-rating"]',
            '.review-rating',
            '[class*="stars"]',
            '.a-icon-alt'
        ];

        let rating = null;
        for (const selector of ratingSelectors) {
            const ratingElement = reviewElement.querySelector(selector);
            if (ratingElement) {
                const ratingText = ratingElement.textContent || ratingElement.getAttribute('aria-label') || '';
                const ratingMatch = ratingText.match(/(\d+(?:\.\d+)?)/);
                if (ratingMatch) {
                    rating = parseFloat(ratingMatch[1]);
                    break;
                }
            }
        }

        // Extract date
        const dateSelectors = [
            '[data-hook="review-date"]',
            '.review-date',
            '.a-size-base.a-color-secondary'
        ];

        let reviewDate = '';
        for (const selector of dateSelectors) {
            const dateElement = reviewElement.querySelector(selector);
            if (dateElement) {
                reviewDate = dateElement.textContent?.trim() || '';
                if (reviewDate) break;
            }
        }

        // Validate data
        if (!reviewText || rating === null) {
            return null;
        }

        return {
            text: reviewText,
            rating: rating,
            date: reviewDate || 'Unknown date'
        };
    }

    // // Flipkart review scraping
    // scrapeFlipkartReviews() {
    //     console.log('Review Radar: Scanning Flipkart reviews...');

    //     const reviewSelectors = [
    //         '._27M2dn', // Flipkart review container
    //         '.review-container',
    //         '._1AtVbE', // Another Flipkart class
    //         '[data-testid="review"]'
    //     ];

    //     let reviews = [];

    //     for (const selector of reviewSelectors) {
    //         const reviewElements = document.querySelectorAll(selector);
    //         if (reviewElements.length > 0) {
    //             reviews = Array.from(reviewElements);
    //             break;
    //         }
    //     }

    //     if (reviews.length === 0) {
    //         this.waitForReviews(() => this.scrapeFlipkartReviews());
    //         return;
    //     }

    //     reviews.forEach((reviewElement, index) => {
    //         try {
    //             const reviewData = this.extractFlipkartReviewData(reviewElement);
    //             if (reviewData) {
    //                 this.classifyAndStoreReview(reviewData);
    //             }
    //         } catch (error) {
    //             console.log(`Review Radar: Error processing Flipkart review ${index}:`, error);
    //         }
    //     });

    //     this.sendReviewsToPopup();
    // }



    // extractFlipkartReviewData(reviewElement) {
    //     // Extract review text
    //     const textSelectors = [
    //         '._2-N8zT', // Flipkart review text
    //         '.review-text',
    //         '._2V5EHH',
    //         '._11pzQk'
    //     ];

    //     let reviewText = '';
    //     for (const selector of textSelectors) {
    //         const textElement = reviewElement.querySelector(selector);
    //         if (textElement) {
    //             reviewText = textElement.textContent?.trim() || '';
    //             if (reviewText) break;
    //         }
    //     }

    //     // Extract rating
    //     const ratingSelectors = [
    //         '._3LWZlK', // Flipkart rating
    //         '.rating',
    //         '._3_auN3',
    //         '._1BLPMq'
    //     ];

    //     let rating = null;
    //     for (const selector of ratingSelectors) {
    //         const ratingElement = reviewElement.querySelector(selector);
    //         if (ratingElement) {
    //             const ratingText = ratingElement.textContent?.trim() || '';
    //             const ratingMatch = ratingText.match(/(\d+)/);
    //             if (ratingMatch) {
    //                 rating = parseInt(ratingMatch[1]);
    //                 break;
    //             }
    //         }
    //     }

    //     // Extract date
    //     const dateSelectors = [
    //         '._3QlBMK', // Flipkart date
    //         '.review-date',
    //         '._2_R_DZ'
    //     ];

    //     let reviewDate = '';
    //     for (const selector of dateSelectors) {
    //         const dateElement = reviewElement.querySelector(selector);
    //         if (dateElement) {
    //             reviewDate = dateElement.textContent?.trim() || '';
    //             if (reviewDate) break;
    //         }
    //     }

    //     // Validate data
    //     if (!reviewText || rating === null) {
    //         return null;
    //     }

    //     return {
    //         text: reviewText,
    //         rating: rating,
    //         date: reviewDate || 'Unknown date'
    //     };
    // }

    scrapeFlipkartReviews() {
        console.log('Review Radar: Scanning Flipkart reviews...');

        // 1️⃣ Click "Read all reviews" button if it exists
        const readAllBtn = document.querySelector('div._3UAT2v._16PBlm');
        if (readAllBtn) {
            console.log('Review Radar: Clicking "Read all reviews" button...');
            readAllBtn.click();
        }

        // 2️⃣ Wait a short moment for reviews to load
        setTimeout(() => {
            // 3️⃣ Select review elements
            const reviewElements = document.querySelectorAll('div[data-testid="review"], div._16PBlm');

            if (reviewElements.length === 0) {
                console.log('Review Radar: No reviews found, retrying...');
                this.waitForReviews(() => this.scrapeFlipkartReviews());
                return;
            }

            reviewElements.forEach((reviewElement, index) => {
                try {
                    const reviewData = this.extractFlipkartReviewData(reviewElement);
                    if (reviewData) {
                        console.log(`Review Radar: Extracted review ${index + 1}:`, reviewData);
                        this.classifyAndStoreReview(reviewData);
                    }
                } catch (error) {
                    console.log(`Review Radar: Error processing Flipkart review ${index + 1}:`, error);
                }
            });

            this.sendReviewsToPopup();
        }, 1500); // wait 1.5 seconds for AJAX content to load
    }


    extractFlipkartReviewData(reviewElement) {
        // Review text
        let reviewText = reviewElement.querySelector('div[data-testid="review-text"]')?.innerText
            || reviewElement.querySelector('div._2-N8zT')?.innerText
            || reviewElement.querySelector('div._3dcx77')?.innerText
            || '';

        // Rating
        let ratingText = reviewElement.querySelector('div._3LWZlK')?.innerText
            || reviewElement.querySelector('div._2d4LTz')?.innerText
            || '';
        let rating = ratingText ? parseInt(ratingText.trim()) : null;

        // Date
        let reviewDate = reviewElement.querySelector('p._2sc7ZR._2V5EHH')?.innerText
            || reviewElement.querySelector('div._3dsJAO')?.innerText
            || '';

        if (!reviewText || rating === null) return null;

        return { text: reviewText.trim(), rating, date: reviewDate.trim() || 'Unknown date' };
    }


    classifyAndStoreReview(reviewData) {
        const { text, rating, date } = reviewData;

        // Classify based on rating
        if (rating >= 4) {
            this.reviews.positive_reviews.push({ text, date, rating });
        } else if (rating <= 2) {
            this.reviews.negative_reviews.push({ text, date, rating });
        }
        // Skip neutral reviews (rating 3) as per requirements
    }

    waitForReviews(callback, attempts = 0) {
        if (attempts > 10) {
            console.log('Review Radar: No reviews found after multiple attempts');
            this.sendReviewsToPopup();
            return;
        }

        setTimeout(() => {
            console.log(`Review Radar: Waiting for reviews to load (attempt ${attempts + 1})`);
            callback();
        }, 1000 * (attempts + 1)); // Increasing delay
    }

    sendReviewsToPopup() {
        const totalReviews = this.reviews.positive_reviews.length + this.reviews.negative_reviews.length;

        console.log(`Review Radar: Found ${totalReviews} reviews (${this.reviews.positive_reviews.length} positive, ${this.reviews.negative_reviews.length} negative)`);

        // Log the reviews to the console
        console.log('Positive Reviews:', this.reviews.positive_reviews);
        console.log('Negative Reviews:', this.reviews.negative_reviews);

        // Store in chrome.storage.local for popup access
        chrome.storage.local.set({
            reviewRadarData: {
                ...this.reviews,
                scrapedAt: new Date().toISOString(),
                site: this.scrapeSite,
                totalFound: totalReviews
            }
        }, () => {
            console.log('Review Radar: Reviews successfully stored in chrome.storage.local');
        });

        // Send reviews to the backend
        this.postReviewsToBackend();

        // Send message to popup if it's open
        if (chrome.runtime) {
            chrome.runtime.sendMessage({
                action: 'reviewsScraped',
                data: this.reviews,
                totalFound: totalReviews,
                site: this.scrapeSite
            }).catch(() => {
                console.log('Review Radar: Reviews stored in chrome.storage.local');
            });
        }
    }

    postReviewsToBackend() {
        const url = 'http://127.0.0.1:8000/predict_batch';
        const cleanText = (text) => text.replace(/[^a-zA-Z0-9\s]/g, ''); // Remove special symbols

        const payload = {
            texts: [
                ...this.reviews.positive_reviews.map(review => cleanText(review.text)),
                ...this.reviews.negative_reviews.map(review => cleanText(review.text))
            ]
        };

        fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                console.log('Review Radar: Successfully posted reviews to backend:', data);

                // Store backend response in chrome.storage.local
                chrome.storage.local.set({ backendResponse: data }, () => {
                    console.log('Review Radar: Backend response successfully stored in chrome.storage.local');
                });
            })
            .catch(error => {
                console.error('Review Radar: Failed to post reviews to backend:', error);

                // Store error message in chrome.storage.local for debugging
                chrome.storage.local.set({ backendResponseError: { error: error.message } }, () => {
                    console.log('Review Radar: Error details stored in chrome.storage.local');
                });
            });
    }
}

// Message listener for popup communication
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'scrapeReviews') {
        console.log('Review Radar: Starting review scraping...');
        new ReviewScraper();
        sendResponse({ status: 'started' });
    } else if (request.action === 'getStoredReviews') {
        chrome.storage.local.get('reviewRadarData', (result) => {
            sendResponse({ data: result.reviewRadarData || null });
        });
    }
    return true; // Keep message channel open for async responses
});

// Auto-scrape when page loads (optional)
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => new ReviewScraper(), 2000); // Wait for page to fully load
    });
} else {
    setTimeout(() => new ReviewScraper(), 2000);
}

console.log('Review Radar: Content script loaded');