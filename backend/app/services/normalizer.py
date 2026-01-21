import re
from typing import List, Dict, Any

class TextNormalizer:
    def normalize(self, segments: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Normalize text segments by masking dates, ignoring headers/footers etc.
        """
        normalized = []
        for seg in segments:
            text = seg["text"]
            
            # Simple heuristic: Ignore short lines that look like page numbers
            if len(text) < 5 and text.isdigit():
                 seg["ignored"] = True
                 seg["reason"] = "page_number"
            
            # Mask dates (YYYY-MM-DD)
            text = re.sub(r'\d{4}-\d{2}-\d{2}', '[DATE]', text)
            
            # Update text
            seg["normalized_text"] = text
            normalized.append(seg)
            
        return normalized
