const ctx = document.getElementById('trendChart').getContext('2d');

const trendChart = new Chart(ctx, {
    type: 'line',
    data: {
        labels: ['Jan 2024', 'Feb 2024', 'Mar 2024', 'Apr 2024', 'May 2024'],
        datasets: [{
            label: 'Sentiment Over Time',
            data: [10, 15, 5, 20, 25], // Placeholder data for sentiment counts
            backgroundColor: 'rgba(75, 192, 192, 0.2)',
            borderColor: 'rgba(75, 192, 192, 1)',
            borderWidth: 2,
            fill: true,
        }]
    },
    options: {
        responsive: true,
        scales: {
            y: {
                beginAtZero: true,
                title: {
                    display: true,
                    text: 'Sentiment Count'
                }
            },
            x: {
                title: {
                    display: true,
                    text: 'Date'
                }
            }
        }
    }
});