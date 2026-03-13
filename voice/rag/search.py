import json
import faiss
import numpy as np
from sentence_transformers import SentenceTransformer

INDEX_PATH = "rag/index/faiss_index.bin"
META_PATH = "rag/index/metadata.json"

model = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")

index = faiss.read_index(INDEX_PATH)

with open(META_PATH) as f:
    docs = json.load(f)


def search(query, k=3):

    query_embedding = model.encode([query])

    distances, indices = index.search(
        np.array(query_embedding), k
    )

    results = []

    for i in indices[0]:
        results.append(docs[i])

    return results


if __name__ == "__main__":

    query = "gaon me bijli nahi aa rahi"

    results = search(query)

    for r in results:
        print(r["text"])