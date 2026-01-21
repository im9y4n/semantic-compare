from typing import List, Dict, Any, Tuple
import difflib
from sentence_transformers import SentenceTransformer, util
import numpy as np
import logging

logger = logging.getLogger(__name__)

class AnalysisEngine:
    def __init__(self, model_name: str = 'all-MiniLM-L6-v2'):
        try:
            self.model = SentenceTransformer(model_name)
        except Exception as e:
            logger.error(f"Failed to load definition model {model_name}: {e}")
            self.model = None

    def compute_text_diff(self, old_text: str, new_text: str) -> List[Dict[str, Any]]:
        """
        Compute textual diff using difflib.
        Returns a list of changes: {"type": "add"|"remove"|"equal", "content": "..."}
        """
        d = difflib.Differ()
        diff = list(d.compare(old_text.splitlines(), new_text.splitlines()))
        
        changes = []
        for line in diff:
            if line.startswith('  '):
                changes.append({"type": "equal", "content": line[2:]})
            elif line.startswith('- '):
                changes.append({"type": "remove", "content": line[2:]})
            elif line.startswith('+ '):
                changes.append({"type": "add", "content": line[2:]})
        return changes

    def compute_embeddings(self, texts: List[str]) -> List[List[float]]:
        if not self.model:
            return []
        embeddings = self.model.encode(texts)
        return embeddings.tolist()

    def compute_semantic_similarity(self, emp1: List[float], emp2: List[float]) -> float:
        """
        Compute cosine similarity between two embeddings.
        """
        if not emp1 or not emp2:
            return 0.0
        return float(util.cos_sim(emp1, emp2)[0][0])
