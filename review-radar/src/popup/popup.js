// This file contains the JavaScript logic for the popup, handling the button click event to analyze reviews and dynamically updating the results section with placeholder data.

document.addEventListener('DOMContentLoaded', function () {
    const analyzeButton = document.getElementById('analyze-button');
    const positiveCount = document.getElementById('positive-count');
    const negativeCount = document.getElementById('negative-count');
    const neutralCount = document.getElementById('neutral-count');
    const prosList = document.getElementById('pros-list');
    const consList = document.getElementById('cons-list');

    // Add loading state elements
    let isLoading = false;

    // Check for existing scraped data on popup load
    checkForExistingReviews();

    analyzeButton.addEventListener('click', function () {
        if (isLoading) return;

        setLoadingState(true);
        scrapeReviewsFromCurrentTab();
    });

    function setLoadingState(loading) {
        isLoading = loading;
        analyzeButton.textContent = loading ? 'Analyzing...' : 'Analyze Reviews';
        analyzeButton.disabled = loading;
    }

    function scrapeReviewsFromCurrentTab() {
        // Get the current active tab
        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
            const currentTab = tabs[0];

            // Check if we're on a supported site
            const hostname = new URL(currentTab.url).hostname;
            if (!hostname.includes('amazon') && !hostname.includes('flipkart')) {
                showError('Please navigate to an Amazon or Flipkart product page with reviews.');
                setLoadingState(false);
                return;
            }

            // Send message to content script to start scraping
            chrome.tabs.sendMessage(currentTab.id, { action: 'scrapeReviews' }, function (response) {
                if (chrome.runtime.lastError) {
                    console.error('Error communicating with content script:', chrome.runtime.lastError);
                    showError('Unable to analyze reviews. Please refresh the page and try again.');
                    setLoadingState(false);
                    return;
                }

                // Wait for scraping to complete
                setTimeout(() => {
                    getScrapedReviews(currentTab.id);
                }, 3000);
            });
        });
    }

    function getScrapedReviews(tabId) {
        chrome.tabs.sendMessage(tabId, { action: 'getStoredReviews' }, function (response) {
            setLoadingState(false);

            if (chrome.runtime.lastError || !response || !response.data) {
                showError('No reviews found on this page. Make sure you\'re on a product page with reviews.');
                return;
            }

            const reviewData = response.data;
            displayReviewData(reviewData);
        });
    }

    function checkForExistingReviews() {
        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
            if (tabs[0]) {
                chrome.tabs.sendMessage(tabs[0].id, { action: 'getStoredReviews' }, function (response) {
                    if (response && response.data && response.data.totalFound > 0) {
                        displayReviewData(response.data);
                    }
                });
            }
        });
    }

    function displayReviewData(data) {
        const { positive_reviews, negative_reviews, totalFound, site } = data;

        // Calculate sentiment data
        const sentimentData = {
            positive: positive_reviews.length,
            negative: negative_reviews.length,
            neutral: 0, // We don't collect neutral reviews as per requirements
        };

        // Update sentiment counts
        positiveCount.textContent = sentimentData.positive;
        negativeCount.textContent = sentimentData.negative;
        neutralCount.textContent = sentimentData.neutral;

        // Extract key themes for pros and cons
        const pros = extractKeyThemes(positive_reviews, true);
        const cons = extractKeyThemes(negative_reviews, false);

        // Update pros and cons lists
        prosList.innerHTML = pros.length > 0
            ? pros.map(pro => `<li>${pro}</li>`).join('')
            : '<li>No positive themes found</li>';

        consList.innerHTML = cons.length > 0
            ? cons.map(con => `<li>${con}</li>`).join('')
            : '<li>No negative themes found</li>';

        // Show success message
        showSuccess(`Found ${totalFound} reviews from ${site}`);

        // Call functions to render charts
        if (typeof renderSentimentPieChart === 'function') {
            renderSentimentPieChart(sentimentData);
        }
        if (typeof renderTrendChart === 'function') {
            renderTrendChart();
        }
    }

    function extractKeyThemes(reviews, isPositive) {
        if (reviews.length === 0) return [];

        // Simple keyword extraction based on common review themes
        const positiveKeywords = [
            'great', 'excellent', 'amazing', 'perfect', 'love', 'good quality',
            'fast delivery', 'good service', 'recommended', 'satisfied', 'worth'
        ];

        const negativeKeywords = [
            'terrible', 'awful', 'poor', 'bad', 'disappointed', 'broken',
            'late delivery', 'poor service', 'waste', 'regret', 'cheap quality'
        ];

        const keywords = isPositive ? positiveKeywords : negativeKeywords;
        const themes = [];

        // Count keyword occurrences
        const keywordCounts = {};
        keywords.forEach(keyword => keywordCounts[keyword] = 0);

        reviews.forEach(review => {
            const text = review.text.toLowerCase();
            keywords.forEach(keyword => {
                if (text.includes(keyword)) {
                    keywordCounts[keyword]++;
                }
            });
        });

        // Get top themes
        const sortedThemes = Object.entries(keywordCounts)
            .filter(([keyword, count]) => count > 0)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 3)
            .map(([keyword]) => keyword);

        return sortedThemes.length > 0 ? sortedThemes : [
            isPositive ? 'Positive feedback' : 'Negative feedback'
        ];
    }

    function showError(message) {
        // Create or update status message
        showStatusMessage(message, 'error');
    }

    function showSuccess(message) {
        showStatusMessage(message, 'success');
    }

    function showStatusMessage(message, type) {
        // Remove existing status messages
        const existingStatus = document.querySelector('.status-message');
        if (existingStatus) {
            existingStatus.remove();
        }

        // Create new status message
        const statusDiv = document.createElement('div');
        statusDiv.className = `status-message ${type}`;
        statusDiv.textContent = message;
        statusDiv.style.cssText = `
            padding: 8px 12px;
            margin: 10px 0;
            border-radius: 4px;
            font-size: 12px;
            text-align: center;
            ${type === 'error' ? 'background: #fee; color: #c33; border: 1px solid #fcc;' : 'background: #efe; color: #3c3; border: 1px solid #cfc;'}
        `;

        // Insert after the analyze button
        analyzeButton.parentNode.insertBefore(statusDiv, analyzeButton.nextSibling);

        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (statusDiv.parentNode) {
                statusDiv.remove();
            }
        }, 5000);
    }
});