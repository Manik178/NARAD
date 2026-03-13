import os
import json
import faiss
import numpy as np
from sentence_transformers import SentenceTransformer

KB_FOLDER = "src/knowledge_base"
INDEX_FOLDER = "index"

EMBED_MODEL = "sentence-transformers/all-MiniLM-L6-v2"


def load_documents():
    docs = []

    for file in os.listdir(KB_FOLDER):
        if file.endswith(".txt"):
            path = os.path.join(KB_FOLDER, file)

            with open(path, "r", encoding="utf-8") as f:
                content = f.read()

            docs.append({
                "id": file,
                "text": content
            })

    return docs


def build_embeddings(docs):

    model = SentenceTransformer(EMBED_MODEL)

    texts = [doc["text"] for doc in docs]

    embeddings = model.encode(
        texts,
        convert_to_numpy=True,
        show_progress_bar=True
    )

    return embeddings


def build_faiss_index(embeddings):

    dim = embeddings.shape[1]

    index = faiss.IndexFlatL2(dim)

    index.add(embeddings)

    return index


def save_index(index, docs):

    os.makedirs(INDEX_FOLDER, exist_ok=True)

    faiss.write_index(index, f"{INDEX_FOLDER}/faiss_index.bin")

    with open(f"{INDEX_FOLDER}/metadata.json", "w") as f:
        json.dump(docs, f, indent=2)


def main():

    print("Loading documents...")

    docs = load_documents()

    print(f"Loaded {len(docs)} documents")

    print("Generating embeddings...")

    embeddings = build_embeddings(docs)

    print("Building FAISS index...")

    index = build_faiss_index(embeddings)

    print("Saving index...")

    save_index(index, docs)

    print("Index created successfully!")


if __name__ == "__main__":
    main()