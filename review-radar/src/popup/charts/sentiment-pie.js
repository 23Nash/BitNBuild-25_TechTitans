const ctx = document.getElementById('sentimentPieChart').getContext('2d');

const sentimentData = {
    labels: ['Positive', 'Negative', 'Neutral'],
    datasets: [{
        data: [30, 20, 50], // Placeholder data
        backgroundColor: [
            'rgba(75, 192, 192, 0.6)',
            'rgba(255, 99, 132, 0.6)',
            'rgba(255, 206, 86, 0.6)'
        ],
        borderColor: [
            'rgba(75, 192, 192, 1)',
            'rgba(255, 99, 132, 1)',
            'rgba(255, 206, 86, 1)'
        ],
        borderWidth: 1
    }]
};

const sentimentPieChart = new Chart(ctx, {
    type: 'pie',
    data: sentimentData,
    options: {
        responsive: true,
        plugins: {
            legend: {
                position: 'top',
            },
            title: {
                display: true,
                text: 'Sentiment Breakdown'
            }
        }
    }
});