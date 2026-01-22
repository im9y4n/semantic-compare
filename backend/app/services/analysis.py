from typing import List, Dict, Any, Tuple
import difflib
import logging
import time

from sentence_transformers import SentenceTransformer, util
import numpy as np
import google.generativeai as genai
from app.core.config import settings

logger = logging.getLogger(__name__)

class AnalysisEngine:
    def __init__(self, model_name: str = 'all-MiniLM-L6-v2'):
        self.provider = settings.EMBEDDING_PROVIDER.lower()
        self.hf_model = None
        
        logger.info(f"Initializing AnalysisEngine with provider: {self.provider}")
        
        if self.provider == "huggingface":
            try:
                self.hf_model = SentenceTransformer(model_name)
            except Exception as e:
                logger.error(f"Failed to load definition model {model_name}: {e}")
                
        elif self.provider == "google":
            if not settings.GOOGLE_API_KEY:
                logger.error("GOOGLE_API_KEY is missing but provider is set to 'google'. Falling back to HuggingFace.")
                self.provider = "huggingface"
                self.hf_model = SentenceTransformer(model_name)
            else:
                genai.configure(api_key=settings.GOOGLE_API_KEY)

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
        if not texts:
            return []
            
        if self.provider == "google":
            return self._compute_google_embeddings(texts)
        else:
            return self._compute_hf_embeddings(texts)

    def _compute_hf_embeddings(self, texts: List[str]) -> List[List[float]]:
        if not self.hf_model:
            logger.error("HuggingFace model not initialized")
            return []
        embeddings = self.hf_model.encode(texts)
        return embeddings.tolist()

    def _compute_google_embeddings(self, texts: List[str]) -> List[List[float]]:
        embeddings = []
        # Google API might have rate limits, process in batches if necessary
        # text-embedding-004 is a good default
        model = 'models/text-embedding-004' 
        
        try:
            # Batch processing for API efficiency
            # Verify batch size limits for Google API (often 100 or 250)
            batch_size = 100 
            for i in range(0, len(texts), batch_size):
                batch = texts[i:i + batch_size]
                result = genai.embed_content(
                    model=model,
                    content=batch,
                    task_type="semantic_similarity"
                )
                if 'embedding' in result:
                    data = result['embedding']
                    # Check if it's a list of floats (single) or list of lists (batch)
                    if isinstance(data, list):
                        if len(data) > 0 and isinstance(data[0], float):
                            # It's a single embedding (unexpected for batch request but possible if batch size=1 or API quirk)
                            embeddings.append(data)
                        elif len(data) > 0 and isinstance(data[0], list):
                            # Correct batch response
                            embeddings.extend(data)
                        else:
                            logger.warning(f"Unexpected embedding format: {type(data)} - {data[:5]}...")
                    else:
                        logger.warning(f"Unexpected embedding data type: {type(data)}")
                        
                elif 'embeddings' in result:
                     logger.info("Received 'embeddings' key.")
                     embeddings.extend(result['embeddings'])
                
                logger.info(f"Batch processed. Input size: {len(batch)}. Result embeddings: {len(embeddings) - (len(texts) - len(batch) if i > 0 else 0)}")

                    
                time.sleep(0.1) # Brief pause to be nice to rate limits
                
            return embeddings
        except Exception as e:
            logger.error(f"Google Embedding API failed: {e}")
            # Fallback? Or fail? Fail for now so user knows.
            return []

    def compute_semantic_similarity(self, emp1: List[float], emp2: List[float]) -> float:
        """
        Compute cosine similarity between two embeddings.
        """
        if not emp1 or not emp2:
            return 0.0
        # Use util.cos_sim from sentence_transformers as it is efficient
        # Ensure imports are available or use numpy manual calc
        return float(util.cos_sim(emp1, emp2)[0][0])
