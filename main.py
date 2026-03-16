from fastapi import FastAPI, BackgroundTasks, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import requests
import json
import os
import re
from transformers import pipeline as hf_pipeline
from google import genai


GEMINI_API_KEY = "AIzaSyDHAFRQxvqem1s0ih5JYpc8lIOkM2s1S1U"
client = genai.Client(api_key=GEMINI_API_KEY)

app = FastAPI(title="Reddit Complaint Listener API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

DATA_FILE = "complaint_data.json"
HEADERS = {"User-Agent": "social-listening-project"}
SUBREDDITS = ["india", "indianews", "delhi", "lucknow"]

# Load classifier once at startup
print("Loading zero-shot classifier...")
classifier = hf_pipeline(
    "zero-shot-classification",
    model="facebook/bart-large-mnli"
)
print("Classifier ready.")


def is_complaint(post_title: str) -> bool:
    labels = [
        "citizen complaint about public services",
        "general discussion or opinion"
    ]
    result = classifier(post_title, labels)
    return result["scores"][0] >= 0.5


def extract_structured(post: str) -> dict:
    prompt = f"""
Extract structured information from the Post.
If unable to find a location in the given text then take the location mentioned in the subreddit name as the location.
Also add the votes count in the JSON.
Return JSON in this format:

{{
  "topic": "string",
  "brief": "string",
  "locations": ["city or locality"],
  "sentiment_score": float between -1 and 1,
  "votes": integer
}}

Post:
{post}

Return ONLY valid JSON. No markdown, no explanation.
"""
    response = client.models.generate_content(
        model="gemini-3-flash-preview",
        contents=prompt
    )
    text = response.text.strip()
    # Strip markdown code fences if present
    text = re.sub(r"^```json\s*", "", text)
    text = re.sub(r"\s*```$", "", text)
    return json.loads(text)


def load_existing_data() -> list:
    if os.path.exists(DATA_FILE):
        with open(DATA_FILE, "r") as f:
            return json.load(f)
    return []


def save_data(data: list):
    with open(DATA_FILE, "w") as f:
        json.dump(data, f, indent=4)


@app.get("/")
def root():
    return {"status": "ok", "message": "Reddit Complaint Listener API running"}


@app.post("/scrape")
def scrape_reddit():
    """
    Scrape Reddit subreddits, classify posts, extract structured data,
    persist to JSON, and return all new complaint records.
    """
    all_data = load_existing_data()
    new_records = []

    for sub in SUBREDDITS:
        print(f"Scraping r/{sub}...")
        url = f"https://www.reddit.com/r/{sub}/new.json?limit=10"
        try:
            resp = requests.get(url, headers=HEADERS, timeout=10)
            resp.raise_for_status()
            posts = resp.json()["data"]["children"]
        except Exception as e:
            print(f"Failed to fetch r/{sub}: {e}")
            continue

        for post in posts:
            title = post["data"]["title"]
            score = post["data"]["score"]

            # Classify
            if not is_complaint(title):
                continue

            # Extract
            try:
                record = extract_structured(
                    f"Subreddit name = {sub}\nVotes = {score}\nPost= {title}"
                )
                record["subreddit"] = sub
                record["original_title"] = title
                new_records.append(record)
                all_data.append(record)
            except Exception as e:
                print(f"Extraction failed for post '{title}': {e}")
                continue
            break

    save_data(all_data)
    return {
        "status": "success",
        "scraped": len(new_records),
        "data": new_records
    }


@app.get("/complaints")
def get_all_complaints():
    """Return all persisted complaint records."""
    data = load_existing_data()
    return {"status": "ok", "count": len(data), "data": data}

"""
@app.delete("/complaints")
def clear_complaints():
    "Clear all persisted complaint data."
    save_data([])
    return {"status": "ok", "message": "All complaints cleared."}
"""