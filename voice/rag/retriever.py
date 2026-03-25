import json
import faiss
import numpy as np
import os
from sentence_transformers import SentenceTransformer, CrossEncoder


MODEL_NAME = "sentence-transformers/all-MiniLM-L6-v2"
RERANK_MODEL = "cross-encoder/ms-marco-MiniLM-L-6-v2"

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
print(BASE_DIR)

GOV_INDEX = os.path.join(BASE_DIR, "index/faiss_index.bin")
print(GOV_INDEX)
GOV_META = os.path.join(BASE_DIR, "index/metadata.json")

KCC_INDEX = os.path.join(BASE_DIR, "kcc_index/kcc_index.bin")
KCC_META = os.path.join(BASE_DIR, "kcc_index/kcc_metadata.json")

class SmartRetriever:

    def __init__(self):

        print("Loading embedding model...")
        self.embedder = SentenceTransformer(MODEL_NAME)

        print("Loading reranker...")
        self.reranker = CrossEncoder(RERANK_MODEL)

        print("Loading FAISS indexes...")

        self.gov_index = faiss.read_index(GOV_INDEX)
        self.kcc_index = faiss.read_index(KCC_INDEX)

        with open(GOV_META) as f:
            self.gov_docs = json.load(f)

        with open(KCC_META) as f:
            self.kcc_docs = json.load(f)

        self._init_router()

    def _init_router(self):

        agriculture_examples = [
            "crop disease",
            "pest in wheat",
            "fertilizer recommendation",
            "irrigation problem",
            "keeda lag gaya fasal me"
        ]

        government_examples = [
            "ration card apply",
            "electricity complaint",
            "PM Kisan payment",
            "pension application",
            "land record check"
        ]

        self.agri_embed = self.embedder.encode(agriculture_examples).mean(axis=0)
        self.gov_embed = self.embedder.encode(government_examples).mean(axis=0)

    def embed(self, text):

        return self.embedder.encode([text])[0]

    def route(self, emb):

        agri_score = np.dot(emb, self.agri_embed)
        gov_score = np.dot(emb, self.gov_embed)

        if agri_score > gov_score:
            return "agriculture"

        return "government"

    def faiss_search(self, index, docs, emb, k):

        D, I = index.search(np.array([emb]), k)

        return [docs[i] for i in I[0]]

    def rerank(self, query, docs, top_k=3):

        texts = []

        for d in docs:

            if "text" in d:
                texts.append(d["text"])

            else:
                texts.append(
                    f"Question: {d['question']} Answer: {d['answer']}"
                )

        pairs = [[query, t] for t in texts]

        scores = self.reranker.predict(pairs)

        ranked = sorted(
            zip(docs, scores),
            key=lambda x: x[1],
            reverse=True
        )

        return [r[0] for r in ranked[:top_k]]

    def retrieve(self, query, faiss_k=10, final_k=3):

        emb = self.embed(query)

        domain = self.route(emb)

        if domain == "agriculture":

            candidates = self.faiss_search(
                self.kcc_index,
                self.kcc_docs,
                emb,
                faiss_k
            )

        else:

            candidates = self.faiss_search(
                self.gov_index,
                self.gov_docs,
                emb,
                faiss_k
            )

        results = self.rerank(query, candidates, final_k)

        return domain, results


if __name__ == "__main__":

    retriever = SmartRetriever()

    query = "gehun me keeda lag gaya kya kare"

    domain, results = retriever.retrieve(query)

    print("\nDetected domain:", domain)

    print("\nTop results:")

    for r in results:

        print("\n---")

        if domain == "agriculture":
            print("Question:", r["question"])
            print("Answer:", r["answer"])
        else:
            print(r["text"])