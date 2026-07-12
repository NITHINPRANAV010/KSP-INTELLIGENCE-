import math
import re
from typing import List, Dict, Any

class SimpleVectorStore:
    def __init__(self):
        self.documents: List[Dict[str, Any]] = []
        self.vocabulary: Dict[str, int] = {}
        self.idf: Dict[str, float] = {}

    def _tokenize(self, text: str) -> List[str]:
        # Simple regex tokenization
        words = re.findall(r'\b\w+\b', text.lower())
        # Filter short terms
        return [w for w in words if len(w) > 2]

    def _compute_tf(self, tokens: List[str]) -> Dict[str, float]:
        tf = {}
        for token in tokens:
            tf[token] = tf.get(token, 0.0) + 1.0
        # Normalize
        length = len(tokens)
        if length > 0:
            for k in tf:
                tf[k] = tf[k] / length
        return tf

    def add_document(self, doc_id: str, content: str, original_obj: Dict[str, Any]):
        tokens = self._tokenize(content)
        self.documents.append({
            "id": doc_id,
            "content": content,
            "tokens": tokens,
            "original": original_obj
        })

    def build_index(self):
        # Calculate IDF
        num_docs = len(self.documents)
        doc_counts = {}
        for doc in self.documents:
            unique_tokens = set(doc["tokens"])
            for t in unique_tokens:
                doc_counts[t] = doc_counts.get(t, 0) + 1

        self.vocabulary = {term: idx for idx, term in enumerate(doc_counts.keys())}
        
        self.idf = {}
        for term, count in doc_counts.items():
            # Standard IDF formula
            self.idf[term] = math.log((1.0 + num_docs) / (1.0 + count)) + 1.0

        # Calculate TF-IDF vectors for documents
        for doc in self.documents:
            tf = self._compute_tf(doc["tokens"])
            vector = {}
            for term, val in tf.items():
                if term in self.vocabulary:
                    vector[self.vocabulary[term]] = val * self.idf[term]
            doc["vector"] = vector

    def _cosine_similarity(self, v1: Dict[int, float], v2: Dict[int, float]) -> float:
        dot_product = 0.0
        for idx, val in v1.items():
            if idx in v2:
                dot_product += val * v2[idx]

        norm1 = math.sqrt(sum(val ** 2 for val in v1.values()))
        norm2 = math.sqrt(sum(val ** 2 for val in v2.values()))

        if norm1 > 0 and norm2 > 0:
            return dot_product / (norm1 * norm2)
        return 0.0

    def search(self, query: str, top_n: int = 5) -> List[Dict[str, Any]]:
        if not self.documents:
            return []

        query_tokens = self._tokenize(query)
        query_tf = self._compute_tf(query_tokens)
        
        # Calculate query vector
        query_vector = {}
        for term, val in query_tf.items():
            if term in self.vocabulary:
                query_vector[self.vocabulary[term]] = val * self.idf[term]

        results = []
        for doc in self.documents:
            sim = self._cosine_similarity(query_vector, doc.get("vector", {}))
            if sim > 0.05: # threshold
                results.append({
                    "score": sim,
                    "doc": doc
                })

        # Sort and return
        results = sorted(results, key=lambda x: x["score"], reverse=True)
        return results[:top_n]
