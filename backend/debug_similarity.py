import logging
import sys
import os
import numpy as np
from typing import List

# Ensure app is in path
sys.path.append(os.getcwd())

from app.core.config import settings
from app.services.analysis import AnalysisEngine

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def test_similarity():
    print(f"Loading settings...")
    print(f"EMBEDDING_PROVIDER: {settings.EMBEDDING_PROVIDER}")
    
    if settings.EMBEDDING_PROVIDER != "google":
        print("Forcing provider to google for this test...")
        settings.EMBEDDING_PROVIDER = "google"
        # Ensure API KEY is set
        if not settings.GOOGLE_API_KEY:
             print("ERROR: GOOGLE_API_KEY must be set in env")
             return

    engine = AnalysisEngine()
    
    # 1. Determinism Test
    text1 = "The quick brown fox jumps over the lazy dog."
    text2 = "The quick brown fox jumps over the lazy dog." # Same text
    
    print(f"\nComputing embeddings for identical texts...")
    embeddings = engine.compute_embeddings([text1, text2])
    
    print(f"Returned {len(embeddings)} embeddings.")
    
    if len(embeddings) != 2:
        print(f"ERROR: Expected 2 embeddings, got {len(embeddings)}")
        return

    vec1 = np.array(embeddings[0])
    vec2 = np.array(embeddings[1])
    
    print(f"Vec1 shape: {vec1.shape}")
    print(f"Vec2 shape: {vec2.shape}")
    
    # Check if they are identical
    are_close = np.allclose(vec1, vec2)
    print(f"Vectors identical? {are_close}")
    
    if not are_close:
        print("WARNING: Embeddings for same text are NOT identical!")
        diff = np.abs(vec1 - vec2)
        print(f"Max diff: {np.max(diff)}")
        
    # 2. Similarity Calculation
    sim = engine.compute_semantic_similarity(embeddings[0], embeddings[1])
    print(f"Self-Similarity Score (should be 1.0): {sim}")

    # 3. Document-Level Mean Test
    # Simulate a document with 2 segments
    doc_segs = ["Segment one content", "Segment two content"]
    
    print("\nComputing document-level similarity (Doc vs Doc)...")
    doc_embs1 = engine.compute_embeddings(doc_segs)
    doc_embs2 = engine.compute_embeddings(doc_segs)
    
    mean1 = np.mean(doc_embs1, axis=0).tolist()
    mean2 = np.mean(doc_embs2, axis=0).tolist()
    
    doc_sim = engine.compute_semantic_similarity(mean1, mean2)
    print(f"Document Self-Similarity: {doc_sim}")
    
if __name__ == "__main__":
    test_similarity()
