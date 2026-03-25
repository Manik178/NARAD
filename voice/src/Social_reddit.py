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

load_dotenv(".env.local")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

# Lazy init — only created when actually needed (scrape endpoint)
_client = None
def _get_genai_client():
    global _client
    if _client is None:
        _client = genai.Client(api_key=GEMINI_API_KEY)
    return _client

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

"""def extract(post):

    prompt = f"
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
        "

    response = _get_genai_client().models.generate_content(
        model="gemma-3-27b-it",
        contents=prompt
    )

    return response.text
"""


def extract_batch(posts_list):
    """
    Sends a batch of posts to Gemini to process all at once.
    """
    if not posts_list:
        return []

    # Construct a single prompt with all posts numbered
    formatted_posts = "\n---\n".join([
        f"Post {i+1}:\nSubreddit: {p['sub']}\nVotes: {p['votes']}\nContent: {p['title']}" 
        for i, p in enumerate(posts_list)
    ])

    prompt = f"""
    Extract structured information from the following list of Reddit posts.
    For each post, if unable to find a specific location, use the subreddit name.
    
    Return a JSON ARRAY containing objects with this format:
    {{
        "topic": "string",
        "brief": "string",
        "locations": ["city or locality"],
        "sentiment_score": float between -1 and 1,
        "Votes": Integer
    }}

    Posts to process:
    {formatted_posts}

    Return ONLY the valid JSON array.
    """

    response = _get_genai_client().models.generate_content(
        model="gemma-3-27b-it",
        contents=prompt
    )
    
    # Clean response text (removing markdown backticks if present)
    clean_json = response.text.replace("```json", "").replace("```", "").strip()
    return json.loads(clean_json)


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


def get_complaint_data(subreddits = ["india", "delhi", "mumbai", "bangalore", "hyderabad", "pune", "chennai", "kolkata", "lucknow", "ahmedabad"], limit=5):
    """
    Fetches posts, filters for complaints, extracts structured data, 
    and returns a list of dictionaries.
    """
    collected_for_processing = []
    headers = {"User-Agent": "social-listening-project"}

    # for sub in subreddits:
    #     print(f"Collecting from: {sub}")
    #     url = f"https://www.reddit.com/r/{sub}/new.json?limit={limit}"
        
    #     try:
    #         response = requests.get(url, headers=headers)
    #         response.raise_for_status()
    #         data = response.json()
    #     except Exception as e:
    #         print(f"Error fetching from {sub}: {e}")
    #         continue

    #     for post in data["data"]["children"]:
    #         title = post["data"]["title"]
    #         score = post["data"]["score"]

    #         # 1. Classify the post
    #         res = complaint(title)

    #         # Skip if not likely to be a citizen complaint
    #         if res['scores'][0] < 0.5:
    #             continue

    #         # 2. Extract structured information
    #         raw_output = extract(f"Subreddit name = {sub}\nVotes = {score}\n Post= {title}")

    #         try:
    #             # Clean LLM response (removes ```json ... ``` blocks)
    #             clean_output = raw_output.replace("```json", "").replace("```", "").strip()
    #             extracted_json = json.loads(clean_output)
                
    #             # Append to the final list
    #             all_complaints.append(extracted_json)
    #         except json.JSONDecodeError:
    #             print(f"Could not parse JSON for post: {title[:30]}...")
    #             continue
    # return all_complaints
    for sub in subreddits:
        print(f"Collecting from: {sub}")
        url = f"https://www.reddit.com/r/{sub}/new.json?limit={limit}"
        
        try:
            response = requests.get(url, headers=headers)
            data = response.json()

            for post in data["data"]["children"]:
                title = post["data"]["title"]
                score = post["data"]["score"]
                
                # Use local BART model for initial filtering (saves API tokens)
                res = complaint(title)
                
                if res['scores'][0] >= 0.5:
                    collected_for_processing.append({
                        "sub": sub,
                        "votes": score,
                        "title": title
                    })
        except Exception as e:
            print(f"Error scraping {sub}: {e}")

    
    if collected_for_processing:
        print(f"Processing {len(collected_for_processing)} posts with Gemini...")
        try:
            final_results = extract_batch(collected_for_processing)
            
            # Save to file
            filename = "complaint_data.json"
            if os.path.exists(filename):
                with open(filename, "r") as f:
                    existing_data = json.load(f)
            else:
                existing_data = []

            existing_data.extend(final_results)

            with open(filename, "w") as f:
                json.dump(existing_data, f, indent=4)
                
            print(f"Successfully saved {len(final_results)} items to {filename}")
            return final_results
            
        except Exception as e:
            print(f"Error during Gemini processing: {e}")
    else:
        print("No relevant complaints found to process.")



# headers = {"User-Agent": "social-listening-project"}

# subreddits = ["india", "indianews", "delhi", "lucknow"]

# posts = []

# for sub in subreddits:

#     print("Collecting from:", sub)

#     url = f"https://www.reddit.com/r/{sub}/new.json?limit=10"

#     response = requests.get(url, headers=headers)

#     data = response.json()

#     for post in data["data"]["children"]:

#         res = complaint(post["data"]["title"])

#         if (res['scores'][0] < 0.5):
#             continue

#         temp = extract("Subreddit name = " + sub + "\nVotes = " + str(post["data"]["score"]) + "\n Post= " + post["data"]["title"])

#         print(temp)

#         temp = json.loads(temp)

#         filename = "complaint_data.json"

#         if os.path.exists(filename):
#             with open(filename, "r") as f:
#                 all_data = json.load(f)
#         else:
#             all_data = []

#         all_data.append(temp)

#         with open(filename, "w") as f:
#             json.dump(all_data, f, indent=4)

if __name__=="__main__":
    print(get_complaint_data(limit=1))