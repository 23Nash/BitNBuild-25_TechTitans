import requests

url = "http://127.0.0.1:8000/predict_batch"

payload = {
    "texts": [
        "Amazing battery life and great design!",
        "Average product, not bad but not great either.",
        "Terrible product, broke after 2 days."
    ]
}

response = requests.post(url, json=payload)
data = response.json()
for r in data['results']:
    print(r)
