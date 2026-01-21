import pdfplumber
import io
import logging
from typing import List, Dict, Any

logger = logging.getLogger(__name__)

class TextExtractor:
    def extract_from_pdf(self, content: bytes) -> List[Dict[str, Any]]:
        """
        Extract text from PDF bytes. Returns a list of segments (paragraphs/pages).
        """
        segments = []
        try:
            with pdfplumber.open(io.BytesIO(content)) as pdf:
                for i, page in enumerate(pdf.pages):
                    text = page.extract_text()
                    if text:
                        # Split by paragraphs (double newline)
                        paragraphs = text.split('\n\n')
                        for p in paragraphs:
                            if p.strip():
                                segments.append({
                                    "page": i + 1,
                                    "text": p.strip(),
                                    "type": "paragraph"
                                })
        except Exception as e:
            logger.error(f"Error extracting PDF text: {e}")
        
        # Fallback to OCR if no text found and tesseract is available
        if not segments:
            segments = self.extract_with_ocr(content)

        return segments

    def extract_with_ocr(self, content: bytes) -> List[Dict[str, Any]]:
        """
        Extract text using OCR (Tesseract) via pdf2image and pytesseract.
        """
        segments = []
        try:
            from pdf2image import convert_from_bytes
            import pytesseract
            
            try:
                # Check if tesseract is available
                pytesseract.get_tesseract_version()
            except pytesseract.TesseractNotFoundError:
                logger.warning("Tesseract not found. OCR skipped. Please install tesseract-ocr.")
                return []

            images = convert_from_bytes(content)
            for i, image in enumerate(images):
                text = pytesseract.image_to_string(image)
                if text:
                    paragraphs = text.split('\n\n')
                    for p in paragraphs:
                        if p.strip():
                            segments.append({
                                "page": i + 1,
                                "text": p.strip(),
                                "type": "ocr_paragraph"
                            })
        except ImportError:
             logger.warning("pdf2image or pytesseract not installed.")
        except Exception as e:
            logger.error(f"OCR failed: {e}")
            
        return segments

    def extract_from_html(self, content: bytes) -> List[Dict[str, Any]]:
        # Placeholder for HTML extraction (BeautifulSoup)
        # TODO: Implement HTML to PDF conversion or direct extraction
        return []
