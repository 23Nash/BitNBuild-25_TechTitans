# Review Radar

## Overview
Review Radar is a Chrome extension designed to analyze reviews and provide insights into customer sentiment. It features a user-friendly popup interface that displays sentiment breakdowns, pros and cons from reviews, and trends over time.

## Features
- **Sentiment Analysis**: Analyze reviews to determine overall sentiment (Positive, Negative, Neutral).
- **Visual Charts**: Display sentiment breakdown using a pie chart and trends over time using a line or bar chart.
- **Keyword Extraction**: Highlight top keywords from positive and negative reviews.

## Project Structure
```
review-radar
├── src
│   ├── popup
│   │   ├── popup.html
│   │   ├── popup.css
│   │   ├── popup.js
│   │   └── charts
│   │       ├── sentiment-pie.js
│   │       └── trend-chart.js
│   ├── assets
│   │   └── icons
│   │       └── icon.svg
│   └── manifest.json
├── tailwind.config.js
├── package.json
└── README.md
```

## Setup Instructions
1. Clone the repository:
   ```
   git clone <repository-url>
   ```
2. Navigate to the project directory:
   ```
   cd review-radar
   ```
3. Install dependencies:
   ```
   npm install
   ```
4. Build the project (if necessary):
   ```
   npm run build
   ```
5. Load the extension in Chrome:
   - Go to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked" and select the `src` directory.

## Usage
- Click on the Review Radar icon in the Chrome toolbar to open the popup.
- Press the "Analyze Reviews" button to see sentiment analysis results and visualizations.

## License
This project is licensed under the MIT License. See the LICENSE file for details.