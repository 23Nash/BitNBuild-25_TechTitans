// This file contains the JavaScript logic for the popup, handling the button click event to analyze reviews and dynamically updating the results section with placeholder data.

document.addEventListener('DOMContentLoaded', function () {
    const analyzeButton = document.getElementById('analyze-button');
    const positiveCount = document.getElementById('positive');
    const negativeCount = document.getElementById('negative');
    const neutralCount = document.getElementById('neutral');
    const prosList = document.getElementById('pros-list');
    const consList = document.getElementById('cons-list');

    // Add loading state elements
    let isLoading = false;

    // Check for existing scraped data on popup load
    checkForExistingReviews();

    // Show loading indicator for chart
    const chartContainer = document.getElementById('sentiment-pie-chart');
    if (chartContainer && chartContainer.parentElement) {
        chartContainer.parentElement.innerHTML = '<p class="text-blue-500 text-xs text-center">Loading chart...</p>';
    }

    // Initialize chart with backend data if available
    initializeChart();

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

        // Update pie chart with local sentiment data first
        updateSentimentPieChart({ sentiment_counts: sentimentData });

        // Call functions to render charts
        if (typeof renderSentimentPieChart === 'function') {
            renderSentimentPieChart(sentimentData);
        }
        if (typeof renderTrendChart === 'function') {
            renderTrendChart();
        }

        // Update sentiment counts from backend response (this will override with ML-analyzed data if available)
        console.log('Checking for backend ML analysis results...');
        updateSentimentCountsFromBackend();
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

    // Function to initialize chart on page load
    function initializeChart() {
        console.log('Initializing sentiment chart...');

        // Small delay to ensure Chart.js is loaded
        setTimeout(() => {
            if (typeof Chart === 'undefined') {
                console.error('Chart.js not loaded');
                const canvas = document.getElementById('sentiment-pie-chart');
                if (canvas && canvas.parentElement) {
                    canvas.parentElement.innerHTML = '<p class="text-red-500 text-xs text-center">Chart library not loaded</p>';
                }
                return;
            }

            console.log('Chart.js loaded, checking for backend data...');
            // First try to load chart with backend data
            loadChartWithBackendData();
        }, 100);
    }

    // Function to load chart with backend data or show empty state
    function loadChartWithBackendData() {
        chrome.storage.local.get('backendResponse', (result) => {
            const backendResponse = result.backendResponse;
            if (backendResponse) {
                console.log('Found backend data on page load, updating chart and counts');

                // Update DOM elements with backend counts
                updateDOMElementsFromBackend(backendResponse);

                // Update chart with backend data
                updateSentimentPieChart(backendResponse);
            } else {
                console.log('No backend data found, showing empty chart');
                // Show empty chart that will be updated when data is available
                updateSentimentPieChart({
                    sentiment_counts: { positive: 0, negative: 0, neutral: 0 }
                });
            }
        });
    }

    // Helper function to update DOM elements from backend data
    function updateDOMElementsFromBackend(backendResponse) {
        const positive = document.getElementById('positive');
        const negative = document.getElementById('negative');
        const neutral = document.getElementById('neutral');
        const prosList = document.getElementById('pros-list');
        const consList = document.getElementById('cons-list');

        // Update sentiment counts
        if (backendResponse.sentiment_counts) {
            const counts = backendResponse.sentiment_counts;
            if (positive) positive.textContent = counts.positive || 0;
            if (negative) negative.textContent = counts.negative || 0;
            if (neutral) neutral.textContent = counts.neutral || 0;
        } else if (backendResponse.results && Array.isArray(backendResponse.results)) {
            // Fallback: Calculate from results array
            const results = backendResponse.results;
            const positiveCount = results.filter(item => item.predicted_label === 'positive').length;
            const negativeCount = results.filter(item => item.predicted_label === 'negative').length;
            const neutralCount = results.filter(item => item.predicted_label === 'neutral').length;

            if (positive) positive.textContent = positiveCount;
            if (negative) negative.textContent = negativeCount;
            if (neutral) neutral.textContent = neutralCount;
        }

        // Update pros and cons
        if (backendResponse.pros_cons) {
            const { pros, cons } = backendResponse.pros_cons;

            if (prosList && pros && pros.length > 0) {
                prosList.innerHTML = pros.map(pro => `<li>${pro}</li>`).join('');
            } else if (prosList) {
                prosList.innerHTML = '<li>No positive themes found</li>';
            }

            if (consList && cons && cons.length > 0) {
                consList.innerHTML = cons.map(con => `<li>${con}</li>`).join('');
            } else if (consList) {
                consList.innerHTML = '<li>No negative themes found</li>';
            }
        }
    }

    // Function to update sentiment counts and pros/cons from backend response
    function updateSentimentCountsFromBackend() {
        console.log('Updating sentiment counts and pros/cons from backend response...');

        // Get the correct DOM elements
        const positive = document.getElementById('positive');
        const negative = document.getElementById('negative');
        const neutral = document.getElementById('neutral');
        const prosList = document.getElementById('pros-list');
        const consList = document.getElementById('cons-list');

        // Retrieve backend response from chrome.storage.local
        chrome.storage.local.get('backendResponse', (result) => {
            const backendResponse = result.backendResponse;
            if (backendResponse) {
                console.log('Retrieved backend response from chrome.storage.local:', backendResponse);

                // Use sentiment counts from backend if available
                if (backendResponse.sentiment_counts) {
                    const counts = backendResponse.sentiment_counts;
                    console.log('Using sentiment counts from backend:', counts);

                    // Update the counts in the popup
                    if (positive) positive.textContent = counts.positive || 0;
                    if (negative) negative.textContent = counts.negative || 0;
                    if (neutral) neutral.textContent = counts.neutral || 0;
                } else {
                    // Fallback: Calculate counts from results array (old format)
                    console.log('Fallback: Calculating counts from results array');
                    if (backendResponse.results && Array.isArray(backendResponse.results)) {
                        const results = backendResponse.results;
                        const positiveCount = results.filter(item => item.predicted_label === 'positive').length;
                        const negativeCount = results.filter(item => item.predicted_label === 'negative').length;
                        const neutralCount = results.filter(item => item.predicted_label === 'neutral').length;

                        if (positive) positive.textContent = positiveCount;
                        if (negative) negative.textContent = negativeCount;
                        if (neutral) neutral.textContent = neutralCount;
                    }
                }

                // Update pros and cons from backend RAKE keywords
                if (backendResponse.pros_cons) {
                    const { pros, cons } = backendResponse.pros_cons;
                    console.log('Using RAKE keywords from backend:', { pros, cons });

                    // Update pros list
                    if (prosList && pros && pros.length > 0) {
                        prosList.innerHTML = pros.map(pro => `<li>${pro}</li>`).join('');
                    } else if (prosList) {
                        prosList.innerHTML = '<li>No positive themes found</li>';
                    }

                    // Update cons list
                    if (consList && cons && cons.length > 0) {
                        consList.innerHTML = cons.map(con => `<li>${con}</li>`).join('');
                    } else if (consList) {
                        consList.innerHTML = '<li>No negative themes found</li>';
                    }
                }

                // Update pie chart with sentiment data from backend
                console.log('Updating chart with backend sentiment data');
                updateSentimentPieChart(backendResponse);

                // Debugging: Log after updating the DOM
                console.log('Updated sentiment counts, pros/cons, and chart from backend data.');
            } else {
                console.error('No backend response found in chrome.storage.local.');
            }
        });
    }

    // Function to create/update sentiment pie chart
    function updateSentimentPieChart(backendResponse) {
        let canvas = document.getElementById('sentiment-pie-chart');
        if (!canvas) {
            console.log('Canvas not found, recreating it...');
            // Recreate canvas if it was replaced with error message
            const chartContainer = document.querySelector('.h-48.flex.items-center.justify-center');
            if (chartContainer) {
                chartContainer.innerHTML = '<canvas id="sentiment-pie-chart" width="180" height="180" class="max-w-full max-h-full" style="display: block;"></canvas>';
                canvas = document.getElementById('sentiment-pie-chart');
            }
            if (!canvas) {
                console.error('Could not create sentiment pie chart canvas');
                return;
            }
        }

        // Set canvas dimensions explicitly
        canvas.width = 180;
        canvas.height = 180;

        const ctx = canvas.getContext('2d');

        // Get sentiment counts
        let positive = 0, negative = 0, neutral = 0;

        if (backendResponse && backendResponse.sentiment_counts) {
            positive = backendResponse.sentiment_counts.positive || 0;
            negative = backendResponse.sentiment_counts.negative || 0;
            neutral = backendResponse.sentiment_counts.neutral || 0;
        } else if (backendResponse && backendResponse.results) {
            const results = backendResponse.results;
            positive = results.filter(item => item.predicted_label === 'positive').length;
            negative = results.filter(item => item.predicted_label === 'negative').length;
            neutral = results.filter(item => item.predicted_label === 'neutral').length;
        } else {
            // Fallback: try to get from current DOM if no backend data
            const positiveEl = document.getElementById('positive');
            const negativeEl = document.getElementById('negative');
            const neutralEl = document.getElementById('neutral');

            positive = positiveEl ? parseInt(positiveEl.textContent) || 0 : 0;
            negative = negativeEl ? parseInt(negativeEl.textContent) || 0 : 0;
            neutral = neutralEl ? parseInt(neutralEl.textContent) || 0 : 0;
        }

        // Clear any existing chart
        if (window.sentimentChart) {
            window.sentimentChart.destroy();
        }

        // Always show chart - even with zero data to make it visible
        canvas.style.display = 'block';

        const total = positive + negative + neutral;
        // Use minimum values to ensure chart is visible even with zero data
        const chartData = [
            Math.max(positive, total === 0 ? 1 : positive),
            Math.max(negative, total === 0 ? 1 : negative),
            Math.max(neutral, total === 0 ? 1 : neutral)
        ];

        // Check if Chart.js is loaded
        if (typeof Chart === 'undefined') {
            console.error('Chart.js is not loaded');
            canvas.parentElement.innerHTML = '<p class="text-red-500 text-xs text-center">Chart library not loaded</p>';
            return;
        }

        // Create new chart
        try {
            window.sentimentChart = new Chart(ctx, {
                type: 'pie',
                data: {
                    labels: ['Positive', 'Negative', 'Neutral'],
                    datasets: [{
                        data: total === 0 ? chartData : [positive, negative, neutral],
                        backgroundColor: [
                            '#10B981', // Green for positive
                            '#EF4444', // Red for negative
                            '#F59E0B'  // Yellow for neutral
                        ],
                        borderColor: [
                            '#059669',
                            '#DC2626',
                            '#D97706'
                        ],
                        borderWidth: 2
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: {
                                boxWidth: 12,
                                font: {
                                    size: 10
                                },
                                padding: 10
                            }
                        },
                        tooltip: {
                            callbacks: {
                                label: function (context) {
                                    // Show actual values in tooltip
                                    const actualValues = [positive, negative, neutral];
                                    const actualValue = actualValues[context.dataIndex];
                                    const actualTotal = actualValues.reduce((a, b) => a + b, 0);

                                    if (actualTotal === 0) {
                                        return `${context.label}: 0`;
                                    }

                                    const percentage = ((actualValue / actualTotal) * 100).toFixed(1);
                                    return `${context.label}: ${actualValue} (${percentage}%)`;
                                }
                            }
                        }
                    }
                }
            });

            console.log('Sentiment pie chart updated with data:', { positive, negative, neutral });
        } catch (error) {
            console.error('Error creating sentiment chart:', error);
            canvas.parentElement.innerHTML = '<p class="text-red-500 text-xs text-center">Chart creation failed</p>';
        }
    }
});