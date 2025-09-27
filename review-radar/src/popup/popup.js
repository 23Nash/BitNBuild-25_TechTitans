// This file contains the JavaScript logic for the popup, handling the button click event to analyze reviews and dynamically updating the results section with placeholder data.

document.addEventListener('DOMContentLoaded', function () {
    const analyzeButton = document.getElementById('analyze-button');
    const positiveCount = document.getElementById('positive-count');
    const negativeCount = document.getElementById('negative-count');
    const neutralCount = document.getElementById('neutral-count');
    const prosList = document.getElementById('pros-list');
    const consList = document.getElementById('cons-list');

    analyzeButton.addEventListener('click', function () {
        // Placeholder data
        const sentimentData = {
            positive: 120,
            negative: 30,
            neutral: 50,
        };

        const pros = ['Great service', 'Fast delivery', 'Excellent quality'];
        const cons = ['Late delivery', 'Poor customer service', 'Damaged product'];

        // Update sentiment counts
        positiveCount.textContent = sentimentData.positive;
        negativeCount.textContent = sentimentData.negative;
        neutralCount.textContent = sentimentData.neutral;

        // Update pros and cons lists
        prosList.innerHTML = pros.map(pro => `<li>${pro}</li>`).join('');
        consList.innerHTML = cons.map(con => `<li>${con}</li>`).join('');

        // Call functions to render charts (to be implemented in their respective files)
        renderSentimentPieChart(sentimentData);
        renderTrendChart(); // Placeholder function call
    });
});