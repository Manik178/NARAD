from transformers import pipeline
from sentence_transformers import SentenceTransformer
import requests
import pandas as pd
import json
from transformers import AutoTokenizer, AutoModelForCausalLM, pipeline
import torch
import os
from dotenv import load_dotenv
from google import genai
from google.genai import types

load_dotenv()
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

client = genai.Client(api_key=GEMINI_API_KEY)

from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from webdriver_manager.chrome import ChromeDriverManager
import time




"""device = torch.cuda.is_available()
print(f"Using device: {device}") # Verification

model_name = "Qwen/Qwen2.5-7B-Instruct"

tokenizer = AutoTokenizer.from_pretrained(model_name)
model = AutoModelForCausalLM.from_pretrained(
    model_name,
    dtype=torch.float16,
    device_map="auto"
)
model.to(device)
extractor = pipeline(
    "text-generation",
    model=model,
    tokenizer=tokenizer,
    max_new_tokens=300
)"""

def extract(post):

    prompt = f"""
        Extract structured information from the Post.
        If unable to find a location in the given text then take the location mentioned in the subreddit name as the location.
        Also add the votes count in the JSON
        Return JSON in this format:

        {{
        "topic": "string",
        "brief": "string",
        "locations": ["city or locality"],
        "sentiment_score": float between -1 and 1
        "Votes": Integer
        }}

        Complaint:
        {post}

        Return ONLY JSON.
        """

    response = client.models.generate_content(
        model="gemini-3-flash-preview",
        contents=prompt
    )

    return response.text


classifier = pipeline(
    "zero-shot-classification",
    model="facebook/bart-large-mnli"
)



def complaint(post):

    post = post

    labels = [
        "citizen complaint about public services",
        "general discussion or opinion"
    ]

    result = classifier(post, labels)
    return result



headers = {"User-Agent": "social-listening-project"}

subreddits = ["india", "indianews", "delhi", "lucknow"]

posts = []

for sub in subreddits:

    print("Collecting from:", sub)

    url = f"https://www.reddit.com/r/{sub}/new.json?limit=10"

    response = requests.get(url, headers=headers)

    data = response.json()

    for post in data["data"]["children"]:

        res = complaint(post["data"]["title"])

        if (res['scores'][0] < 0.5):
            continue

        temp = extract("Subreddit name = " + sub + "\nVotes = " + str(post["data"]["score"]) + "\n Post= " + post["data"]["title"])

        print(temp)

        temp = json.loads(temp)

        filename = "complaint_data.json"

        if os.path.exists(filename):
            with open(filename, "r") as f:
                all_data = json.load(f)
        else:
            all_data = []

        all_data.append(temp)

        with open(filename, "w") as f:
            json.dump(all_data, f, indent=4)

        break

