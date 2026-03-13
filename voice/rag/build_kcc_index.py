import pandas as pd
import numpy as np
import faiss
import json
import re
import uuid
import os
from sentence_transformers import SentenceTransformer

DATA_PATH = "src/rag/datasets/questionsv4.csv"
INDEX_DIR = "src/rag/kcc_index"

MODEL = "sentence-transformers/all-MiniLM-L6-v2"

MIN_QUERY_LEN = 10
MIN_ANSWER_LEN = 10


def clean_text(text):

    if pd.isna(text):
        return ""

    text = str(text).lower()

    text = re.sub(r"\s+", " ", text)

    text = re.sub(r"[^\w\s]", "", text)

    return text.strip()


def load_dataset():

    df = pd.read_csv(DATA_PATH)

    df["questions"] = df["questions"].apply(clean_text)
    df["answers"] = df["answers"].apply(clean_text)

    df = df.dropna()

    df = df[
        (df["questions"].str.len() > MIN_QUERY_LEN) &
        (df["answers"].str.len() > MIN_ANSWER_LEN)
    ]

    df = df.drop_duplicates(subset=["questions"])

    return df


def create_documents(df):

    docs = []

    for _, row in df.iterrows():

        q = row["questions"]
        a = row["answers"]

        text = f"""
Farmer Question:
{q}

Agricultural Advisory:
{a}
"""

        docs.append({
            "id": str(uuid.uuid4()),
            "question": q,
            "answer": a,
            "text": text.strip()
        })

    return docs


def embed_documents(docs):

    model = SentenceTransformer(MODEL)

    texts = [d["text"] for d in docs]

    embeddings = model.encode(
        texts,
        convert_to_numpy=True,
        show_progress_bar=True
    )

    return embeddings


def build_faiss(embeddings):

    dim = embeddings.shape[1]

    index = faiss.IndexFlatL2(dim)

    index.add(embeddings)

    return index


def save_index(index, docs):

    os.makedirs(INDEX_DIR, exist_ok=True)

    faiss.write_index(index, f"{INDEX_DIR}/kcc_index.bin")

    with open(f"{INDEX_DIR}/kcc_metadata.json", "w") as f:

        json.dump(docs, f, indent=2)


def main():

    print("Loading dataset...")

    df = load_dataset()

    print("Rows after cleaning:", len(df))

    print("Creating documents...")

    docs = create_documents(df)

    print("Generating embeddings...")

    embeddings = embed_documents(docs)

    print("Building FAISS index...")

    index = build_faiss(embeddings)

    print("Saving index...")

    save_index(index, docs)

    print("KCC FAISS index created successfully!")


if __name__ == "__main__":
    main()